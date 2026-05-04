/**
 * SQLite Database Connection (Fallback)
 * SQLite connection setup for CryptoQuantix application when PostgreSQL is not available
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '../../data/cryptoquantix.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

/**
 * Execute a query with error handling
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQLite query error:', err);
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

/**
 * Execute a query that returns a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const queryOne = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQLite query error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const run = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('SQLite run error:', err);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
  try {
    await query('SELECT 1 as test');
    console.log('SQLite database connected successfully');
    return true;
  } catch (error) {
    console.error('SQLite database connection failed:', error.message);
    return false;
  }
};

/**
 * Initialize SQLite database schema
 * @returns {Promise<boolean>} Initialization status
 */
const initializeDatabase = async () => {
  try {
    // Create tables
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        trading_level TEXT DEFAULT 'BEGINNER',
        experience TEXT DEFAULT 'Less than 1 year',
        virtual_cash REAL DEFAULT 100000.00,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS cryptocurrencies (
        id TEXT PRIMARY KEY,
        symbol TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        market_cap INTEGER,
        circulating_supply INTEGER,
        max_supply INTEGER,
        week_52_high REAL,
        week_52_low REAL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS crypto_prices (
        id TEXT PRIMARY KEY,
        crypto_id TEXT NOT NULL,
        price REAL NOT NULL,
        change_amount REAL,
        change_percent REAL,
        volume INTEGER,
        day_high REAL,
        day_low REAL,
        data_source TEXT DEFAULT 'mock',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS user_portfolios (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        cash REAL NOT NULL DEFAULT 100000.00,
        total_value REAL NOT NULL DEFAULT 100000.00,
        total_cost REAL DEFAULT 0.00,
        total_unrealized_pnl REAL DEFAULT 0.00,
        total_unrealized_pnl_percent REAL DEFAULT 0.00,
        day_pnl REAL DEFAULT 0.00,
        day_pnl_percent REAL DEFAULT 0.00,
        total_realized_pnl REAL DEFAULT 0.00,
        win_rate REAL DEFAULT 0.00,
        total_trades INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS user_positions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        crypto_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        avg_cost REAL NOT NULL DEFAULT 0,
        current_price REAL NOT NULL DEFAULT 0,
        market_value REAL NOT NULL DEFAULT 0,
        unrealized_pnl REAL NOT NULL DEFAULT 0,
        unrealized_pnl_percent REAL NOT NULL DEFAULT 0,
        day_change REAL NOT NULL DEFAULT 0,
        day_change_percent REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, crypto_id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS user_trades (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        crypto_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        total_value REAL NOT NULL,
        commission REAL DEFAULT 0.00,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS trading_signals (
        id TEXT PRIMARY KEY,
        crypto_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
        strength REAL NOT NULL CHECK (strength >= 0 AND strength <= 100),
        correlation REAL CHECK (correlation >= -1 AND correlation <= 1),
        btc_price REAL,
        reason TEXT,
        confidence REAL CHECK (confidence >= 0 AND confidence <= 100),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Insert initial cryptocurrencies
    await run(`
      INSERT OR IGNORE INTO cryptocurrencies (id, symbol, name, description, market_cap, circulating_supply, max_supply, week_52_high, week_52_low) VALUES
      ('crypto-1', 'BTC', 'Bitcoin', 'The first and most well-known cryptocurrency', 850000000000, 19000000, 21000000, 69000, 16000),
      ('crypto-2', 'ETH', 'Ethereum', 'Smart contract platform and native cryptocurrency', 340000000000, 120000000, NULL, 4800, 900),
      ('crypto-3', 'BNB', 'Binance Coin', 'Cryptocurrency used by Binance exchange', 85000000000, 150000000, 200000000, 720, 180),
      ('crypto-4', 'SOL', 'Solana', 'High-performance blockchain supporting smart contracts', 45000000000, 400000000, NULL, 260, 8),
      ('crypto-5', 'ADA', 'Cardano', 'Proof-of-stake blockchain platform', 18000000000, 35000000000, 45000000000, 3.10, 0.25),
      ('crypto-6', 'XRP', 'Ripple', 'Digital payment protocol and cryptocurrency', 35000000000, 54000000000, 100000000000, 3.40, 0.30),
      ('crypto-7', 'DOT', 'Polkadot', 'Multi-chain interchange protocol', 12000000000, 1400000000, 10000000000, 55, 2.50),
      ('crypto-8', 'AVAX', 'Avalanche', 'Platform for decentralized applications and custom blockchain networks', 12000000000, 400000000, 720000000, 150, 2.50)
    `);

    console.log('SQLite database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('SQLite database initialization failed:', error.message);
    return false;
  }
};

/**
 * Close database connection
 */
const closeConnection = async () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing SQLite database:', err.message);
      } else {
        console.log('SQLite database connection closed');
      }
      resolve();
    });
  });
};

module.exports = {
  query,
  queryOne,
  run,
  testConnection,
  initializeDatabase,
  closeConnection,
  db
};
