/**
 * Trading Signals Model
 * Database operations for trading signals and correlation data
 */

const { query } = require('../database/connection');

class TradingSignalsModel {
  /**
   * Get all trading signals
   * @param {boolean} activeOnly - Get only active signals
   * @returns {Promise<Array>} Trading signals
   */
  static async getAllSignals(activeOnly = true) {
    try {
      let queryText = `
        SELECT ts.id, ts.crypto_id, ts.symbol, ts.signal_type, ts.strength,
               ts.correlation, ts.btc_price, ts.reason, ts.confidence,
               ts.timestamp, ts.is_active,
               c.name as crypto_name
        FROM trading_signals ts
        JOIN cryptocurrencies c ON ts.crypto_id = c.id
      `;
      
      if (activeOnly) {
        queryText += ' WHERE ts.is_active = true';
      }
      
      queryText += ' ORDER BY ts.timestamp DESC';
      
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error getting all trading signals:', error);
      throw error;
    }
  }

  /**
   * Get trading signals by symbol
   * @param {string} symbol - Crypto symbol
   * @param {boolean} activeOnly - Get only active signals
   * @returns {Promise<Array>} Trading signals for symbol
   */
  static async getSignalsBySymbol(symbol, activeOnly = true) {
    try {
      let queryText = `
        SELECT ts.id, ts.crypto_id, ts.symbol, ts.signal_type, ts.strength,
               ts.correlation, ts.btc_price, ts.reason, ts.confidence,
               ts.timestamp, ts.is_active,
               c.name as crypto_name
        FROM trading_signals ts
        JOIN cryptocurrencies c ON ts.crypto_id = c.id
        WHERE ts.symbol = $1
      `;
      
      if (activeOnly) {
        queryText += ' AND ts.is_active = true';
      }
      
      queryText += ' ORDER BY ts.timestamp DESC';
      
      const result = await query(queryText, [symbol]);
      return result.rows;
    } catch (error) {
      console.error('Error getting signals by symbol:', error);
      throw error;
    }
  }

  /**
   * Get latest signals for all cryptocurrencies
   * @returns {Promise<Object>} Latest signals by symbol
   */
  static async getLatestSignals() {
    try {
      const result = await query(`
        SELECT DISTINCT ON (ts.symbol)
          ts.id, ts.crypto_id, ts.symbol, ts.signal_type, ts.strength,
          ts.correlation, ts.btc_price, ts.reason, ts.confidence,
          ts.timestamp, ts.is_active,
          c.name as crypto_name
        FROM trading_signals ts
        JOIN cryptocurrencies c ON ts.crypto_id = c.id
        WHERE ts.is_active = true
        ORDER BY ts.symbol, ts.timestamp DESC
      `);
      
      // Convert to object with symbol as key
      const signals = {};
      result.rows.forEach(row => {
        signals[row.symbol] = row;
      });
      
      return signals;
    } catch (error) {
      console.error('Error getting latest signals:', error);
      throw error;
    }
  }

