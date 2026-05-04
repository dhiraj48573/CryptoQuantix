import { apiService, TradeRequest } from './apiService';

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  totalValue: number;
  commission: number;
}

export interface Portfolio {
  cash: number;
  totalValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  positions: Position[];
}

class PortfolioService {
  private subscribers: ((portfolio: Portfolio | null) => void)[] = [];
  private tradeSubscribers: ((trades: Trade[]) => void)[] = [];
  private portfolio: Portfolio | null = null;

  constructor() {
    this.loadPortfolio();
  }

  private async loadPortfolio(): Promise<void> {
    try {
      const response = await apiService.getPortfolio();
      if (response.data) {
        this.portfolio = response.data;
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      // Set default portfolio for demo purposes
      this.portfolio = {
        cash: 100000,
        totalValue: 100000,
        totalUnrealizedPnL: 0,
        totalUnrealizedPnLPercent: 0,
        dayPnL: 0,
        dayPnLPercent: 0,
        positions: []
      };
    }
  }

  async getPortfolio(): Promise<Portfolio | null> {
    if (!this.portfolio) {
      await this.loadPortfolio();
    }
    return this.portfolio;
  }

  async placeOrder(order: TradeRequest): Promise<any> {
    try {
      const response = await apiService.placeOrder(order);
      
      if (response.data) {
        // Update local portfolio with response
        this.portfolio = response.data.portfolio;
        this.notifySubscribers();
        
        // Also update trade subscribers
        const trades = await this.getTrades();
        this.notifyTradeSubscribers(trades);
        
        return response.data.trade;
      }
      
      throw new Error(response.error || 'Order failed');
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  async getTrades(): Promise<Trade[]> {
    try {
      const response = await apiService.getTrades();
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      return [];
    }
  }

  async refreshPortfolio(): Promise<void> {
    await this.loadPortfolio();
  }

  subscribeToPortfolioUpdates(callback: (portfolio: Portfolio | null) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call callback with current portfolio
    if (this.portfolio) {
      callback(this.portfolio);
    }
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  subscribeToTradeUpdates(callback: (trades: Trade[]) => void): () => void {
    this.tradeSubscribers.push(callback);
    
    // Immediately fetch and send current trades
    this.getTrades().then(trades => {
      callback(trades);
    });
    
    return () => {
      const index = this.tradeSubscribers.indexOf(callback);
      if (index > -1) {
        this.tradeSubscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.portfolio));
  }

  private notifyTradeSubscribers(trades: Trade[]): void {
    this.tradeSubscribers.forEach(callback => callback(trades));
  }

  // Utility methods
  getPositionBySymbol(symbol: string): Position | undefined {
    return this.portfolio?.positions.find(pos => pos.symbol === symbol);
  }

  getTotalValue(): number {
    return this.portfolio?.totalValue || 0;
  }

  getCash(): number {
    return this.portfolio?.cash || 0;
  }

  getTotalUnrealizedPnL(): number {
    return this.portfolio?.totalUnrealizedPnL || 0;
  }

  getTotalUnrealizedPnLPercent(): number {
    return this.portfolio?.totalUnrealizedPnLPercent || 0;
  }

  getDayPnL(): number {
    return this.portfolio?.dayPnL || 0;
  }

  getDayPnLPercent(): number {
    return this.portfolio?.dayPnLPercent || 0;
  }

  getPositions(): Position[] {
    return this.portfolio?.positions || [];
  }

  // Calculate position allocation percentages
  getAllocation(): { symbol: string; value: number; percentage: number }[] {
    if (!this.portfolio) return [];
    
    return this.portfolio.positions.map(pos => ({
      symbol: pos.symbol,
      value: pos.marketValue,
      percentage: (pos.marketValue / this.portfolio.totalValue) * 100
    }));
  }

  // Get recent trades (limited)
  async getRecentTrades(limit: number = 10): Promise<Trade[]> {
    const trades = await this.getTrades();
    return trades
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

export const portfolioService = new PortfolioService();
