import { cryptoDataService } from './cryptoDataService'
import { marketDataService } from './marketDataService'

export interface Position {
  symbol: string
  name: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  dayChange: number
  dayChangePercent: number
}

export interface Trade {
  id: string
  symbol: string
  name: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  timestamp: Date
  totalValue: number
  commission: number
}

export interface Portfolio {
  cash: number
  totalValue: number
  totalCost: number
  totalUnrealizedPnL: number
  totalUnrealizedPnLPercent: number
  dayPnL: number
  dayPnLPercent: number
  positions: Position[]
  trades: Trade[]
  totalRealizedPnL: number
  winRate: number
  totalTrades: number
}

export interface Order {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  orderType: 'MARKET' | 'LIMIT'
  quantity: number
  price?: number
  status: 'PENDING' | 'FILLED' | 'CANCELLED'
  timestamp: Date
  filledPrice?: number
  filledQuantity?: number
}

export interface PortfolioConfig {
  id: string
  name: string
  description: string
  initialCapital: number
  commissionRate: number
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  maxPositionSize: number
  stopLossPercentage: number
  takeProfitPercentage: number
  createdAt: Date
  isActive: boolean
  portfolio: Portfolio
}

class PortfolioService {
  private initialCapital = 100000
  private commissionRate = 0 // Free trading for paper trading
  private portfolio: Portfolio
  private orders: Order[] = []
  private subscribers: ((portfolio: Portfolio) => void)[] = []
  private portfolioConfigs: PortfolioConfig[] = []
  private activeConfigId: string = 'conservative'

  constructor() {
    this.portfolio = this.initializePortfolio()
    this.startPortfolioUpdates()
  }

  private initializePortfolio(): Portfolio {
    return {
      cash: this.initialCapital,
      totalValue: this.initialCapital,
      totalCost: 0,
      totalUnrealizedPnL: 0,
      totalUnrealizedPnLPercent: 0,
      dayPnL: 0,
      dayPnLPercent: 0,
      positions: [],
      trades: [],
      totalRealizedPnL: 0,
      winRate: 0,
      totalTrades: 0
    }
  }

  private initializeDefaultConfigs(): void {
    const defaultConfigs: PortfolioConfig[] = [
      {
        id: 'conservative',
        name: 'Conservative Portfolio',
        description: 'Low-risk portfolio with stable returns',
        initialCapital: 100000,
        commissionRate: 0,
        riskLevel: 'conservative',
        maxPositionSize: 5000,
        stopLossPercentage: 5,
        takeProfitPercentage: 10,
        createdAt: new Date(),
        isActive: true,
        portfolio: this.initializePortfolio()
      },
      {
        id: 'moderate',
        name: 'Moderate Portfolio',
        description: 'Balanced risk-reward portfolio',
        initialCapital: 100000,
        commissionRate: 0,
        riskLevel: 'moderate',
        maxPositionSize: 10000,
        stopLossPercentage: 8,
        takeProfitPercentage: 15,
        createdAt: new Date(),
        isActive: false,
        portfolio: this.initializePortfolio()
      },
      {
        id: 'aggressive',
        name: 'Aggressive Portfolio',
        description: 'High-risk portfolio for maximum returns',
        initialCapital: 100000,
        commissionRate: 0,
        riskLevel: 'aggressive',
        maxPositionSize: 20000,
        stopLossPercentage: 12,
        takeProfitPercentage: 25,
        createdAt: new Date(),
        isActive: false,
        portfolio: this.initializePortfolio()
      }
    ]
    
    this.portfolioConfigs = defaultConfigs
    this.activeConfigId = 'conservative'
  }

  getPortfolio(): Portfolio {
    const activeConfig = this.portfolioConfigs.find(config => config.id === this.activeConfigId)
    return activeConfig ? { ...activeConfig.portfolio } : { ...this.portfolio }
  }

  getOrders(): Order[] {
    return [...this.orders]
  }

  getPortfolioConfigs(): PortfolioConfig[] {
    return [...this.portfolioConfigs]
  }

  getActiveConfig(): PortfolioConfig | undefined {
    return this.portfolioConfigs.find(config => config.id === this.activeConfigId)
  }

