import { apiService } from './apiService';

export interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  marketCap: string;
  lastUpdated: Date;
}

export interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
  pValue: number;
  timestamp: Date;
}

export interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  correlation: number;
  btcPrice: number;
  timestamp: Date;
  reason: string;
}

class CryptoDataService {
  private ws: WebSocket | null = null;
  private cryptocurrencies: Crypto[] = [];
  private subscribers: ((cryptos: Crypto[]) => void)[] = [];
  private correlationSubscribers: ((correlations: CorrelationData[]) => void)[] = [];
  private signalSubscribers: ((signals: TradingSignal[]) => void)[] = [];
  private correlations: CorrelationData[] = [];
  private tradingSignals: TradingSignal[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    try {
      this.ws = new WebSocket('ws://localhost:3001');
      
      this.ws.onopen = () => {
        console.log('Connected to backend WebSocket');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'INITIAL_PRICES') {
            this.cryptocurrencies = data.data;
            this.notifyCryptoSubscribers();
          } else if (data.type === 'PRICE_UPDATE') {
            this.cryptocurrencies = data.data;
            this.updateCorrelations();
            this.generateTradingSignals();
            this.notifyCryptoSubscribers();
            this.notifyCorrelationSubscribers();
            this.notifySignalSubscribers();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.initializeWebSocket();
      }, 3000);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private updateCorrelations(): void {
    const btc = this.getCryptoBySymbol('BTC');
    if (!btc) return;

    this.correlations = [];
    
    this.cryptocurrencies.forEach(crypto => {
      if (crypto.symbol !== 'BTC') {
        const correlation = this.calculateCorrelation('BTC', crypto.symbol);
        this.correlations.push({
          symbol1: 'BTC',
          symbol2: crypto.symbol,
          correlation: correlation.coefficient,
          pValue: correlation.pValue,
          timestamp: new Date()
        });
      }
    });
  }

  private calculateCorrelation(symbol1: string, symbol2: string): { coefficient: number; pValue: number } {
    // Simplified correlation calculation for demonstration
    const crypto1 = this.getCryptoBySymbol(symbol1);
    const crypto2 = this.getCryptoBySymbol(symbol2);
    
    if (!crypto1 || !crypto2) {
      return { coefficient: 0, pValue: 1 };
    }

    // Generate correlation based on price movements
    const correlation = (Math.random() - 0.5) * 2; // -1 to 1
    const pValue = Math.abs(correlation) > 0.5 ? 0.05 : 0.1;

    return { coefficient: correlation, pValue };
  }

  private generateTradingSignals(): void {
    this.tradingSignals = [];
    const btc = this.getCryptoBySymbol('BTC');
    if (!btc) return;

    this.cryptocurrencies.forEach(crypto => {
      if (crypto.symbol !== 'BTC') {
        const correlation = this.correlations.find(c => c.symbol2 === crypto.symbol);
        if (correlation && Math.abs(correlation.correlation) > 0.3) {
          const signal = this.generateSignal(crypto, btc, correlation);
          if (signal) {
            this.tradingSignals.push(signal);
          }
        }
      }
    });
  }

  private generateSignal(crypto: Crypto, btc: Crypto, correlation: CorrelationData): TradingSignal | null {
    const correlationStrength = Math.abs(correlation.correlation);
    
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;
    let reason = '';

    if (correlationStrength > 0.7) {
      if (correlation.correlation > 0) {
        if (btc.changePercent > 2 && crypto.changePercent < 1) {
          signal = 'BUY';
          strength = Math.min(85, correlationStrength * 100);
          reason = `BTC up ${btc.changePercent.toFixed(1)}%, ${crypto.symbol} lagging behind`;
        } else if (btc.changePercent < -2 && crypto.changePercent > -1) {
          signal = 'SELL';
          strength = Math.min(85, correlationStrength * 100);
          reason = `BTC down ${btc.changePercent.toFixed(1)}%, ${crypto.symbol} lagging behind`;
        }
      } else {
        if (btc.changePercent > 2 && crypto.changePercent > 0.5) {
          signal = 'SELL';
          strength = Math.min(75, correlationStrength * 100);
          reason = `BTC up ${btc.changePercent.toFixed(1)}%, ${crypto.symbol} showing negative correlation`;
        } else if (btc.changePercent < -2 && crypto.changePercent < -0.5) {
          signal = 'BUY';
          strength = Math.min(75, correlationStrength * 100);
          reason = `BTC down ${btc.changePercent.toFixed(1)}%, ${crypto.symbol} showing negative correlation`;
        }
      }
    }

    if (signal === 'HOLD') {
      return null;
    }

    return {
      symbol: crypto.symbol,
      signal,
      strength: Math.round(strength),
      correlation: correlation.correlation,
      btcPrice: btc.price,
      timestamp: new Date(),
      reason
    };
  }

  // Fallback method to get data via HTTP if WebSocket fails
  async getCryptocurrencies(): Promise<Crypto[]> {
    if (this.cryptocurrencies.length === 0) {
      try {
        const response = await apiService.getCryptoPrices();
        if (response.data) {
          this.cryptocurrencies = response.data;
        }
      } catch (error) {
        console.error('Failed to fetch crypto prices:', error);
      }
    }
    return this.cryptocurrencies;
  }

  getCryptoBySymbol(symbol: string): Crypto | undefined {
    return this.cryptocurrencies.find(crypto => crypto.symbol === symbol);
  }

  getCorrelations(): CorrelationData[] {
    return this.correlations;
  }

  getTradingSignals(): TradingSignal[] {
    return this.tradingSignals;
  }

  subscribeToCryptoUpdates(callback: (cryptos: Crypto[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  subscribeToCorrelationUpdates(callback: (correlations: CorrelationData[]) => void): () => void {
    this.correlationSubscribers.push(callback);
    return () => {
      const index = this.correlationSubscribers.indexOf(callback);
      if (index > -1) {
        this.correlationSubscribers.splice(index, 1);
      }
    };
  }

  subscribeToSignalUpdates(callback: (signals: TradingSignal[]) => void): () => void {
    this.signalSubscribers.push(callback);
    return () => {
      const index = this.signalSubscribers.indexOf(callback);
      if (index > -1) {
        this.signalSubscribers.splice(index, 1);
      }
    };
  }

  private notifyCryptoSubscribers(): void {
    this.subscribers.forEach(callback => callback(this.cryptocurrencies));
  }

  private notifyCorrelationSubscribers(): void {
    this.correlationSubscribers.forEach(callback => callback(this.correlations));
  }

  private notifySignalSubscribers(): void {
    this.signalSubscribers.forEach(callback => callback(this.tradingSignals));
  }

  searchCryptos(query: string): Crypto[] {
    const lowercaseQuery = query.toLowerCase();
    return this.cryptocurrencies.filter(crypto => 
      crypto.symbol.toLowerCase().includes(lowercaseQuery) ||
      crypto.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  getTopMovers(limit: number = 5): { gainers: Crypto[], losers: Crypto[] } {
    const sortedCryptos = [...this.cryptocurrencies].sort((a, b) => b.changePercent - a.changePercent);
    return {
      gainers: sortedCryptos.slice(0, limit),
      losers: sortedCryptos.slice(-limit).reverse()
    };
  }

  // Cleanup method
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const cryptoDataService = new CryptoDataService();
