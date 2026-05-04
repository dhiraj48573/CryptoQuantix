// Vercel serverless function for portfolio positions
const cors = require('cors')({ origin: true });

// Mock portfolio data (in production, this would use real portfolio data)
const generatePortfolioPositions = () => {
  return [
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
};

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const positions = generatePortfolioPositions();
    return res.status(200).json(positions);
  } catch (error) {
    console.error('Portfolio positions API error:', error);
    return res.status(500).json({ error: 'Failed to get portfolio positions' });
  }
};
