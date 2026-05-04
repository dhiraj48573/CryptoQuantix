// Vercel serverless function for crypto endpoints
const cors = require('cors')({ origin: true });

// Mock crypto data (in production, this would use real crypto data)
const generateCryptoData = () => {
  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', price: 41479.03, change: 879.52, changePercent: 2.17, volume: '28.5B', dayHigh: 42000, dayLow: 40500, week52High: 48000, week52Low: 25000 },
    { symbol: 'ETH', name: 'Ethereum', price: 2280.45, change: 80.45, changePercent: 3.66, volume: '15.2B', dayHigh: 2350, dayLow: 2200, week52High: 3200, week52Low: 1800 },
    { symbol: 'BNB', name: 'Binance Coin', price: 312.80, change: -5.20, changePercent: -1.63, volume: '1.8B', dayHigh: 320, dayLow: 310, week52High: 450, week52Low: 200 },
    { symbol: 'SOL', name: 'Solana', price: 98.45, change: 3.25, changePercent: 3.41, volume: '2.1B', dayHigh: 100, dayLow: 95, week52High: 120, week52Low: 60 },
    { symbol: 'ADA', name: 'Cardano', price: 0.385, change: 0.015, changePercent: 4.05, volume: '580M', dayHigh: 0.40, dayLow: 0.37, week52High: 0.65, week52Low: 0.25 },
    { symbol: 'XRP', name: 'Ripple', price: 0.625, change: -0.015, changePercent: -2.34, volume: '1.2B', dayHigh: 0.65, dayLow: 0.61, week52High: 0.85, week52Low: 0.30 },
    { symbol: 'DOT', name: 'Polkadot', price: 7.85, change: 0.35, changePercent: 4.67, volume: '320M', dayHigh: 8.00, dayLow: 7.50, week52High: 12.00, week52Low: 4.50 },
    { symbol: 'AVAX', name: 'Avalanche', price: 35.20, change: -1.80, changePercent: -4.86, volume: '450M', dayHigh: 37.00, dayLow: 34.50, week52High: 60.00, week52Low: 15.00 }
  ];
  
  return cryptos;
};

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const url = req.url;
    const cryptos = generateCryptoData();
    
    if (url.includes('/api/crypto/') && !url.includes('/api/crypto/health')) {
      // Individual crypto endpoint
      const symbol = url.split('/').pop().toUpperCase();
      const crypto = cryptos.find(c => c.symbol === symbol);
      
      if (!crypto) {
        return res.status(404).json({ error: 'Cryptocurrency not found' });
      }
      
      return res.status(200).json(crypto);
    }
    
    // All cryptos endpoint
    return res.status(200).json(cryptos);
  } catch (error) {
    console.error('Crypto API error:', error);
    return res.status(500).json({ error: 'Failed to get crypto data' });
  }
};
