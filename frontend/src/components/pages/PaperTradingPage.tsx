import React, { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity, 
  Brain, 
  Target, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Trophy,
  Clock,
  Star,
  Eye,
  EyeOff,
  Search,
  Building
} from 'lucide-react'
import { cryptoDataService } from '../../services/cryptoDataService'
import { portfolioService } from '../../services/portfolioService'
import { marketDataService } from '../../services/marketDataService'
import { backendCorrelationService } from '../../services/backendCorrelationService'
import { authService } from '../../services/authService'
import type { Crypto } from '../../services/cryptoDataService'
import type { Stock } from '../../services/marketDataService'
import type { TradingSignal } from '../../services/backendCorrelationService'

interface Asset {
  type: 'crypto' | 'stock'
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: string
  dayHigh?: number
  dayLow?: number
  week52High?: number
  week52Low?: number
  marketCap?: string
  pe?: number
}

interface AlgorithmConfig {
  name: string
  description: string
  enabled: boolean
  riskLevel: 'low' | 'medium' | 'high'
  maxPositionSize: number
  stopLossPercentage: number
  takeProfitPercentage: number
  correlationThreshold: number
}

interface SimulationStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalReturn: number
  totalReturnPercent: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
}

const PaperTradingPage: React.FC = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>(cryptoDataService.getCryptocurrencies())
  const [stocks, setStocks] = useState<Stock[]>(marketDataService.getStocks())
  const [portfolio, setPortfolio] = useState(portfolioService.getPortfolio())
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetType, setAssetType] = useState<'crypto' | 'stock'>('crypto')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [quantity, setQuantity] = useState<string>('1')
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [limitPrice, setLimitPrice] = useState<string>('')
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1)
  const [showAlgoPanel, setShowAlgoPanel] = useState(false)
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  const [showLiveTrading, setShowLiveTrading] = useState(true)
  const [tradingSignals, setTradingSignals] = useState<{ [symbol: string]: TradingSignal }>({})
  const [simulationStats, setSimulationStats] = useState<SimulationStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0
  })
  const [lastOrderStatus, setLastOrderStatus] = useState<string>('')
  const [showOrderStatus, setShowOrderStatus] = useState<boolean>(false)
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false)
  const [showTransferPanel, setShowTransferPanel] = useState<boolean>(false)
  const [portfolioConfigs, setPortfolioConfigs] = useState<any[]>([])
  const [activeConfig, setActiveConfig] = useState<any>(null)
  const [transferFrom, setTransferFrom] = useState<string>('')
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferSymbol, setTransferSymbol] = useState<string>('')
  const [transferQuantity, setTransferQuantity] = useState<string>('')

  const [algorithmConfigs, setAlgorithmConfigs] = useState<AlgorithmConfig[]>([
    {
      name: 'Correlation-Based Mean Reversion',
      description: 'Trades based on correlation deviations from mean',
      enabled: true,
      riskLevel: 'medium',
      maxPositionSize: 10,
      stopLossPercentage: 5,
      takeProfitPercentage: 8,
      correlationThreshold: 0.7
    },
    {
      name: 'Momentum Following',
      description: 'Follows strong momentum trends with volume confirmation',
      enabled: false,
      riskLevel: 'high',
      maxPositionSize: 15,
      stopLossPercentage: 3,
      takeProfitPercentage: 15,
      correlationThreshold: 0.5
    },
    {
      name: 'Statistical Arbitrage',
      description: 'Exploits temporary mispricings between correlated assets',
      enabled: false,
      riskLevel: 'low',
      maxPositionSize: 5,
      stopLossPercentage: 2,
      takeProfitPercentage: 4,
      correlationThreshold: 0.8
    }
  ])

  useEffect(() => {
    const unsubscribeCryptos = cryptoDataService.subscribeToCryptoUpdates(setCryptos)
    const unsubscribeStocks = marketDataService.subscribeToStockUpdates(setStocks)
    const unsubscribePortfolio = portfolioService.subscribeToPortfolioUpdates(setPortfolio)
    
    // Load trading signals
    const loadSignals = async () => {
      try {
        const signals = await backendCorrelationService.getAllSignals()
        setTradingSignals(signals)
      } catch (error) {
        console.error('Failed to load trading signals:', error)
      }
    }
    
    loadSignals()

    return () => {
      unsubscribeCryptos()
      unsubscribeStocks()
      unsubscribePortfolio()
    }
  }, [])

  useEffect(() => {
    // Update filtered assets based on search query and asset type
    const cryptoAssets: Asset[] = cryptos.map(crypto => ({
      type: 'crypto' as const,
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price,
      change: crypto.change,
      changePercent: crypto.changePercent,
      volume: crypto.volume
    }))

    const stockAssets: Asset[] = stocks.map(stock => ({
      type: 'stock' as const,
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      dayHigh: stock.dayHigh,
      dayLow: stock.dayLow,
      week52High: stock.week52High,
      week52Low: stock.week52Low,
      marketCap: stock.marketCap,
      pe: stock.pe
    }))

    const allAssets = assetType === 'crypto' ? cryptoAssets : stockAssets
    
    const filtered = searchQuery
      ? allAssets.filter(asset => 
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allAssets

    setFilteredAssets(filtered)
  }, [cryptos, stocks, assetType, searchQuery])

  useEffect(() => {
    // Load portfolio configurations
    setPortfolioConfigs(portfolioService.getPortfolioConfigs())
    setActiveConfig(portfolioService.getActiveConfig())
  }, [])

  useEffect(() => {
    // Update simulation stats based on portfolio performance
    if (portfolio.trades.length > 0) {
      const winningTrades = portfolio.trades.filter(trade => trade.type === 'SELL' && trade.totalValue > 0).length
      const losingTrades = portfolio.trades.filter(trade => trade.type === 'SELL' && trade.totalValue <= 0).length
      const totalReturn = portfolio.totalValue - 100000
      const totalReturnPercent = (totalReturn / 100000) * 100
      
      setSimulationStats(prev => ({
        ...prev,
        totalTrades: portfolio.totalTrades,
        winningTrades,
        losingTrades,
        totalReturn,
        totalReturnPercent,
        winRate: portfolio.winRate
      }))
    }
  }, [portfolio])

  const handleOrderSubmit = () => {
    if (!selectedAsset || !quantity) {
      alert('Please select an asset and enter quantity')
      return
    }
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('Please enter a valid quantity')
      return
    }
    
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      alert('Please enter a valid limit price')
      return
    }
    
    let executionPrice = selectedAsset.price
    let orderPrice: number | undefined
    
    if (orderType === 'limit') {
      orderPrice = parseFloat(limitPrice)
      executionPrice = orderPrice
    }
    
    // Calculate total cost/proceeds for user confirmation
    const totalValue = quantityNum * executionPrice
    const action = orderSide.toUpperCase()
    
    // Show order confirmation
    const confirmMessage = `Confirm ${action} ${quantityNum} ${selectedAsset.symbol} at $${(executionPrice || 0).toFixed(2)}${orderType === 'limit' ? ' (Limit Order)' : ' (Market Order)'}\nTotal: $${(totalValue || 0).toFixed(2)}`
    
    if (!window.confirm(confirmMessage)) {
      return
    }
    
    try {
      const order = portfolioService.placeOrder({
        symbol: selectedAsset.symbol,
        type: orderSide.toUpperCase() as 'BUY' | 'SELL',
        orderType: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
        quantity: quantityNum,
        price: orderPrice
      })
      
      // Show order result with better feedback
      if (order.status === 'FILLED') {
        const message = `✅ Order ${action} ${quantityNum} ${selectedAsset.symbol} at $${(order.filledPrice || 0).toFixed(2)} executed successfully!`
        setLastOrderStatus(message)
        setShowOrderStatus(true)
        
        // Update recent trades
        const newTrade = {
          id: order.id,
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          type: action,
          quantity: quantityNum,
          price: order.filledPrice,
          totalValue: order.filledPrice! * quantityNum,
          timestamp: new Date(),
          status: 'FILLED'
        }
        setRecentTrades(prev => [newTrade, ...prev.slice(0, 4)])
        
        // Reset form
        setQuantity('')
        setLimitPrice('')
        setSelectedAsset(null)
        
        // Hide status after 3 seconds
        setTimeout(() => setShowOrderStatus(false), 3000)
      } else if (order.status === 'CANCELLED') {
        const message = `❌ Order cancelled: ${order.type === 'BUY' ? 'Insufficient funds' : 'Insufficient shares'}`
        setLastOrderStatus(message)
        setShowOrderStatus(true)
        setTimeout(() => setShowOrderStatus(false), 3000)
      } else if (order.status === 'PENDING') {
        const message = `⏳ Limit order placed: ${action} ${quantityNum} ${selectedAsset.symbol} at $${(order.price || 0).toFixed(2)}`
        setLastOrderStatus(message)
        setShowOrderStatus(true)
        setTimeout(() => setShowOrderStatus(false), 3000)
      }
      
      console.log('Order placed:', order)
    } catch (error) {
      console.error('Order execution failed:', error)
      const message = `❌ Order execution failed. Please try again.`
      setLastOrderStatus(message)
      setShowOrderStatus(true)
      setTimeout(() => setShowOrderStatus(false), 3000)
    }
  }

  const toggleAlgorithm = (index: number) => {
    setAlgorithmConfigs(prev => 
      prev.map((config, i) => 
        i === index ? { ...config, enabled: !config.enabled } : config
      )
    )
  }

  const updateAlgorithmConfig = (index: number, field: keyof AlgorithmConfig, value: any) => {
    setAlgorithmConfigs(prev => 
      prev.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      )
    )
  }

  const startSimulation = () => {
    setIsSimulationRunning(true)
    // Here you would start the actual simulation logic
    console.log('Starting paper trading simulation')
  }

  const stopSimulation = () => {
    setIsSimulationRunning(false)
    console.log('Stopping paper trading simulation')
  }

  const resetSimulation = () => {
    setIsSimulationRunning(false)
    setSimulationStats({
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0
    })
    console.log('Resetting paper trading simulation')
  }

  const handleSwitchConfig = (configId: string) => {
    if (portfolioService.switchPortfolio(configId)) {
      setPortfolioConfigs(portfolioService.getPortfolioConfigs())
      setActiveConfig(portfolioService.getActiveConfig())
      setPortfolio(portfolioService.getPortfolio())
      setShowConfigPanel(false)
      setLastOrderStatus(`✅ Switched to ${portfolioService.getActiveConfig()?.name}`)
      setShowOrderStatus(true)
      setTimeout(() => setShowOrderStatus(false), 3000)
    }
  }

  const handleTransferAsset = () => {
    if (!transferFrom || !transferTo || !transferSymbol || !transferQuantity) {
      alert('Please fill in all transfer fields')
      return
    }

    const quantity = parseInt(transferQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    if (transferFrom === transferTo) {
      alert('Source and target configurations must be different')
      return
    }

    if (portfolioService.transferAsset(transferFrom, transferTo, transferSymbol, quantity)) {
      setPortfolioConfigs(portfolioService.getPortfolioConfigs())
      setActiveConfig(portfolioService.getActiveConfig())
      setPortfolio(portfolioService.getPortfolio())
      setShowTransferPanel(false)
      setLastOrderStatus(`✅ Transferred ${quantity} ${transferSymbol} from ${transferFrom} to ${transferTo}`)
      setShowOrderStatus(true)
      setTimeout(() => setShowOrderStatus(false), 3000)
      
      // Reset transfer form
      setTransferFrom('')
      setTransferTo('')
      setTransferSymbol('')
      setTransferQuantity('')
    } else {
      alert('Transfer failed. Please check the source configuration has sufficient quantity.')
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderSignalIndicator = (symbol: string) => {
    const signal = tradingSignals[symbol]
    if (!signal) return null
    
    const signalColor = backendCorrelationService.getSignalColor(signal.signal)
    const confidenceColor = backendCorrelationService.getConfidenceColor(signal.confidence)
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${signalColor} text-white`}>
          {signal.signal}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceColor}`}>
          {backendCorrelationService.formatConfidence(signal.confidence)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Paper Trading Simulator</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">
            Welcome, {authService.getCurrentUser()?.name || 'Guest'}! Practice trading strategies with virtual money and test your algorithms
          </p>
        </div>
        
        {/* Order Status Display */}
        {showOrderStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-800">{lastOrderStatus}</p>
          </div>
        )}
        
        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
          {/* Simulation Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={startSimulation}
              disabled={isSimulationRunning}
              className={`p-2 rounded transition-colors ${
                isSimulationRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={stopSimulation}
              disabled={!isSimulationRunning}
              className={`p-2 rounded transition-colors ${
                !isSimulationRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={resetSimulation}
              className="p-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm sm:text-base font-medium text-gray-700">
              {isSimulationRunning ? 'Live Simulation' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Virtual Money Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-gray-600">Virtual Capital</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">${portfolio.totalValue.toLocaleString()}</p>
              <p className={`text-sm sm:text-base font-medium ${portfolio.totalValue >= 100000 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio.totalValue >= 100000 ? '+' : ''}{((portfolio.totalValue - 100000) / 100000 * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Available Cash</p>
              <p className="text-2xl font-bold text-gray-900">${portfolio.cash.toLocaleString()}</p>
              <p className="text-sm text-gray-500">For trading</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900">{simulationStats.totalTrades}</p>
              <p className="text-sm text-gray-500">Win Rate: {(simulationStats.winRate || 0).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
              <p className="text-2xl font-bold text-gray-900">${simulationStats.totalReturn.toLocaleString()}</p>
              <p className={`text-sm font-medium ${simulationStats.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {simulationStats.totalReturn >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Trades</h2>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            {recentTrades.map((trade, index) => (
              <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    trade.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-xs font-bold ${
                      trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.type[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{trade.symbol}</p>
                    <p className="text-xs text-gray-500">{trade.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {trade.quantity} @ ${(trade.price || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${(trade.totalValue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Panels */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowAlgoPanel(!showAlgoPanel)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showAlgoPanel 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          Algorithm Testing
        </button>
        
        <button
          onClick={() => setShowPerformancePanel(!showPerformancePanel)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showPerformancePanel 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Target className="w-4 h-4" />
          Performance Analytics
        </button>
        
        <button
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showConfigPanel 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Portfolio Configs
        </button>
        
        <button
          onClick={() => setShowTransferPanel(!showTransferPanel)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showTransferPanel 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Transfer Assets
        </button>
        
        <button
          onClick={() => setShowLiveTrading(!showLiveTrading)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showLiveTrading 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showLiveTrading ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Live Trading
        </button>
      </div>

      {/* Algorithm Testing Panel */}
      {showAlgoPanel && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Algorithm Testing Suite</h2>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {algorithmConfigs.map((config, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleAlgorithm(index)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-900">{config.name}</h3>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(config.riskLevel)}`}>
                    {config.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                {config.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Position Size</label>
                      <input
                        type="number"
                        value={config.maxPositionSize}
                        onChange={(e) => updateAlgorithmConfig(index, 'maxPositionSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss %</label>
                      <input
                        type="number"
                        value={config.stopLossPercentage}
                        onChange={(e) => updateAlgorithmConfig(index, 'stopLossPercentage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Take Profit %</label>
                      <input
                        type="number"
                        value={config.takeProfitPercentage}
                        onChange={(e) => updateAlgorithmConfig(index, 'takeProfitPercentage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Analytics Panel */}
      {showPerformancePanel && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Performance Analytics</h2>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(simulationStats.winRate || 0).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(simulationStats.profitFactor || 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Profit Factor</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(simulationStats.sharpeRatio || 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Sharpe Ratio</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(simulationStats.maxDrawdown || 0).toFixed(2)}%</div>
              <div className="text-sm text-gray-600">Max Drawdown</div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Configuration Panel */}
      {showConfigPanel && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Portfolio Configurations</h2>
            <Trophy className="w-5 h-5 text-purple-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {portfolioConfigs.map(config => (
              <div key={config.id} className={`border rounded-lg p-4 ${
                config.isActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{config.name}</h3>
                  {config.isActive && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">Active</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>Risk Level: <span className={`font-medium ${
                    config.riskLevel === 'conservative' ? 'text-green-600' :
                    config.riskLevel === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{config.riskLevel}</span></div>
                  <div>Max Position: ${config.maxPositionSize.toLocaleString()}</div>
                  <div>Stop Loss: {config.stopLossPercentage}%</div>
                  <div>Take Profit: {config.takeProfitPercentage}%</div>
                  <div>Cash: ${config.portfolio.cash.toLocaleString()}</div>
                  <div>Value: ${config.portfolio.totalValue.toLocaleString()}</div>
                  <div>Positions: {config.portfolio.positions.length}</div>
                </div>
                {!config.isActive && (
                  <button
                    onClick={() => handleSwitchConfig(config.id)}
                    className="mt-3 w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Switch to {config.name}
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Current Active:</strong> {activeConfig?.name} - {activeConfig?.description}
            </p>
          </div>
        </div>
      )}

      {/* Asset Transfer Panel */}
      {showTransferPanel && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Transfer Assets Between Configurations</h2>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Configuration</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source configuration</option>
                  {portfolioConfigs.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Symbol</label>
                <input
                  type="text"
                  value={transferSymbol}
                  onChange={(e) => setTransferSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL, BTC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Configuration</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select target configuration</option>
                  {portfolioConfigs.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleTransferAsset}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Transfer Asset
            </button>
          </div>
        </div>
      )}

      {/* Live Trading Interface */}
      {showLiveTrading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Overview */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h2>
              
              {/* Asset Type Toggle */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setAssetType('crypto')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    assetType === 'crypto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Building className="w-4 h-4 mr-2" />
                  Cryptocurrencies
                </button>
                <button
                  onClick={() => setAssetType('stock')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    assetType === 'stock'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Stocks
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${assetType === 'crypto' ? 'cryptocurrencies' : 'stocks'} by symbol or name...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Symbol</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Name</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Price</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Change</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">AI Signal</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.slice(0, 8).map((asset) => (
                      <tr
                        key={asset.symbol}
                        className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedAsset?.symbol === asset.symbol ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{asset.symbol}</span>
                            {portfolio.positions.some(pos => pos.symbol === asset.symbol) && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{asset.name}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">${asset.price.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            asset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {asset.changePercent >= 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {renderSignalIndicator(asset.symbol)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAsset(asset)
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div>
            {selectedAsset ? (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Place Order</h2>
                
                {/* Selected Asset Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{selectedAsset.symbol}</span>
                    <span className={`text-sm font-medium ${
                      selectedAsset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedAsset.changePercent >= 0 ? '+' : ''}{(selectedAsset.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    ${selectedAsset.price.toLocaleString()}
                  </div>
                  {tradingSignals[selectedAsset.symbol] && (
                    <div className="mt-2">
                      {renderSignalIndicator(selectedAsset.symbol)}
                    </div>
                  )}
                  {/* Additional Stock Info */}
                  {selectedAsset.type === 'stock' && (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Day Range:</span>
                        <span className="font-medium">
                          ${selectedAsset.dayLow?.toFixed(2) || '0.00'} - ${selectedAsset.dayHigh?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">52W Range:</span>
                        <span className="font-medium">
                          ${selectedAsset.week52Low?.toFixed(2) || '0.00'} - ${selectedAsset.week52High?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {selectedAsset.marketCap && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Market Cap:</span>
                          <span className="font-medium">{selectedAsset.marketCap}</span>
                        </div>
                      )}
                      {selectedAsset.pe && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">P/E Ratio:</span>
                          <span className="font-medium">${(selectedAsset.pe || 0).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Form */}
                <div className="space-y-4">
                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderSide('buy')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          orderSide === 'buy'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setOrderSide('sell')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          orderSide === 'sell'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  {/* Order Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderType('market')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          orderType === 'market'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Market
                      </button>
                      <button
                        onClick={() => setOrderType('limit')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          orderType === 'limit'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Limit
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Limit Price */}
                  {orderType === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Limit Price</label>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder="Enter limit price"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Estimated Cost */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estimated Cost:</span>
                      <span className="font-medium text-gray-900">
                        ${quantity ? (parseFloat(quantity) * (selectedAsset.price || 0)).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleOrderSubmit}
                    className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                      orderSide === 'buy'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No asset selected</div>
                  <div className="text-sm text-gray-500">Select a {assetType === 'crypto' ? 'cryptocurrency' : 'stock'} from the list to place an order</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Positions */}
      {portfolio.positions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Positions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Symbol</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Quantity</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Avg Price</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Current Price</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">P&L</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((position) => {
                  const pnl = position.unrealizedPnL
                  const pnlPercent = position.unrealizedPnLPercent
                  
                  return (
                    <tr key={position.symbol} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{position.symbol}</span>
                          {pnlPercent >= 5 && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {pnlPercent <= -5 && <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{position.quantity}</td>
                      <td className="py-3 px-4 text-gray-900">${(position.avgCost || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-900">${(position.currentPrice || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {pnl >= 0 ? '+' : ''}${(pnl || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {pnlPercent >= 0 ? '+' : ''}{(pnlPercent || 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaperTradingPage
