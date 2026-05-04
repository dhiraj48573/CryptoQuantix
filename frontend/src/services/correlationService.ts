import { cryptoDataService } from './cryptoDataService'

export interface CorrelationMatrix {
  symbol: string
  correlations: { [symbol: string]: CorrelationValue }
}

export interface CorrelationValue {
  coefficient: number
  pValue: number
  significance: 'high' | 'medium' | 'low' | 'none'
  lastUpdated: Date
}

export interface CorrelationTrend {
  symbol1: string
  symbol2: string
  historicalCorrelations: { timestamp: Date; correlation: number }[]
  trend: 'strengthening' | 'weakening' | 'stable'
  trendStrength: number
}

export interface CorrelationHeatmapData {
  symbol1: string
  symbol2: string
  correlation: number
  intensity: number // 0-100 for visualization
}

class CorrelationService {
  private correlationMatrix: Map<string, CorrelationMatrix> = new Map()
  private correlationHistory: Map<string, CorrelationTrend> = new Map()
  private updateInterval: number | null = null

  constructor() {
    this.initializeCorrelationMatrix()
    this.startCorrelationTracking()
  }

  private initializeCorrelationMatrix(): void {
    const cryptos = cryptoDataService.getCryptocurrencies()
    
    cryptos.forEach(crypto => {
      const correlations: { [symbol: string]: CorrelationValue } = {}
      
      cryptos.forEach(otherCrypto => {
        if (crypto.symbol !== otherCrypto.symbol) {
          correlations[otherCrypto.symbol] = {
            coefficient: 0,
            pValue: 1,
            significance: 'none',
            lastUpdated: new Date()
          }
        }
      })
      
      this.correlationMatrix.set(crypto.symbol, {
        symbol: crypto.symbol,
        correlations
      })
    })
  }

  private startCorrelationTracking(): void {
    this.updateInterval = setInterval(() => {
      this.updateCorrelations()
    }, 5000) // Update correlations every 5 seconds
  }

  private updateCorrelations(): void {
    const cryptos = cryptoDataService.getCryptocurrencies()
    
    cryptos.forEach(crypto => {
      const matrix = this.correlationMatrix.get(crypto.symbol)
      if (!matrix) return

      cryptos.forEach(otherCrypto => {
        if (crypto.symbol !== otherCrypto.symbol) {
          const correlation = this.calculateAdvancedCorrelation(crypto.symbol, otherCrypto.symbol)
          const significance = this.determineSignificance(correlation.coefficient, correlation.pValue)
          
          matrix.correlations[otherCrypto.symbol] = {
            coefficient: correlation.coefficient,
            pValue: correlation.pValue,
            significance,
            lastUpdated: new Date()
          }

          // Update correlation history
          this.updateCorrelationHistory(crypto.symbol, otherCrypto.symbol, correlation.coefficient)
        }
      })
    })
  }

  private calculateAdvancedCorrelation(symbol1: string, symbol2: string): { coefficient: number; pValue: number } {
    const history1 = cryptoDataService.getPriceHistory(symbol1)
    const history2 = cryptoDataService.getPriceHistory(symbol2)
    
    if (history1.length < 50 || history2.length < 50) {
      return { coefficient: 0, pValue: 1 }
    }

    const n = Math.min(history1.length, history2.length)
    const data1 = history1.slice(-n)
    const data2 = history2.slice(-n)

    // Calculate Pearson correlation with returns instead of prices
    const returns1 = this.calculateReturns(data1)
    const returns2 = this.calculateReturns(data2)

    return this.pearsonCorrelation(returns1, returns2)
  }

  private calculateReturns(prices: number[]): number[] {
    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    return returns
  }

  private pearsonCorrelation(x: number[], y: number[]): { coefficient: number; pValue: number } {
    const n = Math.min(x.length, y.length)
    if (n < 2) return { coefficient: 0, pValue: 1 }

    const meanX = x.reduce((sum, val) => sum + val, 0) / n
    const meanY = y.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let sumSqX = 0
    let sumSqY = 0

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX
      const diffY = y[i] - meanY
      numerator += diffX * diffY
      sumSqX += diffX * diffX
      sumSqY += diffY * diffY
    }

    const denominator = Math.sqrt(sumSqX * sumSqY)
    const correlation = denominator === 0 ? 0 : numerator / denominator