  switchPortfolio(configId: string): boolean {
    const config = this.portfolioConfigs.find(c => c.id === configId)
    if (!config) return false

    // Update active status
    this.portfolioConfigs.forEach(c => c.isActive = c.id === configId)
    this.activeConfigId = configId
    this.portfolio = config.portfolio

    this.notifySubscribers()
    return true
  }

  transferAsset(fromConfigId: string, toConfigId: string, symbol: string, quantity: number): boolean {
    const fromConfig = this.portfolioConfigs.find(c => c.id === fromConfigId)
    const toConfig = this.portfolioConfigs.find(c => c.id === toConfigId)
    
    if (!fromConfig || !toConfig || fromConfigId === toConfigId) return false

    const position = fromConfig.portfolio.positions.find(p => p.symbol === symbol)
    if (!position || position.quantity < quantity) return false

    // Remove from source config
    const remainingQuantity = position.quantity - quantity
    if (remainingQuantity === 0) {
      fromConfig.portfolio.positions = fromConfig.portfolio.positions.filter(p => p.symbol !== symbol)
    } else {
      position.quantity = remainingQuantity
      position.marketValue = remainingQuantity * position.currentPrice
      position.unrealizedPnL = (position.currentPrice - position.avgCost) * remainingQuantity
    }

    // Add to target config
    const targetPosition = toConfig.portfolio.positions.find(p => p.symbol === symbol)
    if (targetPosition) {
      // Add to existing position
      const newQuantity = targetPosition.quantity + quantity
      const newAvgCost = ((targetPosition.avgCost * targetPosition.quantity) + (position.avgCost * quantity)) / newQuantity
      targetPosition.quantity = newQuantity
      targetPosition.avgCost = newAvgCost
      targetPosition.marketValue = newQuantity * targetPosition.currentPrice
      targetPosition.unrealizedPnL = (targetPosition.currentPrice - newAvgCost) * newQuantity
    } else {
      // Create new position
      toConfig.portfolio.positions.push({
        symbol: position.symbol,
        name: position.name,
        quantity: quantity,
        avgCost: position.avgCost,
        currentPrice: position.currentPrice,
        marketValue: quantity * position.currentPrice,
        unrealizedPnL: (position.currentPrice - position.avgCost) * quantity,
        unrealizedPnLPercent: ((position.currentPrice - position.avgCost) * quantity) / (position.avgCost * quantity) * 100,
        dayChange: 0,
        dayChangePercent: 0
      })
    }

    // Update portfolio metrics for both configs
    this.updatePortfolioMetricsForConfig(fromConfig)
    this.updatePortfolioMetricsForConfig(toConfig)

    // Create transfer record
    const transferRecord = {
      id: this.generateOrderId(),
      type: 'TRANSFER' as const,
      fromConfig: fromConfig.name,
      toConfig: toConfig.name,
      symbol: symbol,
      quantity: quantity,
      timestamp: new Date(),
      avgCost: position.avgCost,
      currentValue: quantity * position.currentPrice
    }

    // Update active portfolio if needed
    if (this.activeConfigId === fromConfigId || this.activeConfigId === toConfigId) {
      this.portfolio = this.getActiveConfig()?.portfolio || this.portfolio
      this.notifySubscribers()
    }

    return true
  }

  private updatePortfolioMetricsForConfig(config: PortfolioConfig): void {
    let totalMarketValue = 0
    let totalCost = 0
    let totalUnrealizedPnL = 0

    config.portfolio.positions = config.portfolio.positions.map(position => {
      const crypto = cryptoDataService.getCryptoBySymbol(position.symbol)
      const stock = !crypto ? marketDataService.getStockBySymbol(position.symbol) : null
      const asset = crypto || stock
      
      if (asset) {
        const marketValue = position.quantity * asset.price
        const unrealizedPnL = (asset.price - position.avgCost) * position.quantity

        totalMarketValue += marketValue
        totalCost += position.avgCost * position.quantity
        totalUnrealizedPnL += unrealizedPnL

        return {
          ...position,
          currentPrice: asset.price,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPercent: totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0
        }
      }
      return position
    })

    config.portfolio.totalValue = config.portfolio.cash + totalMarketValue
    config.portfolio.totalCost = totalCost
    config.portfolio.totalUnrealizedPnL = totalUnrealizedPnL
    config.portfolio.totalUnrealizedPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0
  }

