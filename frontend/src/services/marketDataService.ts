export interface Stock {
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
  pe: number
}

export interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

class MarketDataService {
  private stocks: Stock[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.50,
      change: 2.30,
      changePercent: 1.33,
      volume: '52.3M',
      dayHigh: 176.80,
      dayLow: 174.20,
      week52High: 198.23,
      week52Low: 164.08,
      marketCap: '2.8T',
      pe: 29.4
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.30,
      change: -1.20,
      changePercent: -0.83,
      volume: '28.1M',
      dayHigh: 144.50,
      dayLow: 141.80,
      week52High: 152.10,
      week52Low: 102.65,
      marketCap: '1.8T',
      pe: 25.8
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 380.25,
      change: 5.15,
      changePercent: 1.37,
      volume: '22.8M',
      dayHigh: 382.40,
      dayLow: 378.90,
      week52High: 384.52,
      week52Low: 245.61,
      marketCap: '2.9T',
      pe: 35.2
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 245.80,
      change: -8.45,
      changePercent: -3.32,
      volume: '118.5M',
      dayHigh: 254.20,
      dayLow: 244.60,
      week52High: 299.29,
      week52Low: 152.37,
      marketCap: '780B',
      pe: 68.5
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      price: 485.30,
      change: 12.60,
      changePercent: 2.66,
      volume: '45.2M',
      dayHigh: 487.80,
      dayLow: 478.40,
      week52High: 502.66,
      week52Low: 108.13,
      marketCap: '1.2T',
      pe: 65.3
    },
    {
      symbol: 'META',
      name: 'Meta Platforms',
      price: 325.40,
      change: 3.80,
      changePercent: 1.18,
      volume: '18.7M',
      dayHigh: 327.20,
      dayLow: 323.50,
      week52High: 326.49,
      week52Low: 178.92,
      marketCap: '830B',
      pe: 31.7
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 145.80,
      change: 1.95,
      changePercent: 1.35,
      volume: '38.4M',
      dayHigh: 146.90,
      dayLow: 144.30,
      week52High: 153.38,
      week52Low: 88.12,
      marketCap: '1.5T',
      pe: 45.8
    },
    {
      symbol: 'NFLX',
      name: 'Netflix Inc.',
      price: 445.20,
      change: -2.10,
      changePercent: -0.47,
      volume: '12.3M',
      dayHigh: 448.60,
      dayLow: 444.80,
      week52High: 485.00,
      week52Low: 292.76,
      marketCap: '198B',
      pe: 42.1
    }
  ]

  private marketIndices: MarketIndex[] = [
    { name: 'S&P 500', value: 4522.18, change: 54.32, changePercent: 1.22 },
    { name: 'NASDAQ', value: 14123.45, change: 156.78, changePercent: 1.12 },
    { name: 'DOW JONES', value: 35678.90, change: 234.56, changePercent: 0.66 },
    { name: 'RUSSELL 2000', value: 2234.56, change: 12.34, changePercent: 0.55 }
  ]

  private subscribers: ((stocks: Stock[]) => void)[] = []
  private indexSubscribers: ((indices: MarketIndex[]) => void)[] = []
  private updateInterval: number | null = null

  constructor() {
    this.startRealTimeUpdates()
  }

  getStocks(): Stock[] {
    return this.stocks
  }

  getStockBySymbol(symbol: string): Stock | undefined {
    return this.stocks.find(stock => stock.symbol === symbol)
  }

  getMarketIndices(): MarketIndex[] {
    return this.marketIndices
  }

  subscribeToStockUpdates(callback: (stocks: Stock[]) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  subscribeToIndexUpdates(callback: (indices: MarketIndex[]) => void): () => void {
    this.indexSubscribers.push(callback)
    return () => {
      const index = this.indexSubscribers.indexOf(callback)
      if (index > -1) {
        this.indexSubscribers.splice(index, 1)
      }
    }
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateStockPrices()
      this.updateMarketIndices()
    }, 2000) // Update every 2 seconds
  }

  private updateStockPrices(): void {
    this.stocks = this.stocks.map(stock => {
      const priceChange = (Math.random() - 0.5) * 2 // Random change between -1 and 1
      const newPrice = Math.max(0.01, stock.price + priceChange)
      const change = newPrice - stock.price
      const changePercent = (change / stock.price) * 100

      return {
        ...stock,
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        dayHigh: Math.max(stock.dayHigh, newPrice),
        dayLow: Math.min(stock.dayLow, newPrice)
      }
    })

    this.notifyStockSubscribers()
  }

  private updateMarketIndices(): void {
    this.marketIndices = this.marketIndices.map(index => {
      const change = (Math.random() - 0.5) * 50
      const newChange = index.change + change
      const newValue = index.value + change
      const changePercent = (newChange / index.value) * 100

      return {
        ...index,
        value: parseFloat(newValue.toFixed(2)),
        change: parseFloat(newChange.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2))
      }
    })

    this.notifyIndexSubscribers()
  }

  private notifyStockSubscribers(): void {
    this.subscribers.forEach(callback => callback(this.stocks))
  }

  private notifyIndexSubscribers(): void {
    this.indexSubscribers.forEach(callback => callback(this.marketIndices))
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  searchStocks(query: string): Stock[] {
    const lowercaseQuery = query.toLowerCase()
    return this.stocks.filter(stock => 
      stock.symbol.toLowerCase().includes(lowercaseQuery) ||
      stock.name.toLowerCase().includes(lowercaseQuery)
    )
  }

  getTopMovers(limit: number = 5): { gainers: Stock[], losers: Stock[] } {
    const sortedStocks = [...this.stocks].sort((a, b) => b.changePercent - a.changePercent)
    return {
      gainers: sortedStocks.slice(0, limit),
      losers: sortedStocks.slice(-limit).reverse()
    }
  }
}

export const marketDataService = new MarketDataService()
