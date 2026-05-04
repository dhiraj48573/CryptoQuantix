/**
 * Crypto Model
 * Database operations for cryptocurrency data
 */

const { query } = require('../database/connection');

class CryptoModel {
  /**
   * Get all cryptocurrencies
   * @returns {Promise<Array>} List of cryptocurrencies
   */
  static async getAll() {
    try {
      const result = await query(`
        SELECT id, symbol, name, description, market_cap, circulating_supply, 
               max_supply, week_52_high, week_52_low, is_active, created_at, updated_at
        FROM cryptocurrencies 
        WHERE is_active = true 
        ORDER BY market_cap DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting all cryptocurrencies:', error);
      throw error;
    }
  }

  /**
   * Get cryptocurrency by symbol
   * @param {string} symbol - Crypto symbol
   * @returns {Promise<Object>} Cryptocurrency data
   */
  static async getBySymbol(symbol) {
    try {
      const result = await query(`
        SELECT id, symbol, name, description, market_cap, circulating_supply, 
               max_supply, week_52_high, week_52_low, is_active, created_at, updated_at
        FROM cryptocurrencies 
        WHERE symbol = $1 AND is_active = true
      `, [symbol]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting cryptocurrency by symbol:', error);
      throw error;
    }
  }

  /**
   * Get latest price for a cryptocurrency
   * @param {string} symbol - Crypto symbol
   * @returns {Promise<Object>} Latest price data
   */
  static async getLatestPrice(symbol) {
    try {
      const result = await query(`
        SELECT cp.price, cp.change_amount, cp.change_percent, cp.volume, 
               cp.day_high, cp.day_low, cp.data_source, cp.timestamp,
               c.symbol, c.name
        FROM crypto_prices cp
        JOIN cryptocurrencies c ON cp.crypto_id = c.id
        WHERE c.symbol = $1
        ORDER BY cp.timestamp DESC
        LIMIT 1
      `, [symbol]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting latest price:', error);
      throw error;
    }
  }

  /**
   * Get latest prices for all cryptocurrencies
   * @returns {Promise<Array>} Latest prices for all cryptos
   */
  static async getLatestPrices() {
    try {
      const result = await query(`
        SELECT DISTINCT ON (c.symbol)
          c.id, c.symbol, c.name, c.description, c.market_cap, c.circulating_supply,
          cp.price, cp.change_amount, cp.change_percent, cp.volume, 
          cp.day_high, cp.day_low, cp.data_source, cp.timestamp
        FROM cryptocurrencies c
        LEFT JOIN crypto_prices cp ON c.id = cp.crypto_id
        WHERE c.is_active = true
        ORDER BY c.symbol, cp.timestamp DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting latest prices:', error);
      throw error;
    }
  }

  /**
   * Get price history for a cryptocurrency
   * @param {string} symbol - Crypto symbol
   * @param {number} limit - Limit number of records
   * @returns {Promise<Array>} Price history
   */
  static async getPriceHistory(symbol, limit = 100) {
    try {
      const result = await query(`
        SELECT price, change_amount, change_percent, volume, 
               day_high, day_low, timestamp
        FROM crypto_prices cp
        JOIN cryptocurrencies c ON cp.crypto_id = c.id
        WHERE c.symbol = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [symbol, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting price history:', error);
      throw error;
    }
  }

  /**
   * Insert or update cryptocurrency price
   * @param {Object} priceData - Price data
   * @returns {Promise<Object>} Inserted price data
   */
  static async upsertPrice(priceData) {
    const client = await require('../database/connection').getClient();
    try {
      await client.query('BEGIN');
      
      // Get crypto ID
      const cryptoResult = await client.query(
        'SELECT id FROM cryptocurrencies WHERE symbol = $1',
        [priceData.symbol]
      );
      
      if (cryptoResult.rows.length === 0) {
        throw new Error(`Cryptocurrency ${priceData.symbol} not found`);
      }
      
      const cryptoId = cryptoResult.rows[0].id;
      
      // Insert new price record
      const result = await client.query(`
        INSERT INTO crypto_prices (
          crypto_id, price, change_amount, change_percent, volume, 
          day_high, day_low, data_source, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        cryptoId,
        priceData.price,
        priceData.changeAmount || 0,
        priceData.changePercent || 0,
        priceData.volume || 0,
        priceData.dayHigh || priceData.price,
        priceData.dayLow || priceData.price,
        priceData.dataSource || 'mock',
        priceData.timestamp || new Date()
      ]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error upserting price:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get top gainers
   * @param {number} limit - Limit number of results
   * @returns {Promise<Array>} Top gainers
   */
  static async getTopGainers(limit = 10) {
    try {
      const result = await query(`
        SELECT DISTINCT ON (c.symbol)
          c.symbol, c.name, cp.price, cp.change_percent, cp.timestamp
        FROM cryptocurrencies c
        JOIN crypto_prices cp ON c.id = cp.crypto_id
        WHERE c.is_active = true AND cp.change_percent > 0
        ORDER BY c.symbol, cp.timestamp DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows
        .sort((a, b) => b.change_percent - a.change_percent)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top gainers:', error);
      throw error;
    }
  }

  /**
   * Get top losers
   * @param {number} limit - Limit number of results
   * @returns {Promise<Array>} Top losers
   */
  static async getTopLosers(limit = 10) {
    try {
      const result = await query(`
        SELECT DISTINCT ON (c.symbol)
          c.symbol, c.name, cp.price, cp.change_percent, cp.timestamp
        FROM cryptocurrencies c
        JOIN crypto_prices cp ON c.id = cp.crypto_id
        WHERE c.is_active = true AND cp.change_percent < 0
        ORDER BY c.symbol, cp.timestamp DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows
        .sort((a, b) => a.change_percent - b.change_percent)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top losers:', error);
      throw error;
    }
  }

  /**
   * Search cryptocurrencies by name or symbol
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  static async search(searchTerm) {
    try {
      const result = await query(`
        SELECT id, symbol, name, description, market_cap
        FROM cryptocurrencies 
        WHERE is_active = true 
        AND (symbol ILIKE $1 OR name ILIKE $1)
        ORDER BY market_cap DESC
        LIMIT 20
      `, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error searching cryptocurrencies:', error);
      throw error;
    }
  }
}

module.exports = CryptoModel;
