/**
 * Cryptocurrency Correlation Analysis Service
 * Calculates and manages correlation matrices for cryptocurrency pairs
 */

class CorrelationService {
  constructor() {
    this.priceHistory = new Map(); // Store historical price data
    this.correlationMatrix = new Map(); // Store correlation coefficients
    this.rollingCorrelations = new Map(); // Store rolling correlations
    this.updateInterval = null;
    
    // Correlation parameters
    this.minHistoryLength = 10; // Minimum data points for correlation
    this.maxHistoryLength = 100; // Maximum data points to keep
    this.rollingWindows = [7, 14, 30]; // Rolling correlation windows
    
    this.initializePriceHistory();
  }

  /**
   * Initialize price history for all cryptocurrencies
   */
  initializePriceHistory() {
    const cryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX'];

    cryptos.forEach(symbol => {
      this.priceHistory.set(symbol, []);
      this.correlationMatrix.set(symbol, new Map());
      this.rollingCorrelations.set(symbol, new Map());
    });
  }

  /**
   * Add new price data point and update correlations
   */
  addPriceData(symbol, price, timestamp = new Date()) {
    const history = this.priceHistory.get(symbol);
    if (!history) return;

    // Add new data point
    const dataPoint = {
      price: parseFloat(price),
      timestamp,
      returns: history.length > 0 ? (price - history[history.length - 1].price) / history[history.length - 1].price : 0
    };

    history.push(dataPoint);

    // Limit history length
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }

