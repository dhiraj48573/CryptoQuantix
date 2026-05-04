/**
 * Backend Server for CryptoQuantix Application
 * SQLite version for immediate deployment without PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { query, queryOne, run, testConnection, initializeDatabase } = require('./database/sqlite-connection');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New WebSocket client connected');
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast function for WebSocket
const broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await queryOne('SELECT id, email, name, trading_level, experience, virtual_cash FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// In-memory storage for real-time data
const cryptoPrices = new Map();
const tradingSignals = new Map();

// Initialize crypto data
const initializeCryptoData = async () => {
  try {
    const cryptos = await query('SELECT * FROM cryptocurrencies WHERE is_active = 1');
    
    for (const crypto of cryptos.rows) {
      const basePrice = getBasePrice(crypto.symbol);
      cryptoPrices.set(crypto.symbol, {
        ...crypto,
        price: basePrice,
        changeAmount: (Math.random() - 0.5) * basePrice * 0.02,
        changePercent: (Math.random() - 0.5) * 2,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        dayHigh: basePrice * 1.02,
        dayLow: basePrice * 0.98,
        lastUpdated: new Date()
      });
    }
    
    console.log(`Initialized ${cryptos.rows.length} cryptocurrencies`);
  } catch (error) {
    console.error('Error initializing crypto data:', error);
  }
};

// Get base price for cryptocurrency
const getBasePrice = (symbol) => {
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
};

// Update crypto prices with realistic movements
const updateCryptoPrices = async () => {
  try {
    const priceUpdates = [];
    
    cryptoPrices.forEach((crypto, symbol) => {
      const changeAmount = (Math.random() - 0.5) * crypto.price * 0.02;
      const newPrice = crypto.price + changeAmount;
      const changePercent = ((newPrice - crypto.price) / crypto.price) * 100;
      
      const updatedCrypto = {
        ...crypto,
        price: parseFloat(newPrice.toFixed(2)),
        changeAmount: parseFloat(changeAmount.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        lastUpdated: new Date(),
        dayHigh: Math.max(crypto.dayHigh, newPrice),
        dayLow: Math.min(crypto.dayLow, newPrice)
      };
      
      cryptoPrices.set(symbol, updatedCrypto);
      priceUpdates.push({ symbol, ...updatedCrypto });
      
      // Update database
      run(`
        INSERT INTO crypto_prices (id, crypto_id, price, change_amount, change_percent, volume, day_high, day_low, data_source, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'mock', ?)
      `, [
        uuidv4(),
        crypto.id,
        updatedCrypto.price,
        updatedCrypto.changeAmount,
        updatedCrypto.changePercent,
        updatedCrypto.volume,
        updatedCrypto.dayHigh,
        updatedCrypto.dayLow,
        new Date().toISOString()
      ]).catch(err => console.error('Error updating price in database:', err));
    });
    
    return priceUpdates;
  } catch (error) {
    console.error('Error updating crypto prices:', error);
    return [];
  }
};

// Generate trading signals
const generateTradingSignals = async () => {
  try {
    const signals = [];
    
    cryptoPrices.forEach((crypto, symbol) => {
      const signalType = Math.random() > 0.5 ? 'BUY' : Math.random() > 0.3 ? 'SELL' : 'HOLD';
      const strength = Math.floor(Math.random() * 100);
      const confidence = Math.floor(Math.random() * 100);
      
      const signal = {
        symbol,
        signal: signalType,
        strength,
        correlation: (Math.random() - 0.5) * 2,
        btcPrice: cryptoPrices.get('BTC')?.price || 45000,
        reason: `${signalType} signal based on market analysis`,
        confidence
      };
      
      tradingSignals.set(symbol, signal);
      signals.push(signal);
      
      // Update database
      run(`
        INSERT INTO trading_signals (id, crypto_id, symbol, signal_type, strength, correlation, btc_price, reason, confidence, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        crypto.id,
        symbol,
        signalType,
        strength,
        signal.correlation,
        signal.btcPrice,
        signal.reason,
        confidence,
        new Date().toISOString()
      ]).catch(err => console.error('Error updating signal in database:', err));
    });
    
    return signals;
  } catch (error) {
    console.error('Error generating trading signals:', error);
    return [];
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    database: 'SQLite connected',
    cryptos: cryptoPrices.size,
    signals: tradingSignals.size
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = uuidv4();
    
    // Create user
    await run(`
      INSERT INTO users (id, email, password_hash, name, trading_level, experience, virtual_cash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, passwordHash, name, 'BEGINNER', 'Less than 1 year', 100000]);
    
    // Create portfolio
    await run(`
      INSERT INTO user_portfolios (id, user_id, cash, total_value)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), userId, 100000, 100000]);
    
    // Generate token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: { id: userId, email, name },
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await queryOne('SELECT id, email, password_hash, name, trading_level, experience, virtual_cash FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/user', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// Crypto data routes
app.get('/api/crypto', async (req, res) => {
  try {
    const cryptos = Array.from(cryptoPrices.values()).map(crypto => ({
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price,
      change: crypto.change,
      changePercent: crypto.changePercent,
      volume: crypto.volume,
      dayHigh: crypto.dayHigh,
      dayLow: crypto.dayLow,
      week52High: crypto.week52High,
      week52Low: crypto.week52Low
    }));
    
    res.json(cryptos);
  } catch (error) {
    console.error('Get all cryptos error:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/crypto/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const crypto = cryptoPrices.get(symbol.toUpperCase());
    
    if (!crypto) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }
    
    res.json({
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price,
      change: crypto.changeAmount,
      changePercent: crypto.changePercent,
      volume: crypto.volume.toString(),
      dayHigh: crypto.dayHigh,
      dayLow: crypto.dayLow,
      marketCap: crypto.market_cap ? crypto.market_cap.toString() : '0',
      circulatingSupply: crypto.circulating_supply ? crypto.circulating_supply.toString() : '0',
      lastUpdated: crypto.lastUpdated,
      dataSource: 'mock'
    });
  } catch (error) {
    console.error('Get crypto error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/crypto/stats', async (req, res) => {
  try {
    const cryptos = Array.from(cryptoPrices.values());
    const sortedByChange = cryptos.sort((a, b) => b.changePercent - a.changePercent);
    
    res.json({
      totalCryptos: cryptos.length,
      topGainers: sortedByChange.slice(0, 5).map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        changePercent: crypto.changePercent
      })),
      topLosers: sortedByChange.slice(-5).reverse().map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        changePercent: crypto.changePercent
      })),
      signalStats: {
        totalSignals: tradingSignals.size,
        buySignals: Array.from(tradingSignals.values()).filter(s => s.signal === 'BUY').length,
        sellSignals: Array.from(tradingSignals.values()).filter(s => s.signal === 'SELL').length,
        holdSignals: Array.from(tradingSignals.values()).filter(s => s.signal === 'HOLD').length
      }
    });
  } catch (error) {
    console.error('Get market stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trading signals routes - specific routes first
app.get('/api/signals', async (req, res) => {
  try {
    const signals = Object.fromEntries(tradingSignals);
    res.json(signals);
  } catch (error) {
    console.error('Get all signals error:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/signals/high-confidence/:threshold', async (req, res) => {
  try {
    const threshold = parseFloat(req.params.threshold) || 0.7;
    const signals = Object.fromEntries(tradingSignals);
    const highConfidenceSignals = {};
    
    Object.entries(signals).forEach(([symbol, signal]) => {
      if (signal.confidence >= threshold) {
        highConfidenceSignals[symbol] = signal;
      }
    });
    
    res.json(highConfidenceSignals);
  } catch (error) {
    console.error('Get high confidence signals error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals/performance', async (req, res) => {
  try {
    const signals = Object.values(tradingSignals);
    const buySignals = signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = signals.filter(s => s.signal === 'SELL').length;
    const holdSignals = signals.filter(s => s.signal === 'HOLD').length;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const highConfidenceCount = signals.filter(s => s.confidence >= 0.8).length;
    
    res.json({
      totalSignals: signals.length,
      buySignals,
      sellSignals,
      holdSignals,
      avgConfidence: parseFloat(avgConfidence.toFixed(2)),
      highConfidenceCount
    });
  } catch (error) {
    console.error('Get signal performance error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals/history/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 50;
    // Generate mock historical data
    const history = [];
    const signals = Object.fromEntries(tradingSignals);
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(Date.now() - i * 5000).toISOString();
      history.push({
        timestamp,
        signals: signals
      });
    }
    
    res.json(history);
  } catch (error) {
    console.error('Get signal history error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const signal = tradingSignals.get(symbol.toUpperCase());
    res.json(signal || null);
  } catch (error) {
    console.error('Get signals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Correlation data routes - specific routes first
app.get('/api/correlation/heatmap', async (req, res) => {
  try {
    // Generate correlation heatmap data
    const cryptos = Array.from(cryptoPrices.keys());
    const heatmapData = [];
    
    for (let i = 0; i < cryptos.length; i++) {
      for (let j = 0; j < cryptos.length; j++) {
        const correlation = i === j ? 1.0 : (Math.random() - 0.5) * 2; // Random correlation for demo
        heatmapData.push({
          symbol1: cryptos[i],
          symbol2: cryptos[j],
          correlation: parseFloat(correlation.toFixed(3))
        });
      }
    }
    
    res.json(heatmapData);
  } catch (error) {
    console.error('Get correlation heatmap error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/correlation/matrix', async (req, res) => {
  try {
    // Generate correlation matrix
    const cryptos = Array.from(cryptoPrices.keys());
    const matrix = {};
    
    cryptos.forEach(symbol1 => {
      matrix[symbol1] = {};
      cryptos.forEach(symbol2 => {
        const correlation = symbol1 === symbol2 ? 1.0 : (Math.random() - 0.5) * 2;
        matrix[symbol1][symbol2] = parseFloat(correlation.toFixed(3));
      });
    });
    
    res.json({
      symbols: cryptos,
      matrix: matrix,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get correlation matrix error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/correlation/:symbol1/:symbol2?', async (req, res) => {
  try {
    const { symbol1, symbol2 } = req.params;
    
    if (!symbol2) {
      // Get all correlations for symbol1
      const cryptos = Array.from(cryptoPrices.keys());
      const correlations = [];
      
      for (const symbol of cryptos) {
        if (symbol !== symbol1.toUpperCase()) {
          const correlation = (Math.random() - 0.5) * 2; // Random correlation for demo
          correlations.push({
            symbol1: symbol1.toUpperCase(),
            symbol2: symbol,
            correlation: parseFloat(correlation.toFixed(3)),
            pValue: Math.random(),
            timestamp: new Date().toISOString()
          });
        }
      }
      
      res.json(correlations);
    } else {
      // Get specific correlation between two symbols
      const correlation = (Math.random() - 0.5) * 2; // Random correlation for demo
      res.json([{
        symbol1: symbol1.toUpperCase(),
        symbol2: symbol2.toUpperCase(),
        correlation: parseFloat(correlation.toFixed(3)),
        pValue: Math.random(),
        timestamp: new Date().toISOString()
      }]);
    }
  } catch (error) {
    console.error('Get correlation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Additional correlation endpoints for frontend
app.get('/api/correlation/strong/:threshold', async (req, res) => {
  try {
    const threshold = parseFloat(req.params.threshold) || 0.7;
    const cryptos = Array.from(cryptoPrices.keys());
    const strongCorrelations = [];
    
    for (let i = 0; i < cryptos.length; i++) {
      for (let j = i + 1; j < cryptos.length; j++) {
        const correlation = (Math.random() - 0.5) * 2;
        if (Math.abs(correlation) >= threshold) {
          strongCorrelations.push({
            symbol1: cryptos[i],
            symbol2: cryptos[j],
            correlation: parseFloat(correlation.toFixed(3)),
            pValue: Math.random(),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    res.json(strongCorrelations);
  } catch (error) {
    console.error('Get strong correlations error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/correlation/stats', async (req, res) => {
  try {
    const cryptos = Array.from(cryptoPrices.keys());
    const correlations = [];
    
    for (let i = 0; i < cryptos.length; i++) {
      for (let j = i + 1; j < cryptos.length; j++) {
        const correlation = (Math.random() - 0.5) * 2;
        correlations.push(correlation);
      }
    }
    
    const highCorrelations = correlations.filter(c => Math.abs(c) >= 0.7).length;
    const mediumCorrelations = correlations.filter(c => Math.abs(c) >= 0.4 && Math.abs(c) < 0.7).length;
    const lowCorrelations = correlations.filter(c => Math.abs(c) < 0.4).length;
    
    res.json({
      totalPairs: correlations.length,
      highCorrelations,
      mediumCorrelations,
      lowCorrelations,
      avgCorrelation: correlations.reduce((sum, c) => sum + Math.abs(c), 0) / correlations.length,
      strongestPositive: { symbols: ['BTC', 'ETH'], coefficient: Math.max(...correlations) },
      strongestNegative: { symbols: ['BTC', 'XRP'], coefficient: Math.min(...correlations) }
    });
  } catch (error) {
    console.error('Get correlation stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Portfolio routes
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const portfolio = await queryOne('SELECT * FROM user_portfolios WHERE user_id = ?', [req.user.id]);
    const positions = await query('SELECT * FROM user_positions WHERE user_id = ? AND quantity > 0', [req.user.id]);
    
    res.json({
      portfolio,
      positions
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio/positions', async (req, res) => {
  try {
    // For demo purposes, return demo positions without authentication
    const demoPositions = [
      {
        symbol: 'BTC',
        quantity: 0.5,
        avgCost: 40000,
        currentPrice: 41479.03,
        unrealizedPnL: 739.52,
        unrealizedPnLPercent: 3.70
      },
      {
        symbol: 'ETH',
        quantity: 10,
        avgCost: 2200,
        currentPrice: 2280.45,
        unrealizedPnL: 804.50,
        unrealizedPnLPercent: 3.66
      }
    ];
    
    res.json(demoPositions);
  } catch (error) {
    console.error('Get portfolio positions error:', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/portfolio/trade', authenticateToken, async (req, res) => {
  try {
    const { symbol, type, quantity } = req.body;
    
    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const portfolio = await queryOne('SELECT * FROM user_portfolios WHERE user_id = ?', [req.user.id]);
    const crypto = cryptoPrices.get(symbol.toUpperCase());
    
    if (!crypto) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }
    
    const totalValue = quantity * crypto.price;
    const commission = totalValue * 0.001;
    
    if (type.toUpperCase() === 'BUY') {
      if (portfolio.cash < totalValue + commission) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      
      // Update portfolio cash
      await run(`
        UPDATE user_portfolios 
        SET cash = ?, total_trades = total_trades + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [portfolio.cash - totalValue - commission, req.user.id]);
      
      // Update or create position
      const existingPosition = await queryOne('SELECT * FROM user_positions WHERE user_id = ? AND symbol = ?', [req.user.id, symbol]);
      
      if (existingPosition) {
        const newQuantity = existingPosition.quantity + quantity;
        const newAvgCost = ((existingPosition.avg_cost * existingPosition.quantity) + (crypto.price * quantity)) / newQuantity;
        
        await run(`
          UPDATE user_positions 
          SET quantity = ?, avg_cost = ?, current_price = ?, market_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND symbol = ?
        `, [newQuantity, newAvgCost, crypto.price, newQuantity * crypto.price, req.user.id, symbol]);
      } else {
        await run(`
          INSERT INTO user_positions (id, user_id, crypto_id, symbol, name, quantity, avg_cost, current_price, market_value)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [uuidv4(), req.user.id, crypto.id, symbol, crypto.name, quantity, crypto.price, crypto.price, quantity * crypto.price]);
      }
      
      // Add trade record
      await run(`
        INSERT INTO user_trades (id, user_id, crypto_id, symbol, name, trade_type, quantity, price, total_value, commission, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), req.user.id, crypto.id, symbol, crypto.name, 'BUY', quantity, crypto.price, totalValue, commission, new Date().toISOString()]);
      
    } else if (type.toUpperCase() === 'SELL') {
      const existingPosition = await queryOne('SELECT * FROM user_positions WHERE user_id = ? AND symbol = ?', [req.user.id, symbol]);
      
      if (!existingPosition || existingPosition.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient position' });
      }
      
      // Update portfolio cash
      await run(`
        UPDATE user_portfolios 
        SET cash = ?, total_trades = total_trades + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [portfolio.cash + totalValue - commission, req.user.id]);
      
      // Update or remove position
      const newQuantity = existingPosition.quantity - quantity;
      
      if (newQuantity > 0) {
        await run(`
          UPDATE user_positions 
          SET quantity = ?, current_price = ?, market_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND symbol = ?
        `, [newQuantity, crypto.price, newQuantity * crypto.price, req.user.id, symbol]);
      } else {
        await run('DELETE FROM user_positions WHERE user_id = ? AND symbol = ?', [req.user.id, symbol]);
      }
      
      // Add trade record
      await run(`
        INSERT INTO user_trades (id, user_id, crypto_id, symbol, name, trade_type, quantity, price, total_value, commission, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), req.user.id, crypto.id, symbol, crypto.name, 'SELL', quantity, crypto.price, totalValue, commission, new Date().toISOString()]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Execute trade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize database
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    const isInitialized = await initializeDatabase();
    if (!isInitialized) {
      throw new Error('Database initialization failed');
    }
    
    // Initialize crypto data
    await initializeCryptoData();
    
    // Start price updates
    setInterval(async () => {
      try {
        const priceUpdates = await updateCryptoPrices();
        broadcast({
          type: 'price_updates',
          data: priceUpdates
        });
      } catch (error) {
        console.error('Price update error:', error);
      }
    }, 1000);
    
    // Start signal generation
    setInterval(async () => {
      try {
        const signals = await generateTradingSignals();
        broadcast({
          type: 'signal_updates',
          data: signals
        });
      } catch (error) {
        console.error('Signal generation error:', error);
      }
    }, 5000);
    
    const PORT = process.env.PORT || 3003;
    server.listen(PORT, () => {
      console.log(`CryptoQuantix backend server running on port ${PORT}`);
      console.log(`WebSocket server ready for connections`);
      console.log(`Database: SQLite connected`);
      console.log(`Cryptocurrencies: ${cryptoPrices.size}`);
      console.log(`Open http://localhost:${PORT}/api/health to check status`);
    });
    
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
