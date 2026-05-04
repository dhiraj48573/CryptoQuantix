// Vercel serverless function for individual crypto endpoint
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
    
    // Mock individual crypto data
    const crypto = { 
      symbol: symbol.toUpperCase(),
      name: getCoinName(symbol),
      price: 40000 + Math.random() * 5000,
      change: (Math.random() - 0.5) * 1000,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      dayHigh: 45000,
      dayLow: 35000,
      week52High: 50000,
      week52Low: 25000
    };
    
    return res.status(200).json(crypto);
  } catch (error) {
    console.error('Individual crypto API error:', error);
    return res.status(500).json({ error: 'Failed to get crypto data' });
  }
};

function getCoinName(symbol) {
  const names = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'Binance Coin',
    'SOL': 'Solana',
    'ADA': 'Cardano',
    'XRP': 'Ripple',
    'DOT': 'Polkadot',
    'AVAX': 'Avalanche'
  };
  return names[symbol.toUpperCase()] || 'Unknown';
}
