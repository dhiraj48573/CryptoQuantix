// Vercel serverless function for signals endpoints
const cors = require('cors')({ origin: true });

// Mock signal service data (in production, this would use real signal calculations)
const generateSignals = () => {
  const symbols = ['ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
  const signals = {};
  
  symbols.forEach(symbol => {
    const signalType = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const confidence = 0.6 + Math.random() * 0.3; // 0.6-0.9 confidence
    
    signals[symbol] = {
      signal: signalType,
      confidence: parseFloat(confidence.toFixed(3)),
      reasons: [
        `Correlation-based signal (${(0.6 + Math.random() * 0.2).toFixed(2)})`,
        `Price movement analysis`,
        `Market momentum detected`
      ],
      timestamp: new Date().toISOString(),
      price: 1000 + Math.random() * 50000, // Mock price
      correlationData: {
        coefficient: 0.7 + Math.random() * 0.2,
        significance: 'high',
        rolling: {
          7: { coefficient: 0.6 + Math.random() * 0.3, trend: 'strengthening', significance: 'medium' }
        }
      }
    };
  });
  
  return signals;
};

const generateHighConfidenceSignals = (threshold = 0.5) => {
  const allSignals = generateSignals();
  const highConfidenceSignals = {};
  
  Object.entries(allSignals).forEach(([symbol, signal]) => {
    if (signal.confidence >= threshold && signal.signal !== 'HOLD') {
      highConfidenceSignals[symbol] = signal;
    }
  });
  
  return highConfidenceSignals;
};

const generateSignalPerformance = () => {
  return {
    totalSignals: 50,
    accurateSignals: 38,
    accuracy: 0.76,
    averageConfidence: 0.72,
    highConfidenceRate: 0.64,
    lastUpdated: new Date().toISOString()
  };
};

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const url = req.url;
    
    if (url.includes('/high-confidence')) {
      // High confidence signals endpoint
      const threshold = parseFloat(req.query.threshold) || 0.5;
      const highConfidenceSignals = generateHighConfidenceSignals(threshold);
      return res.status(200).json(highConfidenceSignals);
    }
    
    if (url.includes('/performance')) {
      // Signal performance endpoint
      return res.status(200).json(generateSignalPerformance());
    }
    
    // Default signals endpoint
    return res.status(200).json(generateSignals());
  } catch (error) {
    console.error('Signals API error:', error);
    return res.status(500).json({ error: 'Failed to get trading signals' });
  }
};
+