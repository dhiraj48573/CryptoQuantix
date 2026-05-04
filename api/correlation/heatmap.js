// Vercel serverless function for correlation heatmap
const cors = require('cors')({ origin: true });

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Mock correlation heatmap data
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
    const heatmap = {};
    
    symbols.forEach(symbol1 => {
      symbols.forEach(symbol2 => {
        if (symbol1 !== symbol2) {
          const key = `${symbol1}-${symbol2}`;
          heatmap[key] = {
            symbol1,
            symbol2,
            correlation: (Math.random() - 0.5) * 2,
            pValue: Math.random() * 0.05,
            significance: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
            sampleSize: 100,
            timestamp: new Date().toISOString()
          };
        }
      });
    });
    
    return res.status(200).json(heatmap);
  } catch (error) {
    console.error('Correlation heatmap API error:', error);
    return res.status(500).json({ error: 'Failed to get correlation heatmap' });
  }
};
