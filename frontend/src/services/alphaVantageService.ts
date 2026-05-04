export interface AlphaVantageCrypto {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  dayHigh: number
  dayLow: number
  week52High: number
  week52Low: number
  marketCap: string
  circulatingSupply: string
  lastUpdated: Date
}

export interface AlphaVantageQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  latestTradingDay: string
  previousClose: number
  changeOverTime: number
}

export interface AlphaVantageTimeSeries {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

class AlphaVantageService {
  private readonly API_KEY = 'D77NZKFY3WBMI931'
  private readonly BASE_URL = 'https://www.alphavantage.co/query'
  private readonly CACHE_DURATION = 60000 // 1 minute cache
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  async getCryptoQuote(symbol: string): Promise<AlphaVantageQuote | null> {
    const cacheKey = `quote_${symbol}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const url = `${this.BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${this.API_KEY}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data['Error Message']) {
        console.error('Alpha Vantage API Error:', data['Error Message'])
        return null
      }

      const quote: AlphaVantageQuote = {
        symbol: symbol,
        price: parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate'] || 0),
        change: 0, // Alpha Vantage doesn't provide change in this endpoint
        changePercent: 0,
        high: 0,
        low: 0,
        volume: 0,
        latestTradingDay: new Date().toISOString().split('T')[0],
        previousClose: 0,
        changeOverTime: 0
      }

      this.setCache(cacheKey, quote)
      return quote
    } catch (error) {
      console.error('Error fetching Alpha Vantage quote:', error)
      return null
    }
  }

  async getCryptoTimeSeries(symbol: string, market: string = 'USD'): Promise<AlphaVantageTimeSeries[]> {
    const cacheKey = `timeseries_${symbol}_${market}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const url = `${this.BASE_URL}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=${market}&apikey=${this.API_KEY}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data['Error Message']) {
        console.error('Alpha Vantage API Error:', data['Error Message'])
        return []
      }

      const timeSeries = data['Time Series (Digital Currency Daily)']
      if (!timeSeries) {
        console.error('No time series data found')
        return []
      }

      const series: AlphaVantageTimeSeries[] = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
        timestamp,
        open: parseFloat(values['1a. open (USD)'] || 0),
        high: parseFloat(values['2a. high (USD)'] || 0),
        low: parseFloat(values['3a. low (USD)'] || 0),
        close: parseFloat(values['4a. close (USD)'] || 0),
        volume: parseFloat(values['5. volume'] || 0)
      })).reverse().slice(0, 30) // Get last 30 days

      this.setCache(cacheKey, series)
      return series
    } catch (error) {
      console.error('Error fetching Alpha Vantage time series:', error)
      return []
    }
  }

  async getMultipleCryptoQuotes(symbols: string[]): Promise<Map<string, AlphaVantageQuote>> {
    const quotes = new Map<string, AlphaVantageQuote>()
    
    // Alpha Vantage has rate limits, so we'll add delays between requests
    for (const symbol of symbols) {
      const quote = await this.getCryptoQuote(symbol)
      if (quote) {
        quotes.set(symbol, quote)
      }
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return quotes
  }

  async getMarketOverview(symbols: string[]): Promise<AlphaVantageCrypto[]> {
    const cryptos: AlphaVantageCrypto[] = []
    
    for (const symbol of symbols) {
      const timeSeries = await this.getCryptoTimeSeries(symbol)
      if (timeSeries.length > 0) {
        const latest = timeSeries[0]
        const previous = timeSeries[1] || latest
        
        const change = latest.close - previous.close
        const changePercent = ((latest.close - previous.close) / previous.close) * 100

        const crypto: AlphaVantageCrypto = {
          symbol: symbol,
          name: this.getCryptoName(symbol),
          price: latest.close,
          change: change,
          changePercent: changePercent,
          volume: latest.volume.toLocaleString(),
          dayHigh: latest.high,
          dayLow: latest.low,
          week52High: Math.max(...timeSeries.map(d => d.high)),
          week52Low: Math.min(...timeSeries.map(d => d.low)),
          marketCap: 'N/A', // Alpha Vantage doesn't provide market cap in free tier
          circulatingSupply: 'N/A',
          lastUpdated: new Date()
        }
        
        cryptos.push(crypto)
      }
    }
    
    return cryptos
  }

  private getCryptoName(symbol: string): string {
    const names: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'XRP': 'Ripple',
      'DOT': 'Polkadot',
      'AVAX': 'Avalanche',
      'DOGE': 'Dogecoin',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'LTC': 'Litecoin',
      'ATOM': 'Cosmos',
      'FTT': 'FTX Token'
    }
    return names[symbol] || symbol
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(): void {
    this.cache.clear()
  }

  // Method to get historical data for correlation analysis
  async getHistoricalDataForCorrelation(symbols: string[], days: number = 30): Promise<Map<string, number[]>> {
    const historicalData = new Map<string, number[]>()
    
    for (const symbol of symbols) {
      const timeSeries = await this.getCryptoTimeSeries(symbol)
      if (timeSeries.length > 0) {
        const closingPrices = timeSeries.slice(0, days).map(d => d.close)
        historicalData.set(symbol, closingPrices)
      }
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return historicalData
  }

  // Method to get real-time updates (simulated since Alpha Vantage doesn't have WebSocket in free tier)
  startRealTimeUpdates(callback: (data: AlphaVantageCrypto[]) => void, interval: number = 60000): () => void {
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX']
    
    const updateInterval = setInterval(async () => {
      try {
        const cryptos = await this.getMarketOverview(symbols)
        callback(cryptos)
      } catch (error) {
        console.error('Error in real-time update:', error)
      }
    }, interval)

    return () => clearInterval(updateInterval)
  }
}

export const alphaVantageService = new AlphaVantageService()
