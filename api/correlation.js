// Vercel serverless function for correlation endpoints
const cors = require('cors')({ origin: true });

// Mock correlation service data (in production, this would use real correlation calculations)
const generateCorrelationData = () => {
  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];
  const correlations = [];
  
  // Generate mock strong correlations
  correlations.push({
    symbol1: 'BTC',
    symbol2: 'ETH',
    correlation: { coefficient: 0.82, pValue: 0.001, significance: 'high', sampleSize: 100, timestamp: new Date().toISOString() },
    rolling: { 7: { coefficient: 0.78, trend: 'strengthening', significance: 'medium' } }
  });
  
  correlations.push({
    symbol1: 'BTC',
    symbol2: 'BNB',
    correlation: { coefficient: 0.79, pValue: 0.002, significance: 'high', sampleSize: 100, timestamp: new Date().toISOString() },
    rolling: { 7: { coefficient: 0.75, trend: 'stable', significance: 'medium' } }
  });
  
  return correlations;
};

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { threshold } = req.query;
    const thresholdValue = parseFloat(threshold) || 0.7;
    
    if (req.url.includes('/strong')) {
      // Strong correlations endpoint
      const strongCorrelations = generateCorrelationData().filter(
        c => Math.abs(c.correlation.coefficient) >= thresholdValue
      );
      return res.status(200).json(strongCorrelations);
    }
    
    // Default correlations endpoint
    return res.status(200).json(generateCorrelationData());
  } catch (error) {
    console.error('Correlation API error:', error);
    return res.status(500).json({ error: 'Failed to get correlation data' });
  }
};
