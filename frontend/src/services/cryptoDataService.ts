export interface Crypto {
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
  dataSource: 'alpha_vantage' | 'mock'
}

export interface CorrelationData {
  symbol1: string
  symbol2: string
  correlation: number
  pValue: number
  timestamp: Date
}

export interface TradingSignal {
  symbol: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  strength: number // 0-100
  correlation: number
  btcPrice: number
  timestamp: Date
  reason: string
}

import { alphaVantageService, AlphaVantageCrypto } from './alphaVantageService'

class CryptoDataService {
  private cryptocurrencies: Crypto[] = []
  private subscribers: ((cryptos: Crypto[]) => void)[] = []
  private correlationSubscribers: ((correlations: CorrelationData[]) => void)[] = []
  private signalSubscribers: ((signals: TradingSignal[]) => void)[] = []
  private correlations: CorrelationData[] = []
  private tradingSignals: TradingSignal[] = []
  private priceHistory: Map<string, number[]> = new Map()
  private updateInterval: number | null = null
  private useRealData: boolean = false // Start with mock data to ensure data loads

  constructor() {
    this.initializeCryptocurrencies()
    this.startRealTimeUpdates()
  }

  private async initializeCryptocurrencies(): Promise<void> {
    console.log('Initializing cryptocurrency data...')
    
    // Always start with mock data to ensure immediate loading
    this.initializeMockData()
    
    // Try to fetch real data in background
    if (this.useRealData) {
      try {
        const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX']
        console.log('Fetching real data from Alpha Vantage...')
        const alphaCryptos = await alphaVantageService.getMarketOverview(symbols)
        
        if (alphaCryptos && alphaCryptos.length > 0) {
          this.cryptocurrencies = alphaCryptos.map(alpha => ({
            ...alpha,
            dataSource: 'alpha_vantage' as const
          }))
          console.log('Successfully loaded real data from Alpha Vantage')
          this.notifyCryptoSubscribers()
        } else {
          console.log('Alpha Vantage returned empty data, keeping mock data')
        }
      } catch (error) {
        console.error('Failed to fetch real data, using mock data:', error)
      }
    }
    
    console.log('Cryptocurrency data initialized with', this.cryptocurrencies.length, 'items')
  }

  private initializeMockData(): void {
    this.cryptocurrencies = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 43250.00,
        change: 1250.00,
        changePercent: 2.98,
        volume: '28.5B',
        dayHigh: 44500.00,
        dayLow: 41800.00,
        week52High: 69000.00,
        week52Low: 24900.00,
        marketCap: '845.2B',
        circulatingSupply: '19.5M',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2280.50,
        change: 85.30,
        changePercent: 3.89,
        volume: '15.2B',
        dayHigh: 2350.00,
        dayLow: 2190.00,
        week52High: 4080.00,
        week52Low: 1550.00,
        marketCap: '273.8B',
        circulatingSupply: '120.1M',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
    {
        symbol: 'BNB',
        name: 'Binance Coin',
        price: 315.80,
        change: -2.40,
        changePercent: -0.75,
        volume: '1.8B',
        dayHigh: 320.50,
        dayLow: 312.00,
        week52High: 720.00,
        week52Low: 205.00,
        marketCap: '48.5B',
        circulatingSupply: '153.6M',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: 98.45,
        change: 5.20,
        changePercent: 5.58,
        volume: '3.2B',
        dayHigh: 102.30,
        dayLow: 92.80,
        week52High: 260.00,
        week52Low: 19.50,
        marketCap: '42.1B',
        circulatingSupply: '427.4M',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        price: 0.585,
        change: 0.025,
        changePercent: 4.47,
        volume: '580M',
        dayHigh: 0.595,
        dayLow: 0.558,
        week52High: 3.10,
        week52Low: 0.245,
        marketCap: '20.5B',
        circulatingSupply: '35.0B',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
      {
        symbol: 'XRP',
        name: 'Ripple',
        price: 0.625,
        change: -0.015,
        changePercent: -2.35,
        volume: '1.2B',
        dayHigh: 0.645,
        dayLow: 0.618,
        week52High: 1.42,
        week52Low: 0.285,
        marketCap: '33.8B',
        circulatingSupply: '54.1B',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
      {
        symbol: 'DOT',
        name: 'Polkadot',
        price: 7.85,
        change: 0.35,
        changePercent: 4.67,
        volume: '420M',
        dayHigh: 8.10,
        dayLow: 7.45,
        week52High: 29.80,
        week52Low: 4.85,
        marketCap: '10.2B',
        circulatingSupply: '1.3B',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      },
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        price: 38.50,
        change: 1.80,
        changePercent: 4.90,
        volume: '680M',
        dayHigh: 39.80,
        dayLow: 36.20,
        week52High: 146.80,
        week52Low: 9.25,
        marketCap: '14.1B',
        circulatingSupply: '366.8M',
        lastUpdated: new Date(),
        dataSource: 'mock' as const
      }
    ];
  }