    // Simplified t-test for p-value
    const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation))
    const pValue = this.tTestPValue(tStat, n - 2)

    return { coefficient: correlation, pValue }
  }

  private tTestPValue(tStat: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation for demonstration
    const absT = Math.abs(tStat)
    if (absT > 2.5) return 0.01
    if (absT > 2.0) return 0.05
    if (absT > 1.5) return 0.1
    return 0.2
  }

  private determineSignificance(coefficient: number, pValue: number): 'high' | 'medium' | 'low' | 'none' {
    const absCoeff = Math.abs(coefficient)
    
    if (pValue < 0.01 && absCoeff > 0.7) return 'high'
    if (pValue < 0.05 && absCoeff > 0.5) return 'medium'
    if (pValue < 0.1 && absCoeff > 0.3) return 'low'
    return 'none'
  }

  private updateCorrelationHistory(symbol1: string, symbol2: string, correlation: number): void {
    const key = `${symbol1}-${symbol2}`
    const trend = this.correlationHistory.get(key) || {
      symbol1,
      symbol2,
      historicalCorrelations: [],
      trend: 'stable' as const,
      trendStrength: 0
    }

    trend.historicalCorrelations.push({
      timestamp: new Date(),
      correlation
    })

    // Keep only last 50 data points
    if (trend.historicalCorrelations.length > 50) {
      trend.historicalCorrelations.shift()
    }

    // Calculate trend
    if (trend.historicalCorrelations.length >= 10) {
      const recent = trend.historicalCorrelations.slice(-10)
      const older = trend.historicalCorrelations.slice(-20, -10)
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, item) => sum + item.correlation, 0) / recent.length
        const olderAvg = older.reduce((sum, item) => sum + item.correlation, 0) / older.length
        
        const change = recentAvg - olderAvg
        trend.trendStrength = Math.abs(change) * 100
        
        if (change > 0.1) {
          trend.trend = 'strengthening'
        } else if (change < -0.1) {
          trend.trend = 'weakening'
        } else {
          trend.trend = 'stable'
        }
      }
    }

    this.correlationHistory.set(key, trend)
  }

  getCorrelationMatrix(): CorrelationMatrix[] {
    return Array.from(this.correlationMatrix.values())
  }

  getCorrelation(symbol1: string, symbol2: string): CorrelationValue | null {
    const matrix = this.correlationMatrix.get(symbol1)
    if (!matrix) return null
    
    return matrix.correlations[symbol2] || null
  }

  getCorrelationTrend(symbol1: string, symbol2: string): CorrelationTrend | null {
    const key = `${symbol1}-${symbol2}`
    return this.correlationHistory.get(key) || null
  }

  getHeatmapData(): CorrelationHeatmapData[] {
    const heatmapData: CorrelationHeatmapData[] = []
    const cryptos = cryptoDataService.getCryptocurrencies()
    
    cryptos.forEach(crypto1 => {
      cryptos.forEach(crypto2 => {
        if (crypto1.symbol < crypto2.symbol) { // Avoid duplicates
          const correlation = this.getCorrelation(crypto1.symbol, crypto2.symbol)
          if (correlation) {
            heatmapData.push({
              symbol1: crypto1.symbol,
              symbol2: crypto2.symbol,
              correlation: correlation.coefficient,
              intensity: Math.abs(correlation.coefficient) * 100
            })
          }
        }
      })
    })
    
    return heatmapData
  }

  getStrongCorrelations(threshold: number = 0.7): CorrelationValue[] {
    const strongCorrelations: CorrelationValue[] = []
    
    this.correlationMatrix.forEach(matrix => {
      Object.entries(matrix.correlations).forEach(([symbol, correlation]) => {
        if (Math.abs(correlation.coefficient) >= threshold && correlation.significance !== 'none') {
          strongCorrelations.push(correlation)
        }
      })
    })
    
    return strongCorrelations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
  }

  getBTCCorrelations(): CorrelationValue[] {
    const btcMatrix = this.correlationMatrix.get('BTC')
    if (!btcMatrix) return []
    
    return Object.entries(btcMatrix.correlations)
      .map(([symbol, correlation]) => ({ ...correlation, symbol }))
      .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
  }

  getCorrelationAnalysis(symbol: string): {
    avgCorrelation: number
    strongestPositive: { symbol: string; correlation: number }
    strongestNegative: { symbol: string; correlation: number }
    significantCorrelations: number
  } {
    const matrix = this.correlationMatrix.get(symbol)
    if (!matrix) {
      return {
        avgCorrelation: 0,
        strongestPositive: { symbol: '', correlation: 0 },
        strongestNegative: { symbol: '', correlation: 0 },
        significantCorrelations: 0
      }
    }

    const correlations = Object.values(matrix.correlations)
    const significantCorrelations = correlations.filter(c => c.significance !== 'none')
    
    const avgCorrelation = significantCorrelations.length > 0
      ? significantCorrelations.reduce((sum, c) => sum + Math.abs(c.coefficient), 0) / significantCorrelations.length
      : 0

    const strongestPositive = correlations.reduce((best, current) => 
      current.coefficient > best.correlation ? { symbol: '', correlation: current.coefficient } : best,
      { symbol: '', correlation: -1 }
    )

    const strongestNegative = correlations.reduce((best, current) => 
      current.coefficient < best.correlation ? { symbol: '', correlation: current.coefficient } : best,
      { symbol: '', correlation: 1 }
    )

    return {
      avgCorrelation,
      strongestPositive,
      strongestNegative,
      significantCorrelations: significantCorrelations.length
    }
  }

  stopCorrelationTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
}

export const correlationService = new CorrelationService()