    // Update correlations for all pairs
    this.updateAllCorrelations();
  }

  /**
   * Update correlations for all cryptocurrency pairs
   */
  updateAllCorrelations() {
    const symbols = Array.from(this.priceHistory.keys());
    
    symbols.forEach(symbol1 => {
      symbols.forEach(symbol2 => {
        if (symbol1 !== symbol2) {
          this.updateCorrelation(symbol1, symbol2);
        }
      });
    });
  }

  /**
   * Update correlation between two cryptocurrencies
   */
  updateCorrelation(symbol1, symbol2) {
    const history1 = this.priceHistory.get(symbol1);
    const history2 = this.priceHistory.get(symbol2);
    
    if (!history1 || !history2 || history1.length < this.minHistoryLength || history2.length < this.minHistoryLength) {
      return;
    }

    // Calculate current correlation
    const currentCorrelation = this.calculatePearsonCorrelation(history1, history2);
    
    // Update correlation matrix
    const matrix1 = this.correlationMatrix.get(symbol1);
    const matrix2 = this.correlationMatrix.get(symbol2);
    
    if (matrix1 && matrix2) {
      matrix1.set(symbol2, currentCorrelation);
      matrix2.set(symbol1, currentCorrelation);
    }

    // Update rolling correlations
    this.updateRollingCorrelations(symbol1, symbol2);
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculatePearsonCorrelation(history1, history2) {
    const n = Math.min(history1.length, history2.length);
    
    if (n < 2) return null;

    const returns1 = history1.slice(-n).map(d => d.returns);
    const returns2 = history2.slice(-n).map(d => d.returns);

    const mean1 = returns1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = returns2.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    
    if (denominator === 0) return null;

    const coefficient = numerator / denominator;
    const pValue = this.calculatePValue(coefficient, n);
    const significance = this.getSignificanceLevel(pValue);

    return {
      coefficient: parseFloat(coefficient.toFixed(4)),
      pValue: parseFloat(pValue.toFixed(4)),
      significance,
      sampleSize: n,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate p-value for correlation coefficient
   */
  calculatePValue(coefficient, n) {
    if (n <= 2) return 1;
    
    const t = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const df = n - 2;
    
    // Simplified p-value calculation
    const pValue = 2 * (1 - this.tDistributionCDF(Math.abs(t), df));
    return Math.max(0.001, Math.min(1, pValue));
  }

  /**
   * Simplified t-distribution CDF
   */
  tDistributionCDF(t, df) {
    // Simplified approximation for t-distribution
    const z = t / Math.sqrt(df / (df - 2));
    return this.normalCDF(z);
  }

  /**
   * Normal distribution CDF
   */
  normalCDF(z) {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Get significance level based on p-value
   */
  getSignificanceLevel(pValue) {
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    if (pValue < 0.1) return 'low';
    return 'none';
  }

  /**
   * Update rolling correlations
   */
  updateRollingCorrelations(symbol1, symbol2) {
    const history1 = this.priceHistory.get(symbol1);
    const history2 = this.priceHistory.get(symbol2);
    
    if (!history1 || !history2) return;

    this.rollingWindows.forEach(window => {
      const rollingCorr = this.calculateRollingCorrelation(history1, history2, window);
      
      const rolling1 = this.rollingCorrelations.get(symbol1);
      const rolling2 = this.rollingCorrelations.get(symbol2);
      
      if (rolling1 && rolling2) {
        rolling1.set(symbol2, rollingCorr);
        rolling2.set(symbol1, rollingCorr);
      }
    });
  }

  /**
   * Calculate rolling correlation
   */
  calculateRollingCorrelation(history1, history2, window) {
    const n = Math.min(history1.length, history2.length, window);
    
    if (n < 2) {
      return {
        coefficient: 0,
        trend: 'insufficient_data',
        significance: 'none',
        change: 0
      };
    }

    const recent1 = history1.slice(-n);
    const recent2 = history2.slice(-n);
    
    const correlation = this.calculatePearsonCorrelation(recent1, recent2);
    
    if (!correlation) {
      return {
        coefficient: 0,
        trend: 'insufficient_history',
        significance: 'none',
        change: 0
      };
    }

    // Calculate trend compared to previous period
    const trend = this.calculateTrend(symbol1, symbol2, correlation.coefficient);
    
    return {
      coefficient: correlation.coefficient,
      trend,
      significance: correlation.significance,
      change: correlation.coefficient - (this.getPreviousRollingCorrelation(symbol1, symbol2, window) || 0)
    };
  }

  /**
   * Calculate trend based on correlation changes
   */
  calculateTrend(symbol1, symbol2, currentCorrelation) {
    const previousCorrelation = this.getPreviousRollingCorrelation(symbol1, symbol2, 14);
    
    if (!previousCorrelation) return 'insufficient_data';
    
    const change = currentCorrelation - previousCorrelation;
    const threshold = 0.1;
    
    if (change > threshold) return 'strengthening';
    if (change < -threshold) return 'weakening';
    if (Math.abs(change) > 0.05) return change > 0 ? 'strengthening_slight' : 'weakening_slight';
    
    return 'stable';
  }

  /**
   * Get previous rolling correlation
   */
  getPreviousRollingCorrelation(symbol1, symbol2, window) {
    // Simplified - in production, this would access historical rolling correlations
    return 0;
  }

  /**
   * Get correlation between two specific cryptocurrencies
   */
  getCorrelation(symbol1, symbol2) {
    const correlations = this.correlationMatrix.get(symbol1);
    return correlations ? correlations.get(symbol2) || null : null;
  }

  /**
   * Get rolling correlations between two cryptocurrencies
   */
  getRollingCorrelations(symbol1, symbol2) {
    const rolling = this.rollingCorrelations.get(symbol1);
    return rolling ? rolling.get(symbol2) || {} : {};
  }

  /**
   * Get current correlation matrix
   */
  getCorrelationMatrix() {
    const matrix = {};
    
    this.correlationMatrix.forEach((correlations, symbol) => {
      matrix[symbol] = {};
      correlations.forEach((corr, symbol2) => {
        matrix[symbol][symbol2] = corr;
      });
    });
    
    return matrix;
  }

  /**
   * Get BTC correlations with all other cryptocurrencies
   */
  getBTCCorrelations() {
    const btcCorrelations = this.correlationMatrix.get('BTC');
    if (!btcCorrelations) return {};

    const result = {};
    btcCorrelations.forEach((corr, symbol) => {
      const rolling = this.getRollingCorrelations('BTC', symbol);
      result[symbol] = {
        ...corr,
        rolling
      };
    });
    
    return result;
  }

  /**
   * Get strong correlations above threshold
   */
  getStrongCorrelations(threshold = 0.7) {
    const strongCorrs = [];
    
    this.correlationMatrix.forEach((correlations, symbol1) => {
      correlations.forEach((corr, symbol2) => {
        if (symbol1 < symbol2 && Math.abs(corr.coefficient) >= threshold && corr.significance !== 'none') {
          strongCorrs.push({
            symbol1,
            symbol2,
            ...corr,
            rolling: this.getRollingCorrelations(symbol1, symbol2)
          });
        }
      });
    });

    return strongCorrs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }

  /**
   * Get heatmap data for visualization
   */
  getHeatmapData() {
    const heatmapData = [];
    const symbols = Array.from(this.priceHistory.keys());
    
    symbols.forEach(symbol1 => {
      symbols.forEach(symbol2 => {
        if (symbol1 < symbol2) {
          const correlation = this.getCorrelation(symbol1, symbol2);
          if (correlation) {
            heatmapData.push({
              symbol1,
              symbol2,
              ...correlation,
              rolling: this.getRollingCorrelations(symbol1, symbol2)
            });
          }
        }
      });
    });
    
    return heatmapData;
  }

  /**
   * Get correlation statistics for analysis
   */
  getCorrelationStats() {
    const stats = {
      totalPairs: 0,
      highCorrelations: 0,
      mediumCorrelations: 0,
      lowCorrelations: 0,
      avgCorrelation: 0,
      strongestPositive: { symbols: [], coefficient: 0 },
      strongestNegative: { symbols: [], coefficient: 0 }
    };
    
    const correlations = [];
    
    this.correlationMatrix.forEach((correlations, symbol1) => {
      correlations.forEach((corr, symbol2) => {
        if (symbol1 < symbol2 && corr) {
          stats.totalPairs++;
          correlations.push(corr.coefficient);
          
          const absCoeff = Math.abs(corr.coefficient);
          if (absCoeff >= 0.7) stats.highCorrelations++;
          else if (absCoeff >= 0.4) stats.mediumCorrelations++;
          else stats.lowCorrelations++;
          
          if (corr.coefficient > stats.strongestPositive.coefficient) {
            stats.strongestPositive = { symbols: [symbol1, symbol2], coefficient: corr.coefficient };
          }
          
          if (corr.coefficient < stats.strongestNegative.coefficient) {
            stats.strongestNegative = { symbols: [symbol1, symbol2], coefficient: corr.coefficient };
          }
        }
      });
    });
    
    if (correlations.length > 0) {
      stats.avgCorrelation = correlations.reduce((sum, coeff) => sum + Math.abs(coeff), 0) / correlations.length;
    }
    
    return stats;
  }

  /**
   * Start automatic correlation updates
   */
  startAutoUpdate(intervalMs = 5000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      // This would be called from the main server with price data
    }, intervalMs);
  }

  /**
   * Stop automatic updates
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

module.exports = CorrelationService;