  private initializePriceHistory(): void {
    this.cryptocurrencies.forEach(crypto => {
      const history = [];
      let basePrice = crypto.price;
      
      // Generate 100 data points for initial history
      for (let i = 0; i < 100; i++) {
        const variation = (Math.random() - 0.5) * basePrice * 0.02;
        basePrice = Math.max(0.01, basePrice + variation);
        history.push(basePrice);
      }
      
      this.priceHistory.set(crypto.symbol, history);
    });
  }

  getCryptocurrencies(): Crypto[] {
    return this.cryptocurrencies;
  }

  getCryptoBySymbol(symbol: string): Crypto | undefined {
    return this.cryptocurrencies.find(crypto => crypto.symbol === symbol);
  }

  getPriceHistory(symbol: string): number[] {
    return this.priceHistory.get(symbol) || [];
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

  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateCryptoPrices();
      this.updateCorrelations();
      this.generateTradingSignals();
    }, 1000); // Update every second for crypto markets
  }

  private updateCryptoPrices(): void {
    this.cryptocurrencies = this.cryptocurrencies.map(crypto => {
      const volatility = this.getVolatilityForSymbol(crypto.symbol);
      const priceChange = (Math.random() - 0.5) * crypto.price * volatility;
      const newPrice = Math.max(0.01, crypto.price + priceChange);
      const change = newPrice - crypto.price;
      const changePercent = (change / crypto.price) * 100;

      // Update price history
      const history = this.priceHistory.get(crypto.symbol) || [];
      history.push(newPrice);
      if (history.length > 200) {
        history.shift(); // Keep only last 200 data points
      }
      this.priceHistory.set(crypto.symbol, history);

      return {
        ...crypto,
        price: parseFloat(newPrice.toFixed(crypto.symbol === 'BTC' ? 2 : crypto.symbol === 'ETH' ? 2 : 4)),
        change: parseFloat(change.toFixed(crypto.symbol === 'BTC' ? 2 : crypto.symbol === 'ETH' ? 2 : 4)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        dayHigh: Math.max(crypto.dayHigh, newPrice),
        dayLow: Math.min(crypto.dayLow, newPrice),
        lastUpdated: new Date()
      };
    });

    this.notifyCryptoSubscribers();
  }

  private getVolatilityForSymbol(symbol: string): number {
    // Different cryptos have different volatility profiles
    const volatilities: { [key: string]: number } = {
      'BTC': 0.008,  // 0.8% per update
      'ETH': 0.012,  // 1.2% per update
      'BNB': 0.015,  // 1.5% per update
      'SOL': 0.025,  // 2.5% per update
      'ADA': 0.020,  // 2.0% per update
      'XRP': 0.018,  // 1.8% per update
      'DOT': 0.022,  // 2.2% per update
      'AVAX': 0.023  // 2.3% per update
    };
    return volatilities[symbol] || 0.015;
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

    this.notifyCorrelationSubscribers();
  }

  private calculateCorrelation(symbol1: string, symbol2: string): { coefficient: number; pValue: number } {
    const history1 = this.priceHistory.get(symbol1) || [];
    const history2 = this.priceHistory.get(symbol2) || [];
    
    if (history1.length < 30 || history2.length < 30) {
      return { coefficient: 0, pValue: 1 };
    }

    const n = Math.min(history1.length, history2.length);
    const data1 = history1.slice(-n);
    const data2 = history2.slice(-n);

    // Calculate Pearson correlation coefficient
    const mean1 = data1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = data2.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    const correlation = denominator === 0 ? 0 : numerator / denominator;

    // Simplified p-value calculation (for demonstration)
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

    this.notifySignalSubscribers();
  }

  private generateSignal(crypto: Crypto, btc: Crypto, correlation: CorrelationData): TradingSignal | null {
    const correlationStrength = Math.abs(correlation.correlation);
    
    // Generate signal based on correlation and price movements
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;
    let reason = '';

    if (correlationStrength > 0.7) {
      // Strong correlation
      if (correlation.correlation > 0) {
        // Positive correlation
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
        // Negative correlation
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
    } else if (correlationStrength > 0.5) {
      // Moderate correlation
      if (crypto.changePercent > 3) {
        signal = 'BUY';
        strength = 60;
        reason = `${crypto.symbol} strong momentum detected`;
      } else if (crypto.changePercent < -3) {
        signal = 'SELL';
        strength = 60;
        reason = `${crypto.symbol} strong downward momentum detected`;
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

  private notifyCryptoSubscribers(): void {
    this.subscribers.forEach(callback => callback(this.cryptocurrencies));
  }

  private notifyCorrelationSubscribers(): void {
    this.correlationSubscribers.forEach(callback => callback(this.correlations));
  }

  private notifySignalSubscribers(): void {
    this.signalSubscribers.forEach(callback => callback(this.tradingSignals));
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
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
}

export const cryptoDataService = new CryptoDataService()
