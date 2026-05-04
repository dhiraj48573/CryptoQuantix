-- CryptoQuantix Database Schema
-- PostgreSQL Database Schema for Crypto Trading Application

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    trading_level VARCHAR(50) DEFAULT 'BEGINNER',
    experience VARCHAR(100) DEFAULT 'Less than 1 year',
    virtual_cash DECIMAL(15,2) DEFAULT 100000.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cryptocurrencies table for storing crypto metadata
CREATE TABLE cryptocurrencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    market_cap BIGINT,
    circulating_supply BIGINT,
    max_supply BIGINT,
    week_52_high DECIMAL(15,2),
    week_52_low DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crypto prices table for storing historical price data
CREATE TABLE crypto_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crypto_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    price DECIMAL(15,2) NOT NULL,
    change_amount DECIMAL(15,2),
    change_percent DECIMAL(10,4),
    volume BIGINT,
    day_high DECIMAL(15,2),
    day_low DECIMAL(15,2),
    data_source VARCHAR(50) DEFAULT 'mock',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_crypto_timestamp (crypto_id, timestamp),
    INDEX idx_symbol_timestamp (symbol, timestamp)
);

-- User portfolios table for storing portfolio information
CREATE TABLE user_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cash DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    total_value DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    total_unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
    total_unrealized_pnl_percent DECIMAL(10,4) DEFAULT 0.00,
    day_pnl DECIMAL(15,2) DEFAULT 0.00,
    day_pnl_percent DECIMAL(10,4) DEFAULT 0.00,
    total_realized_pnl DECIMAL(15,2) DEFAULT 0.00,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    total_trades INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- User positions table for storing current holdings
CREATE TABLE user_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL DEFAULT 0,
    avg_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    market_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) NOT NULL DEFAULT 0,
    unrealized_pnl_percent DECIMAL(10,4) NOT NULL DEFAULT 0,
    day_change DECIMAL(15,2) NOT NULL DEFAULT 0,
    day_change_percent DECIMAL(10,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, crypto_id),
    INDEX idx_user_positions (user_id),
    INDEX idx_symbol_positions (symbol)
);

-- User trades table for storing trade history
CREATE TABLE user_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    commission DECIMAL(15,2) DEFAULT 0.00,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_trades (user_id),
    INDEX idx_symbol_trades (symbol),
    INDEX idx_timestamp_trades (timestamp)
);

-- Trading signals table for storing algorithmic trading signals
CREATE TABLE trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crypto_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
    strength DECIMAL(5,2) NOT NULL CHECK (strength >= 0 AND strength <= 100),
    correlation DECIMAL(5,4) CHECK (correlation >= -1 AND correlation <= 1),
    btc_price DECIMAL(15,2),
    reason TEXT,
    confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    INDEX idx_crypto_signals (crypto_id),
    INDEX idx_symbol_signals (symbol),
    INDEX idx_timestamp_signals (timestamp)
);

-- Correlation data table for storing crypto correlation analysis
CREATE TABLE correlation_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crypto1_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    crypto2_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    symbol1 VARCHAR(20) NOT NULL,
    symbol2 VARCHAR(20) NOT NULL,
    correlation DECIMAL(5,4) CHECK (correlation >= -1 AND correlation <= 1),
    p_value DECIMAL(10,8),
    sample_size INTEGER,
    time_period VARCHAR(50) DEFAULT '30d',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_correlation_pairs (crypto1_id, crypto2_id),
    INDEX idx_symbol_pairs (symbol1, symbol2),
    INDEX idx_timestamp_correlations (timestamp)
);

-- User orders table for managing pending and executed orders
CREATE TABLE user_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    order_subtype VARCHAR(10) NOT NULL CHECK (order_subtype IN ('MARKET', 'LIMIT')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,2),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED')),
    filled_quantity DECIMAL(15,8) DEFAULT 0,
    filled_price DECIMAL(15,2),
    commission DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_orders (user_id),
    INDEX idx_symbol_orders (symbol),
    INDEX idx_status_orders (status)
);

-- User achievements table for gamification
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_name),
    INDEX idx_user_achievements (user_id)
);

-- User activity log for tracking user actions
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_activity (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_timestamp_activity (timestamp)
);

-- System configuration table
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO system_config (config_key, config_value, description) VALUES
('virtual_trading_capital', '100000', 'Initial virtual capital for new users'),
('commission_rate', '0.001', 'Trading commission rate (0.1%)'),
('max_positions_per_user', '50', 'Maximum number of positions per user'),
('price_update_interval', '1000', 'Price update interval in milliseconds'),
('signal_generation_interval', '5000', 'Signal generation interval in milliseconds');

-- Insert initial cryptocurrencies
INSERT INTO cryptocurrencies (symbol, name, description, market_cap, circulating_supply, max_supply, week_52_high, week_52_low) VALUES
('BTC', 'Bitcoin', 'The first and most well-known cryptocurrency', 850000000000, 19000000, 21000000, 69000, 16000),
('ETH', 'Ethereum', 'Smart contract platform and native cryptocurrency', 340000000000, 120000000, null, 4800, 900),
('BNB', 'Binance Coin', 'Cryptocurrency used by Binance exchange', 85000000000, 150000000, 200000000, 720, 180),
('SOL', 'Solana', 'High-performance blockchain supporting smart contracts', 45000000000, 400000000, null, 260, 8),
('ADA', 'Cardano', 'Proof-of-stake blockchain platform', 18000000000, 35000000000, 45000000000, 3.10, 0.25),
('XRP', 'Ripple', 'Digital payment protocol and cryptocurrency', 35000000000, 54000000000, 100000000000, 3.40, 0.30),
('DOT', 'Polkadot', 'Multi-chain interchange protocol', 12000000000, 1400000000, 10000000000, 55, 2.50),
('AVAX', 'Avalanche', 'Platform for decentralized applications and custom blockchain networks', 12000000000, 400000000, 720000000, 150, 2.50);

-- Create indexes for better performance
CREATE INDEX idx_crypto_prices_latest ON crypto_prices (crypto_id, timestamp DESC);
CREATE INDEX idx_trading_signals_latest ON trading_signals (crypto_id, timestamp DESC);
CREATE INDEX idx_correlation_data_latest ON correlation_data (timestamp DESC);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cryptocurrencies_updated_at BEFORE UPDATE ON cryptocurrencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_portfolios_updated_at BEFORE UPDATE ON user_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_positions_updated_at BEFORE UPDATE ON user_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_orders_updated_at BEFORE UPDATE ON user_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