  /**
   * Add trading signal
   * @param {Object} signalData - Signal data
   * @returns {Promise<Object>} Added signal
   */
  static async addSignal(signalData) {
    try {
      // Get crypto ID if not provided
      let cryptoId = signalData.cryptoId;
      if (!cryptoId) {
        const cryptoResult = await query(
          'SELECT id FROM cryptocurrencies WHERE symbol = $1',
          [signalData.symbol]
        );
        if (cryptoResult.rows.length === 0) {
          throw new Error(`Cryptocurrency ${signalData.symbol} not found`);
        }
        cryptoId = cryptoResult.rows[0].id;
      }
      
      const result = await query(`
        INSERT INTO trading_signals (
          crypto_id, symbol, signal_type, strength, correlation,
          btc_price, reason, confidence, timestamp, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        cryptoId,
        signalData.symbol,
        signalData.signalType,
        signalData.strength,
        signalData.correlation,
        signalData.btcPrice,
        signalData.reason,
        signalData.confidence,
        signalData.timestamp || new Date(),
        signalData.isActive !== undefined ? signalData.isActive : true
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding trading signal:', error);
      throw error;
    }
  }

  /**
   * Update trading signal
   * @param {string} signalId - Signal ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated signal
   */
  static async updateSignal(signalId, updateData) {
    try {
      const allowedFields = ['signal_type', 'strength', 'correlation', 'btc_price', 'reason', 'confidence', 'is_active'];
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          updateValues.push(updateData[field]);
          paramIndex++;
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateValues.push(signalId);
      
      const result = await query(`
        UPDATE trading_signals 
        SET ${updateFields.join(', ')}, timestamp = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `, updateValues);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating trading signal:', error);
      throw error;
    }
  }

  /**
   * Deactivate trading signal
   * @param {string} signalId - Signal ID
   * @returns {Promise<boolean>} Deactivation success
   */
  static async deactivateSignal(signalId) {
    try {
      const result = await query(`
        UPDATE trading_signals 
        SET is_active = false, timestamp = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [signalId]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deactivating signal:', error);
      throw error;
    }
  }

  /**
   * Get correlation data
   * @param {string} symbol1 - First symbol
   * @param {string} symbol2 - Second symbol
   * @param {number} limit - Limit number of records
   * @returns {Promise<Array>} Correlation data
   */
  static async getCorrelationData(symbol1, symbol2 = null, limit = 100) {
    try {
      let queryText = `
        SELECT cd.id, cd.symbol1, cd.symbol2, cd.correlation, cd.p_value,
               cd.sample_size, cd.time_period, cd.timestamp,
               c1.name as name1, c2.name as name2
        FROM correlation_data cd
        JOIN cryptocurrencies c1 ON cd.crypto1_id = c1.id
        JOIN cryptocurrencies c2 ON cd.crypto2_id = c2.id
        WHERE cd.symbol1 = $1
      `;
      let params = [symbol1];
      
      if (symbol2) {
        queryText += ' AND cd.symbol2 = $2';
        params.push(symbol2);
      }
      
      queryText += ' ORDER BY cd.timestamp DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting correlation data:', error);
      throw error;
    }
  }