  subscribeToPortfolioUpdates(callback: (portfolio: Portfolio) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status' | 'filledPrice' | 'filledQuantity'>): Order {
    const newOrder: Order = {
      ...order,
      id: this.generateOrderId(),
      timestamp: new Date(),
      status: 'PENDING'
    }

    this.orders.push(newOrder)

    // For market orders, execute immediately
    if (order.orderType === 'MARKET') {
      this.executeOrder(newOrder)
    }

    return newOrder
  }

  private executeOrder(order: Order): void {
    // Try to get crypto first, then stock
    const crypto = cryptoDataService.getCryptoBySymbol(order.symbol)
    const stock = !crypto ? marketDataService.getStockBySymbol(order.symbol) : null
    
    if (!crypto && !stock) {
      order.status = 'CANCELLED'
      return
    }

    const asset = crypto || stock
    const executionPrice = order.orderType === 'MARKET' ? asset.price : (order.price || asset.price)
    const totalValue = order.quantity * executionPrice
    const commission = totalValue * this.commissionRate

    // Check if user has enough cash for buy orders
    if (order.type === 'BUY' && this.portfolio.cash < totalValue + commission) {
      order.status = 'CANCELLED'
      return
    }

    // Check if user has enough shares for sell orders
    if (order.type === 'SELL') {
      const position = this.portfolio.positions.find(p => p.symbol === order.symbol)
      if (!position || position.quantity < order.quantity) {
        order.status = 'CANCELLED'
        return
      }
    }

    // Execute the trade
    order.status = 'FILLED'
    order.filledPrice = executionPrice
    order.filledQuantity = order.quantity

    const trade: Trade = {
      id: this.generateTradeId(),
      symbol: order.symbol,
      name: asset.name,
      type: order.type,
      quantity: order.quantity,
      price: executionPrice,
      timestamp: new Date(),
      totalValue,
      commission
    }

    this.portfolio.trades.push(trade)

    if (order.type === 'BUY') {
      this.executeBuyTrade(trade)
    } else {
      this.executeSellTrade(trade)
    }

    this.updatePortfolioMetrics()
    this.notifySubscribers()
  }

  private executeBuyTrade(trade: Trade): void {
    const totalCost = trade.totalValue + trade.commission
    this.portfolio.cash -= totalCost

    const existingPosition = this.portfolio.positions.find(p => p.symbol === trade.symbol)
    
    if (existingPosition) {
      // Add to existing position
      const newQuantity = existingPosition.quantity + trade.quantity
      const newAvgCost = ((existingPosition.avgCost * existingPosition.quantity) + totalCost) / newQuantity
      
      existingPosition.quantity = newQuantity
      existingPosition.avgCost = newAvgCost
    } else {
      // Create new position
      const crypto = cryptoDataService.getCryptoBySymbol(trade.symbol)
      const stock = !crypto ? marketDataService.getStockBySymbol(trade.symbol) : null
      const asset = crypto || stock
      
      if (asset) {
        this.portfolio.positions.push({
          symbol: trade.symbol,
          name: trade.name,
          quantity: trade.quantity,
          avgCost: trade.price + (trade.commission / trade.quantity),
          currentPrice: asset.price,
          marketValue: trade.quantity * asset.price,
          unrealizedPnL: (asset.price - trade.price) * trade.quantity - trade.commission,
          unrealizedPnLPercent: ((asset.price - trade.price) * trade.quantity - trade.commission) / totalCost * 100,
          dayChange: 0,
          dayChangePercent: 0
        })
      }
    }
  }

  private executeSellTrade(trade: Trade): void {
    const totalProceeds = trade.totalValue - trade.commission
    this.portfolio.cash += totalProceeds

    const position = this.portfolio.positions.find(p => p.symbol === trade.symbol)
    if (position) {
      const realizedPnL = (trade.price - position.avgCost) * trade.quantity - trade.commission
      this.portfolio.totalRealizedPnL += realizedPnL

      if (position.quantity === trade.quantity) {
        // Close position completely
        this.portfolio.positions = this.portfolio.positions.filter(p => p.symbol !== trade.symbol)
      } else {
        // Reduce position
        position.quantity -= trade.quantity
        position.marketValue = position.quantity * position.currentPrice
        position.unrealizedPnL = (position.currentPrice - position.avgCost) * position.quantity
        position.unrealizedPnLPercent = position.unrealizedPnL / (position.avgCost * position.quantity) * 100
      }
    }
  }

