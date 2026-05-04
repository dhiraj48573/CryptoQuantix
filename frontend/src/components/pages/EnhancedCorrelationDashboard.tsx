import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Activity, BarChart3, AlertTriangle, Signal, Zap, Target, Brain } from 'lucide-react'
import { backendCorrelationService, type CorrelationPair, type TradingSignal, type CorrelationStats, type SignalPerformance } from '../../services/backendCorrelationService'
import { authService } from '../../services/authService'

interface WebSocketData {
  type: 'PRICE_UPDATE' | 'SIGNAL_UPDATE' | 'CORRELATION_UPDATE'
  data: any
}

const EnhancedCorrelationDashboard: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<CorrelationPair[]>([])
  const [btcCorrelations, setBtcCorrelations] = useState<any>({})
  const [strongCorrelations, setStrongCorrelations] = useState<CorrelationPair[]>([])
  const [tradingSignals, setTradingSignals] = useState<{ [symbol: string]: TradingSignal }>({})
  const [highConfidenceSignals, setHighConfidenceSignals] = useState<{ [symbol: string]: TradingSignal }>({})
  const [correlationStats, setCorrelationStats] = useState<CorrelationStats | null>(null)
  const [signalPerformance, setSignalPerformance] = useState<SignalPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [ws, setWs] = useState<WebSocket | null>(null)

  const cryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX']

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        heatmap,
        btcCorr,
        strongCorr,
        signals,
        highConfSignals,
        stats,
        performance
      ] = await Promise.all([
        backendCorrelationService.getHeatmapData(),
        backendCorrelationService.getBTCCorrelations(),
        backendCorrelationService.getStrongCorrelations(0.7),
        backendCorrelationService.getAllSignals(),
        backendCorrelationService.getHighConfidenceSignals(0.7),
        backendCorrelationService.getCorrelationStats(),
        backendCorrelationService.getSignalPerformance()
      ])

      setHeatmapData(heatmap)
      setBtcCorrelations(btcCorr)
      setStrongCorrelations(strongCorr)
      setTradingSignals(signals)
      setHighConfidenceSignals(highConfSignals)
      setCorrelationStats(stats)
      setSignalPerformance(performance)
    } catch (err) {
      setError('Failed to fetch correlation data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Setup WebSocket connection (completely disabled)
  const setupWebSocket = useCallback(() => {
    console.log('WebSocket functionality disabled - using HTTP polling only')
    // All WebSocket functionality disabled to prevent frontend crash
  }, [])

  useEffect(() => {
    fetchData()
    setupWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [fetchData, setupWebSocket])

  const getCorrelationFromMatrix = (symbol1: string, symbol2: string): CorrelationPair | null => {
    return heatmapData.find(pair => 
      (pair.symbol1 === symbol1 && pair.symbol2 === symbol2) ||
      (pair.symbol1 === symbol2 && pair.symbol2 === symbol1)
    ) || null
  }

  const renderSignalBadge = (signal: TradingSignal) => {
    const signalColor = backendCorrelationService.getSignalColor(signal.signal)
    const textColor = backendCorrelationService.getSignalTextColor(signal.signal)
    const confidenceColor = backendCorrelationService.getConfidenceColor(signal.confidence)

    return (
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${signalColor} ${textColor}`}>
          {signal.signal}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceColor}`}>
          {backendCorrelationService.formatConfidence(signal.confidence)}
        </span>
      </div>
    )
  }

  const renderTrendIndicator = (rolling: any) => {
    if (!rolling || !rolling[7]) return null

    const trend7 = rolling[7]
    const trendColors = {
      strengthening: 'text-green-600',
      weakening: 'text-red-600',
      stable: 'text-gray-600',
      strengthening_slight: 'text-green-500',
      weakening_slight: 'text-red-500'
    }

    return (
      <div className="flex items-center space-x-1">
        <Activity className={`w-3 h-3 ${trendColors[trend7.trend as keyof typeof trendColors] || 'text-gray-500'}`} />
        <span className="text-xs text-gray-600">{trend7.trend}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Correlation Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome, {authService.getCurrentUser()?.name || 'Guest'}! Real-time correlation analysis and AI-powered trading signals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Strong Correlations</p>
              <p className="text-2xl font-bold text-gray-900">{correlationStats?.totalPairs || 0}</p>
              <p className="text-xs text-gray-500">|r| &gt; 0.7</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Active Signals</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(highConfidenceSignals).length}
              </p>
              <p className="text-xs text-gray-500">High confidence</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Signal className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {signalPerformance ? backendCorrelationService.formatConfidence(signalPerformance.avgConfidence) : '0%'}
              </p>
              <p className="text-xs text-gray-500">All signals</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Signal Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {signalPerformance ? 
                  `${((signalPerformance.highConfidenceCount / Math.max(signalPerformance.totalSignals, 1)) * 100).toFixed(1)}%` 
                  : '0%'
                }
              </p>
              <p className="text-xs text-gray-500">High confidence ratio</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* High Confidence Trading Signals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Trading Signals</h2>
          <Zap className="w-5 h-5 text-yellow-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(highConfidenceSignals).map(([symbol, signal]) => (
            <div key={symbol} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{symbol}</span>
                  <span className="text-sm text-gray-500">${signal.btcPrice ? signal.btcPrice.toFixed(2) : '0.00'}</span>
                </div>
                {renderSignalBadge(signal)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">BTC Correlation:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${backendCorrelationService.getCorrelationTextColor(signal.correlation)}`}>
                      {backendCorrelationService.formatCorrelation(signal.correlation)}
                    </span>
                    {/* Rolling data not available in current signal structure */}
                  </div>
                </div>
                
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">Reason:</div>
                  <span>{signal.reason || 'No reason provided'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {Object.keys(highConfidenceSignals).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Signal className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No high confidence signals available</p>
          </div>
        )}
      </div>

      {/* Enhanced Correlation Heatmap */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Correlation Heatmap with Signals</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-700"></th>
                {cryptos.map(crypto => (
                  <th key={crypto} className="text-center py-2 px-3 text-xs font-medium text-gray-700">
                    {crypto}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cryptos.map(crypto1 => (
                <tr key={crypto1} className="border-b border-gray-100">
                  <td className="text-left py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-700">{crypto1}</span>
                      {tradingSignals[crypto1] && (
                        <div className={`w-2 h-2 rounded-full ${backendCorrelationService.getSignalColor(tradingSignals[crypto1].signal)}`}></div>
                      )}
                    </div>
                  </td>
                  {cryptos.map(crypto2 => {
                    if (crypto1 === crypto2) {
                      return (
                        <td key={crypto2} className="text-center py-2 px-3">
                          <div className="w-full h-8 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">1.00</span>
                          </div>
                        </td>
                      )
                    }
                    
                    const correlation = getCorrelationFromMatrix(crypto1, crypto2)
                    const coefficient = correlation?.correlation
                    const color = coefficient !== undefined ? backendCorrelationService.getCorrelationColor(coefficient) : 'bg-gray-200'
                    const textColor = coefficient !== undefined ? backendCorrelationService.getCorrelationTextColor(coefficient) : 'text-gray-500'
                    const value = coefficient !== undefined ? backendCorrelationService.formatCorrelation(coefficient) : '0.000'
                    
                    return (
                      <td key={crypto2} className="text-center py-2 px-3">
                        <div className={`w-full h-8 ${color} rounded flex items-center justify-center relative group`}>
                          <span className={`text-xs font-bold ${textColor}`}>{value}</span>
                          {/* Significance data not available in current correlation structure */}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-gray-600">Strong Positive (0.8+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-gray-600">Moderate Positive (0.4-0.8)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-gray-600">Strong Negative (-0.8+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Statistical Significance</span>
          </div>
        </div>
      </div>

      {/* Strong Correlations Details */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Strong Correlations Analysis</h2>
        <div className="space-y-3">
          {strongCorrelations.slice(0, 5).map((pair, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{pair.symbol1}</span>
                  <span className="text-gray-400">-</span>
                  <span className="font-medium text-gray-900">{pair.symbol2}</span>
                </div>
                <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {/* Significance data not available in current correlation structure */}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`font-bold ${pair.correlation !== undefined ? backendCorrelationService.getCorrelationTextColor(pair.correlation) : 'text-gray-500'}`}>
                    {backendCorrelationService.formatCorrelation(pair.correlation)}
                  </div>
                  {renderTrendIndicator(pair.rolling)}
                </div>
                
                <div className="flex items-center space-x-2">
                  {tradingSignals[pair.symbol1] && (
                    <div className={`w-6 h-6 ${backendCorrelationService.getSignalColor(tradingSignals[pair.symbol1].signal)} rounded flex items-center justify-center`}>
                      <span className="text-xs text-white font-bold">{tradingSignals[pair.symbol1].signal[0]}</span>
                    </div>
                  )}
                  {tradingSignals[pair.symbol2] && (
                    <div className={`w-6 h-6 ${backendCorrelationService.getSignalColor(tradingSignals[pair.symbol2].signal)} rounded flex items-center justify-center`}>
                      <span className="text-xs text-white font-bold">{tradingSignals[pair.symbol2].signal[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {strongCorrelations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No strong correlations detected</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedCorrelationDashboard
