/**
 * Database Service
 * High-level service for database operations
 */

const CryptoModel = require('../models/Crypto');
const UserModel = require('../models/User');
const PortfolioModel = require('../models/Portfolio');
const TradingSignalsModel = require('../models/TradingSignals');
const { testConnection, initializeDatabase } = require('../database/connection');

class DatabaseService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize database connection and schema
   */
  async initialize() {
    try {
      console.log('Initializing database service...');
      
      // Test connection
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Initialize schema
      const isInitialized = await initializeDatabase();
      if (!isInitialized) {
        throw new Error('Database initialization failed');
      }
      
      this.isInitialized = true;
      console.log('Database service initialized successfully');
      
      // Load initial crypto data
      await this.loadInitialCryptoData();
      
    } catch (error) {
      console.error('Database service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load initial cryptocurrency data
   */
  async loadInitialCryptoData() {
    try {
      const cryptos = await CryptoModel.getAll();
      console.log(`Loaded ${cryptos.length} cryptocurrencies from database`);
      
      // Generate initial price data if needed
      for (const crypto of cryptos) {
        const latestPrice = await CryptoModel.getLatestPrice(crypto.symbol);
        if (!latestPrice) {
          // Generate initial price data
          await this.generateInitialPriceData(crypto);
        }
      }
      
    } catch (error) {
      console.error('Error loading initial crypto data:', error);
    }
  }

  /**
   * Generate initial price data for a cryptocurrency
   */
  async generateInitialPriceData(crypto) {
    try {
      const basePrice = this.getBasePrice(crypto.symbol);
      const priceData = {
        symbol: crypto.symbol,
        price: basePrice,
        changeAmount: (Math.random() - 0.5) * basePrice * 0.02,
        changePercent: (Math.random() - 0.5) * 2,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        dayHigh: basePrice * 1.02,
        dayLow: basePrice * 0.98,
        dataSource: 'mock',
        timestamp: new Date()
      };
      
      await CryptoModel.upsertPrice(priceData);
      console.log(`Generated initial price data for ${crypto.symbol}`);
    } catch (error) {
      console.error(`Error generating initial price data for ${crypto.symbol}:`, error);
    }
  }

  /**
   * Get base price for cryptocurrency
   */
  getBasePrice(symbol) {
    const prices = {
      'BTC': 45000,
      'ETH': 3000,
      'BNB': 400,
      'SOL': 120,
      'ADA': 0.8,
      'XRP': 0.6,
      'DOT': 25,
      'AVAX': 35
    };
    return prices[symbol] || 100;
  }

  /**
   * Update crypto prices with realistic movements
   */
  async updateCryptoPrices() {
    try {
      const cryptos = await CryptoModel.getAll();
      const priceUpdates = [];
      
      for (const crypto of cryptos) {
        const currentPrice = await CryptoModel.getLatestPrice(crypto.symbol);
        if (currentPrice) {
          const changeAmount = (Math.random() - 0.5) * currentPrice.price * 0.02;
          const newPrice = currentPrice.price + changeAmount;
          const changePercent = ((newPrice - currentPrice.price) / currentPrice.price) * 100;
          
          const priceData = {
            symbol: crypto.symbol,
            price: parseFloat(newPrice.toFixed(2)),
            changeAmount: parseFloat(changeAmount.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: Math.floor(Math.random() * 1000000) + 100000,
            dayHigh: Math.max(currentPrice.dayHigh || currentPrice.price, newPrice),
            dayLow: Math.min(currentPrice.dayLow || currentPrice.price, newPrice),
            dataSource: 'mock',
            timestamp: new Date()
          };
          
          await CryptoModel.upsertPrice(priceData);
          priceUpdates.push({ symbol: crypto.symbol, ...priceData });
        }
      }
      
      return priceUpdates;
    } catch (error) {
      console.error('Error updating crypto prices:', error);
      throw error;
    }
  }

  /**
   * Generate trading signals
   */
  async generateTradingSignals() {
    try {
      const cryptos = await CryptoModel.getAll();
      const signals = [];
      
      for (const crypto of cryptos) {
        const signal = await TradingSignalsModel.generateSignal(crypto.symbol);
        if (signal) {
          signals.push({
            symbol: signal.symbol,
            signal: signal.signal_type,
            strength: signal.strength,
            correlation: signal.correlation,
            btcPrice: signal.btc_price,
            reason: signal.reason,
            confidence: signal.confidence
          });
        }
      }
      
      return signals;
    } catch (error) {
      console.error('Error generating trading signals:', error);
      throw error;
    }
  }

  /**
   * Get all crypto data with latest prices
   */
  async getAllCryptoData() {
    try {
      const cryptos = await CryptoModel.getLatestPrices();
      return cryptos.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price || this.getBasePrice(crypto.symbol),
        change: crypto.change_amount || 0,
        changePercent: crypto.change_percent || 0,
        volume: crypto.volume ? crypto.volume.toString() : '0',
        dayHigh: crypto.day_high || crypto.price || this.getBasePrice(crypto.symbol),
        dayLow: crypto.day_low || crypto.price || this.getBasePrice(crypto.symbol),
        marketCap: crypto.market_cap ? crypto.market_cap.toString() : '0',
        circulatingSupply: crypto.circulating_supply ? crypto.circulating_supply.toString() : '0',
        lastUpdated: crypto.timestamp || new Date(),
        dataSource: crypto.data_source || 'mock'
      }));
    } catch (error) {
      console.error('Error getting all crypto data:', error);
      throw error;
    }
  }

  /**
   * Get crypto data by symbol
   */
  async getCryptoData(symbol) {
    try {
      const crypto = await CryptoModel.getBySymbol(symbol);
      const latestPrice = await CryptoModel.getLatestPrice(symbol);
      
      if (!crypto) {
        throw new Error(`Cryptocurrency ${symbol} not found`);
      }
      
      return {
        symbol: crypto.symbol,
        name: crypto.name,
        price: latestPrice?.price || this.getBasePrice(symbol),
        change: latestPrice?.change_amount || 0,
        changePercent: latestPrice?.change_percent || 0,
        volume: latestPrice?.volume ? latestPrice.volume.toString() : '0',
        dayHigh: latestPrice?.day_high || this.getBasePrice(symbol),
        dayLow: latestPrice?.day_low || this.getBasePrice(symbol),
        marketCap: crypto.market_cap ? crypto.market_cap.toString() : '0',
        circulatingSupply: crypto.circulating_supply ? crypto.circulating_supply.toString() : '0',
        lastUpdated: latestPrice?.timestamp || new Date(),
        dataSource: latestPrice?.data_source || 'mock'
      };
    } catch (error) {
      console.error('Error getting crypto data:', error);
      throw error;
    }
  }

  /**
   * Get all trading signals
   */
  async getAllSignals() {
    try {
      const signals = await TradingSignalsModel.getLatestSignals();
      return signals;
    } catch (error) {
      console.error('Error getting all signals:', error);
      throw error;
    }
  }

  /**
   * Get correlation data
   */
  async getCorrelationData(symbol1, symbol2 = null) {
    try {
      const correlations = await TradingSignalsModel.getCorrelationData(symbol1, symbol2);
      return correlations.map(corr => ({
        symbol1: corr.symbol1,
        symbol2: corr.symbol2,
        correlation: corr.correlation,
        pValue: corr.p_value,
        timestamp: corr.timestamp
      }));
    } catch (error) {
      console.error('Error getting correlation data:', error);
      throw error;
    }
  }

  /**
   * User authentication
   */
  async authenticateUser(email, password) {
    try {
      return await UserModel.authenticate(email, password);
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      return await UserModel.create(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user portfolio
   */
  async getUserPortfolio(userId) {
    try {
      const portfolio = await PortfolioModel.getUserPortfolio(userId);
      const positions = await PortfolioModel.getUserPositions(userId);
      const trades = await PortfolioModel.getUserTrades(userId, 50);
      
      return {
        cash: portfolio?.cash || 100000,
        totalValue: portfolio?.total_value || 100000,
        totalCost: portfolio?.total_cost || 0,
        totalUnrealizedPnL: portfolio?.total_unrealized_pnl || 0,
        totalUnrealizedPnLPercent: portfolio?.total_unrealized_pnl_percent || 0,
        dayPnL: portfolio?.day_pnl || 0,
        dayPnLPercent: portfolio?.day_pnl_percent || 0,
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          name: pos.name,
          quantity: pos.quantity,
          avgCost: pos.avg_cost,
          currentPrice: pos.current_price,
          marketValue: pos.market_value,
          unrealizedPnL: pos.unrealized_pnl,
          unrealizedPnLPercent: pos.unrealized_pnl_percent,
          dayChange: pos.day_change,
          dayChangePercent: pos.day_change_percent
        })),
        trades: trades.map(trade => ({
          id: trade.id,
          symbol: trade.symbol,
          name: trade.name,
          type: trade.trade_type,
          quantity: trade.quantity,
          price: trade.price,
          timestamp: trade.timestamp,
          totalValue: trade.total_value,
          commission: trade.commission
        })),
        totalRealizedPnL: portfolio?.total_realized_pnl || 0,
        winRate: portfolio?.win_rate || 0,
        totalTrades: portfolio?.total_trades || 0
      };
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      throw error;
    }
  }

  /**
   * Execute trade for user
   */
  async executeTrade(userId, tradeData) {
    try {
      const portfolio = await PortfolioModel.getUserPortfolio(userId);
      const cryptoData = await this.getCryptoData(tradeData.symbol);
      
      const totalValue = tradeData.quantity * cryptoData.price;
      const commission = totalValue * 0.001; // 0.1% commission
      
      if (tradeData.type === 'BUY') {
        if (portfolio.cash < totalValue + commission) {
          throw new Error('Insufficient funds');
        }
        
        // Update portfolio cash
        const updatedPortfolio = await PortfolioModel.updatePortfolio(userId, {
          ...portfolio,
          cash: portfolio.cash - totalValue - commission,
          totalTrades: portfolio.totalTrades + 1
        });
        
        // Update or create position
        const existingPosition = await PortfolioModel.getUserPosition(userId, tradeData.symbol);
        let newPosition;
        
        if (existingPosition) {
          // Update existing position
          const newQuantity = existingPosition.quantity + tradeData.quantity;
          const newAvgCost = ((existingPosition.avg_cost * existingPosition.quantity) + (cryptoData.price * tradeData.quantity)) / newQuantity;
          
          newPosition = await PortfolioModel.updatePosition(userId, {
            symbol: tradeData.symbol,
            name: cryptoData.name,
            quantity: newQuantity,
            avgCost: newAvgCost,
            currentPrice: cryptoData.price,
            marketValue: newQuantity * cryptoData.price,
            unrealizedPnL: (newQuantity * cryptoData.price) - (newAvgCost * newQuantity),
            unrealizedPnLPercent: ((newQuantity * cryptoData.price) - (newAvgCost * newQuantity)) / (newAvgCost * newQuantity) * 100
          });
        } else {
          // Create new position
          newPosition = await PortfolioModel.updatePosition(userId, {
            symbol: tradeData.symbol,
            name: cryptoData.name,
            quantity: tradeData.quantity,
            avgCost: cryptoData.price,
            currentPrice: cryptoData.price,
            marketValue: tradeData.quantity * cryptoData.price,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0
          });
        }
        
        // Add trade record
        await PortfolioModel.addTrade(userId, {
          symbol: tradeData.symbol,
          name: cryptoData.name,
          tradeType: 'BUY',
          quantity: tradeData.quantity,
          price: cryptoData.price,
          totalValue: totalValue,
          commission: commission
        });
        
        return { success: true, portfolio: updatedPortfolio, position: newPosition };
        
      } else if (tradeData.type === 'SELL') {
        const existingPosition = await PortfolioModel.getUserPosition(userId, tradeData.symbol);
        
        if (!existingPosition || existingPosition.quantity < tradeData.quantity) {
          throw new Error('Insufficient position');
        }
        
        // Update portfolio cash
        const updatedPortfolio = await PortfolioModel.updatePortfolio(userId, {
          ...portfolio,
          cash: portfolio.cash + totalValue - commission,
          totalTrades: portfolio.totalTrades + 1
        });
        
        // Update or remove position
        const newQuantity = existingPosition.quantity - tradeData.quantity;
        let newPosition;
        
        if (newQuantity > 0) {
          newPosition = await PortfolioModel.updatePosition(userId, {
            symbol: tradeData.symbol,
            name: cryptoData.name,
            quantity: newQuantity,
            avgCost: existingPosition.avg_cost,
            currentPrice: cryptoData.price,
            marketValue: newQuantity * cryptoData.price,
            unrealizedPnL: (newQuantity * cryptoData.price) - (existingPosition.avg_cost * newQuantity),
            unrealizedPnLPercent: ((newQuantity * cryptoData.price) - (existingPosition.avg_cost * newQuantity)) / (existingPosition.avg_cost * newQuantity) * 100
          });
        } else {
          newPosition = null; // Position removed
        }
        
        // Add trade record
        await PortfolioModel.addTrade(userId, {
          symbol: tradeData.symbol,
          name: cryptoData.name,
          tradeType: 'SELL',
          quantity: tradeData.quantity,
          price: cryptoData.price,
          totalValue: totalValue,
          commission: commission
        });
        
        return { success: true, portfolio: updatedPortfolio, position: newPosition };
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Get market statistics
   */
  async getMarketStats() {
    try {
      const cryptos = await CryptoModel.getLatestPrices();
      const topGainers = await CryptoModel.getTopGainers(5);
      const topLosers = await CryptoModel.getTopLosers(5);
      const signalStats = await TradingSignalsModel.getSignalStats();
      
      return {
        totalCryptos: cryptos.length,
        topGainers: topGainers.map(crypto => ({
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.price,
          changePercent: crypto.change_percent
        })),
        topLosers: topLosers.map(crypto => ({
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.price,
          changePercent: crypto.change_percent
        })),
        signalStats: {
          totalSignals: signalStats.total_signals || 0,
          buySignals: signalStats.buy_signals || 0,
          sellSignals: signalStats.sell_signals || 0,
          holdSignals: signalStats.hold_signals || 0,
          avgStrength: signalStats.avg_strength || 0,
          avgConfidence: signalStats.avg_confidence || 0
        }
      };
    } catch (error) {
      console.error('Error getting market stats:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