  /**
   * Add correlation data
   * @param {Object} correlationData - Correlation data
   * @returns {Promise<Object>} Added correlation data
   */
  static async addCorrelationData(correlationData) {
    try {
      // Get crypto IDs if not provided
      let crypto1Id = correlationData.crypto1Id;
      let crypto2Id = correlationData.crypto2Id;
      
      if (!crypto1Id) {
        const crypto1Result = await query(
          'SELECT id FROM cryptocurrencies WHERE symbol = $1',
          [correlationData.symbol1]
        );
        if (crypto1Result.rows.length === 0) {
          throw new Error(`Cryptocurrency ${correlationData.symbol1} not found`);
        }
        crypto1Id = crypto1Result.rows[0].id;
      }
      
      if (!crypto2Id) {
        const crypto2Result = await query(
          'SELECT id FROM cryptocurrencies WHERE symbol = $1',
          [correlationData.symbol2]
        );
        if (crypto2Result.rows.length === 0) {
          throw new Error(`Cryptocurrency ${correlationData.symbol2} not found`);
        }
        crypto2Id = crypto2Result.rows[0].id;
      }
      
      const result = await query(`
        INSERT INTO correlation_data (
          crypto1_id, crypto2_id, symbol1, symbol2, correlation,
          p_value, sample_size, time_period, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        crypto1Id,
        crypto2Id,
        correlationData.symbol1,
        correlationData.symbol2,
        correlationData.correlation,
        correlationData.pValue,
        correlationData.sampleSize,
        correlationData.timePeriod || '30d',
        correlationData.timestamp || new Date()
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding correlation data:', error);
      throw error;
    }
  }

  /**
   * Get top correlated pairs
   * @param {string} symbol - Base symbol
   * @param {number} limit - Limit number of results
   * @returns {Promise<Array>} Top correlated pairs
   */
  static async getTopCorrelatedPairs(symbol, limit = 10) {
    try {
      const result = await query(`
        SELECT DISTINCT ON (cd.symbol2)
          cd.symbol1, cd.symbol2, cd.correlation, cd.p_value, cd.timestamp,
          c1.name as name1, c2.name as name2
        FROM correlation_data cd
        JOIN cryptocurrencies c1 ON cd.crypto1_id = c1.id
        JOIN cryptocurrencies c2 ON cd.crypto2_id = c2.id
        WHERE cd.symbol1 = $1 AND cd.symbol2 != $1
        ORDER BY cd.symbol2, cd.timestamp DESC
        LIMIT $2
      `, [symbol, limit]);
      
      return result.rows
        .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top correlated pairs:', error);
      throw error;
    }
  }

  /**
   * Generate trading signals based on correlation analysis
   * @param {string} symbol - Crypto symbol
   * @returns {Promise<Object>} Generated signal
   */
  static async generateSignal(symbol) {
    try {
      // Get latest correlation data for the symbol
      const correlations = await this.getTopCorrelatedPairs(symbol, 5);
      
      if (correlations.length === 0) {
        return null;
      }
      
      // Calculate average correlation strength
      const avgCorrelation = correlations.reduce((sum, corr) => sum + Math.abs(corr.correlation), 0) / correlations.length;
      
      // Get latest price data
      const priceResult = await query(`
        SELECT cp.price, cp.change_percent
        FROM crypto_prices cp
        JOIN cryptocurrencies c ON cp.crypto_id = c.id
        WHERE c.symbol = $1
        ORDER BY cp.timestamp DESC
        LIMIT 1
      `, [symbol]);
      
      if (priceResult.rows.length === 0) {
        return null;
      }
      
      const priceData = priceResult.rows[0];
      
      // Generate signal based on correlation and price movement
      let signalType = 'HOLD';
      let strength = 50;
      let reason = '';
      
      if (avgCorrelation > 0.7) {
        if (priceData.change_percent > 2) {
          signalType = 'BUY';
          strength = Math.min(90, 60 + priceData.change_percent * 5);
          reason = `Strong positive correlation (${avgCorrelation.toFixed(2)}) with significant price movement (${priceData.change_percent.toFixed(2)}%)`;
        } else if (priceData.change_percent < -2) {
          signalType = 'SELL';
          strength = Math.min(90, 60 + Math.abs(priceData.change_percent) * 5);
          reason = `Strong positive correlation (${avgCorrelation.toFixed(2)}) with significant price decline (${priceData.change_percent.toFixed(2)}%)`;
        }
      } else if (avgCorrelation > 0.4) {
        if (priceData.change_percent > 1) {
          signalType = 'BUY';
          strength = Math.min(70, 50 + priceData.change_percent * 3);
          reason = `Moderate positive correlation (${avgCorrelation.toFixed(2)}) with price movement (${priceData.change_percent.toFixed(2)}%)`;
        } else if (priceData.change_percent < -1) {
          signalType = 'SELL';
          strength = Math.min(70, 50 + Math.abs(priceData.change_percent) * 3);
          reason = `Moderate positive correlation (${avgCorrelation.toFixed(2)}) with price decline (${priceData.change_percent.toFixed(2)}%)`;
        }
      } else {
        signalType = 'HOLD';
        strength = 30;
        reason = `Low correlation strength (${avgCorrelation.toFixed(2)}) - hold position`;
      }
      
      // Add the signal
      const signal = await this.addSignal({
        symbol,
        signalType,
        strength,
        correlation: avgCorrelation,
        btcPrice: priceData.price,
        reason,
        confidence: Math.min(100, strength + (avgCorrelation * 20))
      });
      
      return signal;
    } catch (error) {
      console.error('Error generating signal:', error);
      throw error;
    }
  }

  /**
   * Get signal statistics
   * @returns {Promise<Object>} Signal statistics
   */
  static async getSignalStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_signals,
          COUNT(CASE WHEN signal_type = 'BUY' THEN 1 END) as buy_signals,
          COUNT(CASE WHEN signal_type = 'SELL' THEN 1 END) as sell_signals,
          COUNT(CASE WHEN signal_type = 'HOLD' THEN 1 END) as hold_signals,
          AVG(strength) as avg_strength,
          AVG(confidence) as avg_confidence
        FROM trading_signals 
        WHERE is_active = true
        AND timestamp >= CURRENT_DATE - INTERVAL '24 hours'
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting signal stats:', error);
      throw error;
    }
  }
}

module.exports = TradingSignalsModel;
