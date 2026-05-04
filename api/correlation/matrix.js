// Vercel serverless function for correlation matrix
const cors = require('cors')({ origin: true });

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Mock correlation matrix data
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
    const matrix = {
      symbols,
      matrix: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        sampleSize: 100,
        method: 'pearson',
        timeframe: '24h'
      }
    };
    
    // Generate correlation matrix
    symbols.forEach((symbol1, i) => {
      const row = [];
      symbols.forEach((symbol2, j) => {
        if (i === j) {
          row.push(1.0); // Self-correlation
        } else {
          row.push((Math.random() - 0.5) * 2); // Random correlation -1 to 1
        }
      });
      matrix.matrix.push(row);
    });
    
    return res.status(200).json(matrix);
  } catch (error) {
    console.error('Correlation matrix API error:', error);
    return res.status(500).json({ error: 'Failed to get correlation matrix' });
  }
};
