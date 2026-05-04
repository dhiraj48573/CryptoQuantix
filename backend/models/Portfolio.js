/**
 * Portfolio Model
 * Database operations for user portfolios and positions
 */

const { query, getClient } = require('../database/connection');

class PortfolioModel {
  /**
   * Get user portfolio
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User portfolio
   */
  static async getUserPortfolio(userId) {
    try {
      const result = await query(`
        SELECT cash, total_value, total_cost, total_unrealized_pnl, 
               total_unrealized_pnl_percent, day_pnl, day_pnl_percent,
               total_realized_pnl, win_rate, total_trades, updated_at
        FROM user_portfolios 
        WHERE user_id = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      throw error;
    }
  }

  /**
   * Create or update user portfolio
   * @param {string} userId - User ID
   * @param {Object} portfolioData - Portfolio data
   * @returns {Promise<Object>} Updated portfolio
   */
  static async updatePortfolio(userId, portfolioData) {
    try {
      const result = await query(`
        INSERT INTO user_portfolios (
          user_id, cash, total_value, total_cost, total_unrealized_pnl,
          total_unrealized_pnl_percent, day_pnl, day_pnl_percent,
          total_realized_pnl, win_rate, total_trades
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          cash = EXCLUDED.cash,
          total_value = EXCLUDED.total_value,
          total_cost = EXCLUDED.total_cost,
          total_unrealized_pnl = EXCLUDED.total_unrealized_pnl,
          total_unrealized_pnl_percent = EXCLUDED.total_unrealized_pnl_percent,
          day_pnl = EXCLUDED.day_pnl,
          day_pnl_percent = EXCLUDED.day_pnl_percent,
          total_realized_pnl = EXCLUDED.total_realized_pnl,
          win_rate = EXCLUDED.win_rate,
          total_trades = EXCLUDED.total_trades,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        userId,
        portfolioData.cash,
        portfolioData.totalValue,
        portfolioData.totalCost || 0,
        portfolioData.totalUnrealizedPnl || 0,
        portfolioData.totalUnrealizedPnlPercent || 0,
        portfolioData.dayPnl || 0,
        portfolioData.dayPnlPercent || 0,
        portfolioData.totalRealizedPnl || 0,
        portfolioData.winRate || 0,
        portfolioData.totalTrades || 0
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  }

  /**
   * Get user positions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User positions
   */
  static async getUserPositions(userId) {
    try {
      const result = await query(`
        SELECT id, crypto_id, symbol, name, quantity, avg_cost, current_price,
               market_value, unrealized_pnl, unrealized_pnl_percent,
               day_change, day_change_percent, created_at, updated_at
        FROM user_positions 
        WHERE user_id = $1 AND quantity > 0
        ORDER BY market_value DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user positions:', error);
      throw error;
    }
  }

  /**
   * Get user position by symbol
   * @param {string} userId - User ID
   * @param {string} symbol - Crypto symbol
   * @returns {Promise<Object>} User position
   */
  static async getUserPosition(userId, symbol) {
    try {
      const result = await query(`
        SELECT id, crypto_id, symbol, name, quantity, avg_cost, current_price,
               market_value, unrealized_pnl, unrealized_pnl_percent,
               day_change, day_change_percent, created_at, updated_at
        FROM user_positions 
        WHERE user_id = $1 AND symbol = $2
      `, [userId, symbol]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user position:', error);
      throw error;
    }
  }

  /**
   * Update user position
   * @param {string} userId - User ID
   * @param {Object} positionData - Position data
   * @returns {Promise<Object>} Updated position
   */
  static async updatePosition(userId, positionData) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Get crypto ID if not provided
      let cryptoId = positionData.cryptoId;
      if (!cryptoId) {
        const cryptoResult = await client.query(
          'SELECT id FROM cryptocurrencies WHERE symbol = $1',
          [positionData.symbol]
        );
        if (cryptoResult.rows.length === 0) {
          throw new Error(`Cryptocurrency ${positionData.symbol} not found`);
        }
        cryptoId = cryptoResult.rows[0].id;
      }
      
      // Check if position exists
      const existingPosition = await client.query(
        'SELECT id, quantity FROM user_positions WHERE user_id = $1 AND crypto_id = $2',
        [userId, cryptoId]
      );
      
      let result;
      if (existingPosition.rows.length > 0) {
        // Update existing position
        const currentQuantity = parseFloat(existingPosition.rows[0].quantity);
        const newQuantity = parseFloat(positionData.quantity);
        
        if (newQuantity <= 0) {
          // Remove position if quantity is 0 or less
          await client.query(
            'DELETE FROM user_positions WHERE user_id = $1 AND crypto_id = $2',
            [userId, cryptoId]
          );
          result = null;
        } else {
          // Update position
          result = await client.query(`
            UPDATE user_positions 
            SET quantity = $1, avg_cost = $2, current_price = $3, market_value = $4,
                unrealized_pnl = $5, unrealized_pnl_percent = $6,
                day_change = $7, day_change_percent = $8, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $9 AND crypto_id = $10
            RETURNING *
          `, [
            newQuantity,
            positionData.avgCost,
            positionData.currentPrice,
            positionData.marketValue,
            positionData.unrealizedPnl,
            positionData.unrealizedPnlPercent,
            positionData.dayChange || 0,
            positionData.dayChangePercent || 0,
            userId,
            cryptoId
          ]);
        }
      } else {
        // Create new position
        result = await client.query(`
          INSERT INTO user_positions (
            user_id, crypto_id, symbol, name, quantity, avg_cost, current_price,
            market_value, unrealized_pnl, unrealized_pnl_percent,
            day_change, day_change_percent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          userId,
          cryptoId,
          positionData.symbol,
          positionData.name,
          positionData.quantity,
          positionData.avgCost,
          positionData.currentPrice,
          positionData.marketValue,
          positionData.unrealizedPnl,
          positionData.unrealizedPnlPercent,
          positionData.dayChange || 0,
          positionData.dayChangePercent || 0
        ]);
      }
      
      await client.query('COMMIT');
      return result ? result.rows[0] : null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating position:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user trades
   * @param {string} userId - User ID
   * @param {number} limit - Limit number of records
   * @returns {Promise<Array>} User trades
   */
  static async getUserTrades(userId, limit = 100) {
    try {
      const result = await query(`
        SELECT id, crypto_id, symbol, name, trade_type, quantity, price,
               total_value, commission, timestamp
        FROM user_trades 
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [userId, limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user trades:', error);
      throw error;
    }
  }

  /**
   * Add user trade
   * @param {string} userId - User ID
   * @param {Object} tradeData - Trade data
   * @returns {Promise<Object>} Added trade
   */
  static async addTrade(userId, tradeData) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Get crypto ID if not provided
      let cryptoId = tradeData.cryptoId;
      if (!cryptoId) {
        const cryptoResult = await client.query(
          'SELECT id FROM cryptocurrencies WHERE symbol = $1',
          [tradeData.symbol]
        );
        if (cryptoResult.rows.length === 0) {
          throw new Error(`Cryptocurrency ${tradeData.symbol} not found`);
        }
        cryptoId = cryptoResult.rows[0].id;
      }
      
      // Add trade
      const result = await client.query(`
        INSERT INTO user_trades (
          user_id, crypto_id, symbol, name, trade_type, quantity,
          price, total_value, commission, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        userId,
        cryptoId,
        tradeData.symbol,
        tradeData.name,
        tradeData.tradeType,
        tradeData.quantity,
        tradeData.price,
        tradeData.totalValue,
        tradeData.commission || 0,
        tradeData.timestamp || new Date()
      ]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding trade:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user orders
   * @param {string} userId - User ID
   * @param {string} status - Order status filter
   * @returns {Promise<Array>} User orders
   */
  static async getUserOrders(userId, status = null) {
    try {
      let queryText = `
        SELECT id, crypto_id, symbol, order_type, order_subtype, quantity,
               price, status, filled_quantity, filled_price, commission,
               created_at, updated_at
        FROM user_orders 
        WHERE user_id = $1
      `;
      let params = [userId];
      
      if (status) {
        queryText += ' AND status = $2';
        params.push(status);
      }
      
      queryText += ' ORDER BY created_at DESC';
      
      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * Add user order
   * @param {string} userId - User ID
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Added order
   */
  static async addOrder(userId, orderData) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Get crypto ID if not provided
      let cryptoId = orderData.cryptoId;
      if (!cryptoId) {
        const cryptoResult = await client.query(
          'SELECT id FROM cryptocurrencies WHERE symbol = $1',
          [orderData.symbol]
        );
        if (cryptoResult.rows.length === 0) {
          throw new Error(`Cryptocurrency ${orderData.symbol} not found`);
        }
        cryptoId = cryptoResult.rows[0].id;
      }
      
      // Add order
      const result = await client.query(`
        INSERT INTO user_orders (
          user_id, crypto_id, symbol, order_type, order_subtype,
          quantity, price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        userId,
        cryptoId,
        orderData.symbol,
        orderData.orderType,
        orderData.orderSubtype,
        orderData.quantity,
        orderData.price,
        orderData.status || 'PENDING'
      ]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @param {Object} updateData - Additional update data
   * @returns {Promise<Object>} Updated order
   */
  static async updateOrderStatus(orderId, status, updateData = {}) {
    try {
      const result = await query(`
        UPDATE user_orders 
        SET status = $1, filled_quantity = $2, filled_price = $3,
            commission = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [
        status,
        updateData.filledQuantity || 0,
        updateData.filledPrice || null,
        updateData.commission || 0,
        orderId
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Calculate portfolio statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio statistics
   */
  static async calculatePortfolioStats(userId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_positions,
          SUM(market_value) as total_market_value,
          SUM(unrealized_pnl) as total_unrealized_pnl,
          AVG(unrealized_pnl_percent) as avg_pnl_percent
        FROM user_positions 
        WHERE user_id = $1 AND quantity > 0
      `, [userId]);
      
      const tradesResult = await query(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN trade_type = 'SELL' AND total_value > 0 THEN 1 END) as winning_trades,
          COUNT(CASE WHEN trade_type = 'SELL' AND total_value <= 0 THEN 1 END) as losing_trades,
          SUM(total_value) as total_trade_value
        FROM user_trades 
        WHERE user_id = $1
      `, [userId]);
      
      const stats = result.rows[0];
      const trades = tradesResult.rows[0];
      
      return {
        totalPositions: parseInt(stats.total_positions) || 0,
        totalMarketValue: parseFloat(stats.total_market_value) || 0,
        totalUnrealizedPnl: parseFloat(stats.total_unrealized_pnl) || 0,
        avgPnlPercent: parseFloat(stats.avg_pnl_percent) || 0,
        totalTrades: parseInt(trades.total_trades) || 0,
        winningTrades: parseInt(trades.winning_trades) || 0,
        losingTrades: parseInt(trades.losing_trades) || 0,
        totalTradeValue: parseFloat(trades.total_trade_value) || 0,
        winRate: trades.total_trades > 0 ? 
          (trades.winning_trades / trades.total_trades) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating portfolio stats:', error);
      throw error;
    }
  }
}

module.exports = PortfolioModel;
