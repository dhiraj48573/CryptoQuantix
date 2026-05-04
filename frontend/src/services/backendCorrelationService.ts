/**
 * Backend Correlation Service
 * Integrates with backend correlation API endpoints
 */

export interface BackendCorrelationValue {
  coefficient: number
  pValue: number
  significance: 'high' | 'medium' | 'low' | 'none'
  sampleSize: number
  timestamp: string
}

export interface RollingCorrelation {
  coefficient: number
  trend: 'strengthening' | 'weakening' | 'stable' | 'strengthening_slight' | 'weakening_slight' | 'insufficient_data' | 'insufficient_history'
  change?: number
  significance: string
}

export interface CorrelationPair {
  symbol1: string
  symbol2: string
  correlation: BackendCorrelationValue
  rolling: { [window: number]: RollingCorrelation }
}

export interface CorrelationStats {
  totalPairs: number
  highCorrelations: number
  mediumCorrelations: number
  lowCorrelations: number
  avgCorrelation: number
  strongestPositive: { symbols: string[]; coefficient: number }
  strongestNegative: { symbols: string[]; coefficient: number }
}

export interface TradingSignal {
  symbol: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  strength: number
  correlation: number
  btcPrice: number
  reason: string
  confidence: number
  timestamp?: string
}

export interface SignalPerformance {
  totalSignals: number
  buySignals: number
  sellSignals: number
  holdSignals: number
  avgConfidence: number
  highConfidenceCount: number
}

class BackendCorrelationService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
  }

  private async fetchWithErrorHandling(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // Correlation endpoints
  async getCorrelationMatrix(): Promise<{ [symbol: string]: { [symbol: string]: BackendCorrelationValue } }> {
    return this.fetchWithErrorHandling('/api/correlation/matrix');
  }

  async getHeatmapData(): Promise<CorrelationPair[]> {
    return this.fetchWithErrorHandling('/api/correlation/heatmap');
  }

  async getBTCCorrelations(): Promise<{ [symbol: string]: BackendCorrelationValue & { rolling: { [window: number]: RollingCorrelation } } }> {
    return this.fetchWithErrorHandling('/api/correlation/btc');
  }

  async getCorrelation(symbol1: string, symbol2: string): Promise<{
    symbol1: string
    symbol2: string
    correlation: BackendCorrelationValue
    rolling: { [window: number]: RollingCorrelation }
  }> {
    return this.fetchWithErrorHandling(`/api/correlation/${symbol1}/${symbol2}`);
  }

  async getStrongCorrelations(threshold: number = 0.7): Promise<CorrelationPair[]> {
    return this.fetchWithErrorHandling(`/api/correlation/strong/${threshold}`);
  }

  async getCorrelationStats(): Promise<CorrelationStats> {
    return this.fetchWithErrorHandling('/api/correlation/stats');
  }

  // Trading signal endpoints
  async getAllSignals(): Promise<{ [symbol: string]: TradingSignal }> {
    return this.fetchWithErrorHandling('/api/signals');
  }

  async getSignal(symbol: string): Promise<TradingSignal> {
    return this.fetchWithErrorHandling(`/api/signals/${symbol}`);
  }

  async getHighConfidenceSignals(threshold: number = 0.7): Promise<{ [symbol: string]: TradingSignal }> {
    return this.fetchWithErrorHandling(`/api/signals/high-confidence/${threshold}`);
  }

  async getSignalPerformance(): Promise<SignalPerformance> {
    return this.fetchWithErrorHandling('/api/signals/performance');
  }

  async getSignalHistory(limit: number = 50): Promise<{
    timestamp: string
    signals: { [symbol: string]: TradingSignal }
  }[]> {
    return this.fetchWithErrorHandling(`/api/signals/history/${limit}`);
  }

  // WebSocket connection for real-time updates
  createWebSocketConnection(): WebSocket | null {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}`);
      
      // Set a timeout to handle connection failures
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          console.log('WebSocket connection timeout - falling back to HTTP polling');
        }
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('WebSocket connected successfully');
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.log('WebSocket connection failed - using HTTP polling');
      };
      
      return ws;
    } catch (error) {
      console.log('Failed to create WebSocket connection - using HTTP polling');
      return null;
    }
  }

  // Utility methods
  getCorrelationColor(coefficient: number): string {
    const abs = Math.abs(coefficient);
    if (abs >= 0.8) return coefficient > 0 ? 'bg-green-600' : 'bg-red-600';
    if (abs >= 0.6) return coefficient > 0 ? 'bg-green-500' : 'bg-red-500';
    if (abs >= 0.4) return coefficient > 0 ? 'bg-green-400' : 'bg-red-400';
    if (abs >= 0.2) return coefficient > 0 ? 'bg-green-300' : 'bg-red-300';
    return 'bg-gray-300';
  }

  getCorrelationTextColor(coefficient: number): string {
    const abs = Math.abs(coefficient);
    if (abs >= 0.8) return coefficient > 0 ? 'text-green-700' : 'text-red-700';
    if (abs >= 0.6) return coefficient > 0 ? 'text-green-600' : 'text-red-600';
    if (abs >= 0.4) return coefficient > 0 ? 'text-green-500' : 'text-red-500';
    if (abs >= 0.2) return coefficient > 0 ? 'text-green-400' : 'text-red-400';
    return 'text-gray-500';
  }

  getSignalColor(signal: string): string {
    switch (signal) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      case 'HOLD': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }

  getSignalTextColor(signal: string): string {
    switch (signal) {
      case 'BUY': return 'text-green-700';
      case 'SELL': return 'text-red-700';
      case 'HOLD': return 'text-gray-700';
      default: return 'text-gray-700';
    }
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  getSignificanceBadge(significance: string): string {
    const colors = {
      high: 'bg-purple-100 text-purple-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-yellow-100 text-yellow-800',
      none: 'bg-gray-100 text-gray-800'
    };
    return colors[significance as keyof typeof colors] || colors.none;
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'strengthening': return 'trending-up';
      case 'weakening': return 'trending-down';
      case 'stable': return 'minus';
      default: return 'activity';
    }
  }

  formatCorrelation(coefficient: number | undefined | null): string {
    if (coefficient === undefined || coefficient === null || isNaN(coefficient)) {
      return '0.000';
    }
    return coefficient.toFixed(3);
  }

  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }
}

export const backendCorrelationService = new BackendCorrelationService();
