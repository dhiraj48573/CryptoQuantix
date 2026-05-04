// Vercel serverless function for health check
const cors = require('cors')({ origin: true });

module.exports = async (req, res) => {
  // Handle CORS
  await cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    return res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ error: 'Health check failed' });
  }
};
