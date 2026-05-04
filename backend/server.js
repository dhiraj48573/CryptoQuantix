/**
 * Backend Server for CryptoQuantix Application
 * Provides REST API and WebSocket connections for real-time trading data
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in production, use database)
const cryptoPrices = new Map();
const signals = new Map();
const correlations = new Map();

// Initialize crypto data
const initializeCryptoPrices = () => {
  const cryptos = [
    { symbol: 'BTC', price: 45000, changePercent: 2.5 },
    { symbol: 'ETH', price: 3000, changePercent: 1.8 },
    { symbol: 'BNB', price: 400, changePercent: -0.5 },
    { symbol: 'SOL', price: 120, changePercent: 3.2 },
    { symbol: 'ADA', price: 0.8, changePercent: -1.2 },
    { symbol: 'XRP', price: 0.6, changePercent: 0.8 },
    { symbol: 'DOT', price: 25, changePercent: 2.1 },
    { symbol: 'AVAX', price: 35, changePercent: -0.3 }
  ];

  cryptos.forEach(crypto => {
    cryptoPrices.set(crypto.symbol, {
      ...crypto,
      lastUpdated: new Date(),
      volume: Math.random() * 1000000
    });
  });
};

// Update crypto prices with realistic movements
const updateCryptoPrices = () => {
  const priceData = [];
  
  cryptoPrices.forEach((crypto, symbol) => {
    const changeAmount = (Math.random() - 0.5) * crypto.price * 0.02; // ±2% max change
    const newPrice = crypto.price + changeAmount;
    const changePercent = ((newPrice - crypto.price) / crypto.price) * 100;
    
    const updatedCrypto = {
      ...crypto,
      price: parseFloat(newPrice.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: new Date()
    };
    
    cryptoPrices.set(symbol, updatedCrypto);
    priceData.push({ symbol, ...updatedCrypto });
  });

  return priceData;
};

// Generate trading signals
const generateSignals = () => {
  const signalData = {};
  const symbols = Array.from(cryptoPrices.keys()).filter(s => s !== 'BTC');
  
  symbols.forEach(symbol => {
    const signalType = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const confidence = 0.6 + Math.random() * 0.3; // 0.6-0.9 confidence
    const coefficient = Math.random() * 0.4 + 0.6; // 0.6-1.0 correlation coefficient
    
    signalData[symbol] = {
      signal: signalType,
      confidence: parseFloat(confidence.toFixed(3)),
      reasons: [
        'Correlation-based signal',
        'Price movement analysis',
        'Market momentum detected'
      ],
      timestamp: new Date(),
      price: cryptoPrices.get(symbol)?.price || 0,
      correlationData: {
        coefficient: parseFloat(coefficient.toFixed(4)),
        pValue: Math.random() * 0.05,
        significance: 'high',
        sampleSize: 100,
        timestamp: new Date().toISOString(),
        rolling: {
          7: {
            coefficient: parseFloat((coefficient * 0.95).toFixed(4)),
            trend: Math.random() > 0.5 ? 'strengthening' : 'weakening',
            significance: 'medium'
          },
          14: {
            coefficient: parseFloat((coefficient * 0.98).toFixed(4)),
            trend: Math.random() > 0.5 ? 'stable' : 'strengthening',
            significance: 'medium'
          },
          30: {
            coefficient: parseFloat((coefficient * 0.92).toFixed(4)),
            trend: Math.random() > 0.5 ? 'weakening' : 'stable',
            significance: 'low'
          }
        }
      }
    };
  });
  
  return signalData;
};

// Generate correlation data
const generateCorrelations = (threshold = 0.7) => {
  const strongCorrelations = [];
  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
  
  // Generate mock strong correlations
  strongCorrelations.push({
    symbol1: 'BTC',
    symbol2: 'ETH',
    correlation: { coefficient: 0.82, pValue: 0.001, significance: 'high', sampleSize: 100, timestamp: new Date().toISOString() },
    rolling: { 7: { coefficient: 0.78, trend: 'strengthening', significance: 'medium' } }
  });
  
  strongCorrelations.push({
    symbol1: 'BTC',
    symbol2: 'BNB',
    correlation: { coefficient: 0.79, pValue: 0.002, significance: 'high', sampleSize: 100, timestamp: new Date().toISOString() },
    rolling: { 7: { coefficient: 0.75, trend: 'stable', significance: 'medium' } }
  });
  
  return strongCorrelations.filter(c => Math.abs(c.correlation.coefficient) >= threshold);
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast data to WebSocket clients
const broadcastPrices = () => {
  const priceData = Array.from(cryptoPrices.entries()).map(([symbol, data]) => ({
    symbol,
    ...data
  }));
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'PRICE_UPDATE',
        data: priceData
      }));
    }
  });
};

const broadcastSignals = (signals) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'SIGNAL_UPDATE',
        data: signals
      }));
    }
  });
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/crypto', (req, res) => {
  const priceData = Array.from(cryptoPrices.entries()).map(([symbol, data]) => ({
    symbol,
    ...data
  }));
  res.json(priceData);
});

app.get('/api/correlation/strong/:threshold?', (req, res) => {
  try {
    const threshold = parseFloat(req.params.threshold) || 0.7;
    const strongCorrelations = generateCorrelations(threshold);
    res.json(strongCorrelations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get strong correlations' });
  }
});

app.get('/api/signals', (req, res) => {
  try {
    const signals = generateSignals();
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trading signals' });
  }
});

app.get('/api/signals/high-confidence/:threshold?', (req, res) => {
  try {
    const threshold = parseFloat(req.params.threshold) || 0.5;
    const allSignals = generateSignals();
    const highConfidenceSignals = {};
    
    Object.entries(allSignals).forEach(([symbol, signal]) => {
      if (signal.confidence >= threshold && signal.signal !== 'HOLD') {
        highConfidenceSignals[symbol] = signal;
      }
    });
    
    res.json(highConfidenceSignals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get high confidence signals' });
  }
});

app.get('/api/signals/performance', (req, res) => {
  try {
    const performance = {
      totalSignals: 50,
      accurateSignals: 38,
      accuracy: 0.76,
      averageConfidence: 0.72,
      highConfidenceRate: 0.64,
      lastUpdated: new Date().toISOString()
    };
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get signal performance' });
  }
});

// Additional correlation endpoints for Enhanced Correlation Dashboard
app.get('/api/correlation/matrix', (req, res) => {
  try {
    const matrix = {};
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
    
    symbols.forEach(symbol1 => {
      matrix[symbol1] = {};
      symbols.forEach(symbol2 => {
        if (symbol1 !== symbol2) {
          const coefficient = Math.random() * 0.4 + 0.6; // 0.6-1.0
          const pValue = Math.random() * 0.05;
          const significance = pValue < 0.01 ? 'high' : pValue < 0.05 ? 'medium' : 'low';
          
          matrix[symbol1][symbol2] = {
            coefficient: parseFloat(coefficient.toFixed(4)),
            pValue: parseFloat(pValue.toFixed(4)),
            significance,
            sampleSize: 100,
            timestamp: new Date().toISOString()
          };
        }
      });
    });
    
    res.json(matrix);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get correlation matrix' });
  }
});

app.get('/api/correlation/heatmap', (req, res) => {
  try {
    const heatmapData = [];
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
    
    symbols.forEach(symbol1 => {
      symbols.forEach(symbol2 => {
        if (symbol1 < symbol2) {
          const coefficient = Math.random() * 0.4 + 0.6; // 0.6-1.0
          const pValue = Math.random() * 0.05;
          const significance = pValue < 0.01 ? 'high' : pValue < 0.05 ? 'medium' : 'low';
          
          heatmapData.push({
            symbol1,
            symbol2,
            correlation: {
              coefficient: parseFloat(coefficient.toFixed(4)),
              pValue: parseFloat(pValue.toFixed(4)),
              significance,
              sampleSize: 100,
              timestamp: new Date().toISOString()
            },
            rolling: {
              7: {
                coefficient: parseFloat((coefficient * 0.95).toFixed(4)),
                trend: Math.random() > 0.5 ? 'strengthening' : 'weakening',
                significance: 'medium'
              }
            }
          });
        }
      });
    });
    
    res.json(heatmapData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get heatmap data' });
  }
});

app.get('/api/correlation/stats', (req, res) => {
  try {
    const stats = {
      totalPairs: 28,
      highCorrelations: 12,
      mediumCorrelations: 10,
      lowCorrelations: 6,
      avgCorrelation: 0.72,
      strongestPositive: { symbols: ['BTC', 'ETH'], coefficient: 0.89 },
      strongestNegative: { symbols: ['BTC', 'XRP'], coefficient: -0.45 },
      lastUpdated: new Date().toISOString()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get correlation stats' });
  }
});

app.get('/api/correlation/btc', (req, res) => {
  try {
    const btcCorrelations = {};
    const symbols = ['ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
    
    symbols.forEach(symbol => {
      const coefficient = Math.random() * 0.4 + 0.6; // 0.6-1.0
      const pValue = Math.random() * 0.05;
      const significance = pValue < 0.01 ? 'high' : pValue < 0.05 ? 'medium' : 'low';
      
      btcCorrelations[symbol] = {
        coefficient: parseFloat(coefficient.toFixed(4)),
        pValue: parseFloat(pValue.toFixed(4)),
        significance,
        sampleSize: 100,
        timestamp: new Date().toISOString(),
        rolling: {
          7: {
            coefficient: parseFloat((coefficient * 0.95).toFixed(4)),
            trend: Math.random() > 0.5 ? 'strengthening' : 'weakening',
            significance: 'medium'
          },
          14: {
            coefficient: parseFloat((coefficient * 0.98).toFixed(4)),
            trend: Math.random() > 0.5 ? 'stable' : 'strengthening',
            significance: 'medium'
          },
          30: {
            coefficient: parseFloat((coefficient * 0.92).toFixed(4)),
            trend: Math.random() > 0.5 ? 'weakening' : 'stable',
            significance: 'low'
          }
        }
      };
    });
    
    res.json(btcCorrelations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get BTC correlations' });
  }
});

// Start server
const PORT = process.env.PORT || 3003;

// Initialize and start
initializeCryptoPrices();

// Update prices every second
setInterval(() => {
  updateCryptoPrices();
  broadcastPrices();
}, 1000);

// Generate signals every 5 seconds
setInterval(() => {
  const signals = generateSignals();
  broadcastSignals(signals);
}, 5000);

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});