  private updatePortfolioMetrics(): void {
    let totalMarketValue = 0
    let totalCost = 0
    let totalUnrealizedPnL = 0
    let dayPnL = 0

    // Update positions with current prices
    this.portfolio.positions = this.portfolio.positions.map(position => {
      const crypto = cryptoDataService.getCryptoBySymbol(position.symbol)
      const stock = !crypto ? marketDataService.getStockBySymbol(position.symbol) : null
      const asset = crypto || stock
      
      if (asset) {
        const marketValue = position.quantity * asset.price
        const unrealizedPnL = (asset.price - position.avgCost) * position.quantity
        const dayChange = (asset.change || 0) * position.quantity

        totalMarketValue += marketValue
        totalCost += position.avgCost * position.quantity
        totalUnrealizedPnL += unrealizedPnL
        dayPnL += dayChange

        return {
          ...position,
          currentPrice: asset.price,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPercent: totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0,
          dayChange,
          dayChangePercent: asset.changePercent ? (asset.changePercent * position.quantity) / 100 : 0
        }
      }
      return position
    })

    this.portfolio.totalValue = this.portfolio.cash + totalMarketValue
    this.portfolio.totalCost = totalCost
    this.portfolio.totalUnrealizedPnL = totalUnrealizedPnL
    this.portfolio.totalUnrealizedPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0
    this.portfolio.dayPnL = dayPnL
    this.portfolio.dayPnLPercent = totalCost > 0 ? (dayPnL / totalCost) * 100 : 0
    this.portfolio.totalTrades = this.portfolio.trades.length
    this.portfolio.winRate = this.calculateWinRate()
  }

  private calculateWinRate(): number {
    const profitableTrades = this.portfolio.trades.filter(trade => {
      if (trade.type === 'SELL') {
        const buyTrades = this.portfolio.trades.filter(t => t.symbol === trade.symbol && t.type === 'BUY')
        const totalBuyCost = buyTrades.reduce((sum, t) => sum + (t.totalValue + t.commission), 0)
        const sellProceeds = trade.totalValue - trade.commission
        return sellProceeds > totalBuyCost
      }
      return false
    })

    this.portfolio.totalTrades = this.portfolio.trades.filter(t => t.type === 'SELL').length
    this.portfolio.winRate = this.portfolio.totalTrades > 0 ? (profitableTrades.length / this.portfolio.totalTrades) * 100 : 0
    return this.portfolio.winRate
  }

  private startPortfolioUpdates(): void {
    cryptoDataService.subscribeToCryptoUpdates(() => {
      this.updatePortfolioMetrics()
      this.notifySubscribers()
    })
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getPortfolio()))
  }

  private generateOrderId(): string {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTradeId(): string {
    return `TRADE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId)
    if (order && order.status === 'PENDING') {
      order.status = 'CANCELLED'
      return true
    }
    return false
  }

  getPositions(): Position[] {
    return [...this.portfolio.positions]
  }

  getTrades(): Trade[] {
    return [...this.portfolio.trades].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getRecentTrades(limit: number = 10): Trade[] {
    return this.getTrades().slice(0, limit)
  }

  resetPortfolio(): void {
    this.portfolio = this.initializePortfolio()
    this.orders = []
    this.notifySubscribers()
  }

  getPerformanceMetrics(): {
    totalReturn: number
    totalReturnPercent: number
    sharpeRatio: number
    maxDrawdown: number
    volatility: number
  } {
    const totalReturn = this.portfolio.totalValue - this.initialCapital
    const totalReturnPercent = (totalReturn / this.initialCapital) * 100
    
    // Simplified calculations for demo purposes
    const sharpeRatio = totalReturnPercent > 0 ? (totalReturnPercent / 15) * Math.sqrt(252) : 0 // Assuming 15% annual volatility
    const maxDrawdown = Math.max(0, (this.portfolio.totalValue - this.portfolio.totalCost) / this.portfolio.totalCost * 100)
    const volatility = 15 // Simplified

    return {
      totalReturn,
      totalReturnPercent,
      sharpeRatio,
      maxDrawdown,
      volatility
    }
  }
}

export const portfolioService = new PortfolioService()
