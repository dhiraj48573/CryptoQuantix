// Vercel serverless function for individual signal endpoint
const cors = require('cors')({ origin: true });

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter required' });
    }
    
    // Mock individual signal data
    const signal = {
      symbol: symbol.toUpperCase(),
      signal: Math.random() > 0.5 ? 'BUY' : 'SELL',
      strength: Math.floor(Math.random() * 100),
      correlation: (Math.random() - 0.5) * 2,
      btcPrice: 40000 + Math.random() * 5000,
      reason: `${Math.random() > 0.5 ? 'BUY' : 'SELL'} signal based on market analysis`,
      confidence: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(signal);
  } catch (error) {
    console.error('Individual signal API error:', error);
    return res.status(500).json({ error: 'Failed to get signal data' });
  }
};
