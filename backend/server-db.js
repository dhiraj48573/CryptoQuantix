/**
 * Backend Server for CryptoQuantix Application
 * Database-integrated version with PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const databaseService = require('./services/databaseService');
const UserModel = require('./models/User');

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
    const user = await UserModel.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    database: databaseService.isInitialized ? 'connected' : 'disconnected'
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = await databaseService.createUser({ email, password, name });
    res.status(201).json({ message: 'User created successfully', user });
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
    
    const result = await databaseService.authenticateUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/auth/user', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crypto data routes
app.get('/api/crypto/all', async (req, res) => {
  try {
    const cryptos = await databaseService.getAllCryptoData();
    res.json(cryptos);
  } catch (error) {
    console.error('Get all cryptos error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/crypto/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const crypto = await databaseService.getCryptoData(symbol.toUpperCase());
    res.json(crypto);
  } catch (error) {
    console.error('Get crypto error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/crypto/stats', async (req, res) => {
  try {
    const stats = await databaseService.getMarketStats();
    res.json(stats);
  } catch (error) {
    console.error('Get market stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trading signals routes
app.get('/api/signals/all', async (req, res) => {
  try {
    const signals = await databaseService.getAllSignals();
    res.json(signals);
  } catch (error) {
    console.error('Get all signals error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const signals = await databaseService.getAllSignals();
    const symbolSignals = signals[symbol.toUpperCase()] || null;
    res.json(symbolSignals);
  } catch (error) {
    console.error('Get signals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Correlation data routes
app.get('/api/correlation/:symbol1/:symbol2?', async (req, res) => {
  try {
    const { symbol1, symbol2 } = req.params;
    const correlations = await databaseService.getCorrelationData(
      symbol1.toUpperCase(), 
      symbol2 ? symbol2.toUpperCase() : null
    );
    res.json(correlations);
  } catch (error) {
    console.error('Get correlation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Portfolio routes
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const portfolio = await databaseService.getUserPortfolio(req.user.id);
    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio/trade', authenticateToken, async (req, res) => {
  try {
    const { symbol, type, quantity } = req.body;
    
    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await databaseService.executeTrade(req.user.id, {
      symbol: symbol.toUpperCase(),
      type: type.toUpperCase(),
      quantity: parseFloat(quantity)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Execute trade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize database
    await databaseService.initialize();
    
    // Start price updates
    setInterval(async () => {
      try {
        const priceUpdates = await databaseService.updateCryptoPrices();
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
        const signals = await databaseService.generateTradingSignals();
        broadcast({
          type: 'signal_updates',
          data: signals
        });
      } catch (error) {
        console.error('Signal generation error:', error);
      }
    }, 5000);
    
    const PORT = process.env.PORT || 3005;
    server.listen(PORT, () => {
      console.log(`CryptoQuantix backend server running on port ${PORT}`);
      console.log(`WebSocket server ready for connections`);
      console.log(`Database: ${databaseService.isInitialized ? 'Connected' : 'Disconnected'}`);
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
