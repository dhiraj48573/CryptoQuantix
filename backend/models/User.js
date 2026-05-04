/**
 * User Model
 * Database operations for user authentication and management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

class UserModel {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const client = await require('../database/connection').getClient();
    try {
      await client.query('BEGIN');
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      
      // Insert user
      const result = await client.query(`
        INSERT INTO users (email, password_hash, name, trading_level, experience, virtual_cash)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, trading_level, experience, virtual_cash, created_at
      `, [
        userData.email,
        passwordHash,
        userData.name,
        userData.tradingLevel || 'BEGINNER',
        userData.experience || 'Less than 1 year',
        userData.virtualCash || 100000
      ]);
      
      // Create user portfolio
      await client.query(`
        INSERT INTO user_portfolios (user_id, cash, total_value)
        VALUES ($1, $2, $3)
      `, [result.rows[0].id, userData.virtualCash || 100000, userData.virtualCash || 100000]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data
   */
  static async findByEmail(email) {
    try {
      const result = await query(`
        SELECT id, email, password_hash, name, trading_level, experience, 
               virtual_cash, is_active, created_at, updated_at
        FROM users 
        WHERE email = $1 AND is_active = true
      `, [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  static async findById(userId) {
    try {
      const result = await query(`
        SELECT id, email, name, trading_level, experience, 
               virtual_cash, is_active, created_at, updated_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result
   */
  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await this.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  static async update(userId, updateData) {
    try {
      const allowedFields = ['name', 'trading_level', 'experience'];
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
      
      updateValues.push(userId);
      
      const result = await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING id, email, name, trading_level, experience, virtual_cash, updated_at
      `, updateValues);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Update success
   */
  static async updatePassword(userId, newPassword) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      
      const result = await query(`
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
      `, [passwordHash, userId]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Deactivation success
   */
  static async deactivate(userId) {
    try {
      const result = await query(`
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Log user activity
   * @param {string} userId - User ID
   * @param {string} activityType - Activity type
   * @param {string} description - Activity description
   * @param {Object} metadata - Additional metadata
   * @param {string} ipAddress - User IP address
   * @param {string} userAgent - User agent
   */
  static async logActivity(userId, activityType, description, metadata = {}, ipAddress = null, userAgent = null) {
    try {
      await query(`
        INSERT INTO user_activity_log (user_id, activity_type, description, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, activityType, description, JSON.stringify(metadata), ipAddress, userAgent]);
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw error for activity logging
    }
  }

  /**
   * Get user activity log
   * @param {string} userId - User ID
   * @param {number} limit - Limit number of records
   * @returns {Promise<Array>} Activity log
   */
  static async getActivityLog(userId, limit = 50) {
    try {
      const result = await query(`
        SELECT activity_type, description, metadata, ip_address, user_agent, timestamp
        FROM user_activity_log 
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [userId, limit]);
      
      return result.rows.map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      }));
    } catch (error) {
      console.error('Error getting activity log:', error);
      throw error;
    }
  }

  /**
   * Add user achievement
   * @param {string} userId - User ID
   * @param {Object} achievement - Achievement data
   * @returns {Promise<Object>} Added achievement
   */
  static async addAchievement(userId, achievement) {
    try {
      const result = await query(`
        INSERT INTO user_achievements (user_id, achievement_name, achievement_type, description, icon)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, achievement_name) DO NOTHING
        RETURNING *
      `, [
        userId,
        achievement.name,
        achievement.type,
        achievement.description,
        achievement.icon
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  }

  /**
   * Get user achievements
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User achievements
   */
  static async getAchievements(userId) {
    try {
      const result = await query(`
        SELECT achievement_name, achievement_type, description, icon, earned_at
        FROM user_achievements 
        WHERE user_id = $1
        ORDER BY earned_at DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }
}

module.exports = UserModel;
