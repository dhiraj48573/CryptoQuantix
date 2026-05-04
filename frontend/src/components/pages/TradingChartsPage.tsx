import React, { useState, useEffect } from 'react'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Star, 
  Eye, 
  AlertTriangle, 
  BarChart3, 
  Activity,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cryptoDataService } from '../../services/cryptoDataService'
import { portfolioService } from '../../services/portfolioService'
import { authService } from '../../services/authService'
import CandlestickChartFixed from '../charts/CandlestickChartFixed'
import type { Crypto } from '../../services/cryptoDataService'

interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

const TradingChartsPage: React.FC = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>(cryptoDataService.getCryptocurrencies())
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [portfolio, setPortfolio] = useState(portfolioService.getPortfolio())
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop_loss' | 'take_profit'>('market')
  const [quantity, setQuantity] = useState<string>('1')
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [limitPrice, setLimitPrice] = useState<string>('')
  const [stopLossPrice, setStopLossPrice] = useState<string>('')
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('')
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }>({ bids: [], asks: [] })
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  
  // Chart states
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h')
  const [showVolume, setShowVolume] = useState(true)
  const [showMA, setShowMA] = useState(true)
  const [showRSI, setShowRSI] = useState(false)
  const [showOrderBook, setShowOrderBook] = useState(true)
  const [showAdvancedOrders, setShowAdvancedOrders] = useState(false)
  
  // Layout states
  const [layoutMode, setLayoutMode] = useState<'compact' | 'expanded' | 'mobile'>('compact')
  const [activeTab, setActiveTab] = useState<'chart' | 'trading' | 'market'>('chart')

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ]

  useEffect(() => {
    const unsubscribeCryptos = cryptoDataService.subscribeToCryptoUpdates(setCryptos)
    const unsubscribePortfolio = portfolioService.subscribeToPortfolioUpdates(setPortfolio)
    
    // Set default selected crypto
    if (!selectedCrypto && cryptos.length > 0) {
      setSelectedCrypto(cryptos[0])
    }

    return () => {
      unsubscribeCryptos()
      unsubscribePortfolio()
    }
  }, [cryptos, selectedCrypto])

  useEffect(() => {
    if (selectedCrypto) {
      const basePrice = selectedCrypto.price
      const bids: OrderBookEntry[] = []
      const asks: OrderBookEntry[] = []
      
      // Generate mock order book data
      for (let i = 0; i < 8; i++) {
        const bidPrice = basePrice * (1 - (i + 1) * 0.001)
        const askPrice = basePrice * (1 + (i + 1) * 0.001)
        const bidQuantity = Math.random() * 10 + 1
        const askQuantity = Math.random() * 10 + 1
        
        bids.push({
          price: bidPrice,
          quantity: bidQuantity,
          total: bidPrice * bidQuantity
        })
        
        asks.push({
          price: askPrice,
          quantity: askQuantity,
          total: askPrice * askQuantity
        })
      }
      
      setOrderBook({ bids, asks })
      
      // Generate mock recent trades
      const trades = []
      for (let i = 0; i < 10; i++) {
        const tradePrice = basePrice + (Math.random() - 0.5) * basePrice * 0.002
        const tradeQuantity = Math.random() * 5 + 0.1
        trades.push({
          price: tradePrice,
          quantity: tradeQuantity,
          total: tradePrice * tradeQuantity,
          time: new Date(Date.now() - i * 30000),
          type: Math.random() > 0.5 ? 'buy' : 'sell'
        })
      }
      setRecentTrades(trades)
    }
  }, [selectedCrypto])

  const filteredCryptos = searchQuery 
    ? cryptoDataService.searchCryptos(searchQuery)
    : cryptos

  const handleOrderSubmit = () => {
    if (!selectedCrypto || !quantity) return
    
    let executionPrice = selectedCrypto.price
    let orderPrice: number | undefined
    
    if (orderType === 'limit') {
      orderPrice = parseFloat(limitPrice)
      executionPrice = orderPrice
    } else if (orderType === 'stop_loss') {
      orderPrice = parseFloat(stopLossPrice)
      executionPrice = orderPrice
    } else if (orderType === 'take_profit') {
      orderPrice = parseFloat(takeProfitPrice)
      executionPrice = orderPrice
    }
    
    const order = portfolioService.placeOrder({
      symbol: selectedCrypto.symbol,
      type: orderSide.toUpperCase() as 'BUY' | 'SELL',
      orderType: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
      quantity: parseInt(quantity),
      price: orderPrice
    })
    
    console.log('Order placed:', order)
  }

  const toggleWatchlist = (crypto: Crypto) => {
    const exists = watchlist.find(item => item.symbol === crypto.symbol)
    if (exists) {
      setWatchlist(watchlist.filter(item => item.symbol !== crypto.symbol))
    } else {
      setWatchlist([...watchlist, {
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        change: crypto.change,
        changePercent: crypto.changePercent
      }])
    }
  }

  const isInWatchlist = (symbol: string) => {
    return watchlist.some(item => item.symbol === symbol)
  }

  // Responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setLayoutMode('mobile')
      } else if (window.innerWidth < 1024) {
        setLayoutMode('compact')
      } else {
        setLayoutMode('expanded')
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Trading & Charts</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
            Welcome, {authService.getCurrentUser()?.name || 'Guest'}! Advanced trading interface with real-time charts and analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
          {/* Layout Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLayoutMode('compact')}
              className={`p-2 rounded transition-colors ${
                layoutMode === 'compact' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('expanded')}
              className={`p-2 rounded transition-colors ${
                layoutMode === 'expanded' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Refresh Button */}
          <button className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base lg:text-lg">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      {layoutMode === 'mobile' && (
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trading' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Trading
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'market' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Market
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className={`grid gap-6 sm:gap-8 lg:gap-10 ${
        layoutMode === 'mobile' ? 'grid-cols-1' :
        layoutMode === 'compact' ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1 xl:grid-cols-3'
      }`}>
        
        {/* Chart Section - Always Visible */}
        <div className={`${layoutMode === 'mobile' && activeTab !== 'chart' ? 'hidden' : ''} ${
          layoutMode === 'compact' ? 'lg:col-span-2' : 
          layoutMode === 'expanded' ? 'xl:col-span-2' : ''
        }`}>
          <div className="card">
            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {selectedCrypto && (
                  <>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{selectedCrypto.symbol}</span>
                    <span className={`text-sm sm:text-base font-medium ${
                      selectedCrypto.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedCrypto.changePercent >= 0 ? '+' : ''}{selectedCrypto.changePercent.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Timeframe Selector */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value as any)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        timeframe === tf.value ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
                
                {/* Chart Options */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowVolume(!showVolume)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      showVolume ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Vol
                  </button>
                  <button
                    onClick={() => setShowMA(!showMA)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      showMA ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    MA
                  </button>
                  <button
                    onClick={() => setShowRSI(!showRSI)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      showRSI ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    RSI
                  </button>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            {selectedCrypto && (
              <CandlestickChartFixed
                symbol={selectedCrypto.symbol}
                timeframe={timeframe}
                height={layoutMode === 'mobile' ? 300 : layoutMode === 'compact' ? 400 : 500}
                showVolume={showVolume}
                showMA={showMA}
                showRSI={showRSI}
              />
            )}
          </div>
        </div>

        {/* Trading Panel */}
        <div className={`${layoutMode === 'mobile' && activeTab !== 'trading' ? 'hidden' : ''}`}>
          {selectedCrypto ? (
            <div className="card">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Place Order</h2>
              
              {/* Selected Crypto Info */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 text-sm sm:text-base lg:text-lg">{selectedCrypto.symbol}</span>
                  <span className={`text-sm sm:text-base font-medium ${
                    selectedCrypto.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedCrypto.changePercent >= 0 ? '+' : ''}{selectedCrypto.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                  ${selectedCrypto.price.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Virtual Capital: ${portfolio.cash.toLocaleString()}
                </div>
              </div>

              {/* Order Form */}
              <div className="space-y-3 sm:space-y-4">
                {/* Order Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderSide('buy')}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        orderSide === 'buy'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setOrderSide('sell')}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
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
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={() => setOrderType('market')}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        orderType === 'market'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      onClick={() => setOrderType('limit')}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}

                {/* Estimated Cost */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-medium text-gray-900">
                      ${quantity ? (parseFloat(quantity) * selectedCrypto.price).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleOrderSubmit}
                  className={`w-full py-2 sm:py-3 rounded-lg font-semibold text-white transition-colors text-sm sm:text-base ${
                    orderSide === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto.symbol}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-6 sm:py-8">
                <div className="text-gray-400 mb-2 text-sm sm:text-base">No cryptocurrency selected</div>
                <div className="text-xs sm:text-sm text-gray-500">Select a cryptocurrency to place an order</div>
              </div>
            </div>
          )}
        </div>

        {/* Market Overview */}
        <div className={`${layoutMode === 'mobile' && activeTab !== 'market' ? 'hidden' : ''} ${
          layoutMode === 'compact' ? 'lg:col-span-2' : ''
        }`}>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Market Overview</h2>
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
              />
            </div>
            
            {/* Crypto List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCryptos.slice(0, layoutMode === 'mobile' ? 5 : 8).map((crypto) => (
                <div
                  key={crypto.symbol}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCrypto?.symbol === crypto.symbol ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCrypto(crypto)}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      crypto.changePercent >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {crypto.symbol}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{crypto.name}</div>
                      <div className="text-xs text-gray-500 hidden sm:block">Vol: {crypto.volume}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">${crypto.price.toLocaleString()}</div>
                      <div className={`text-xs sm:text-sm font-medium ${
                        crypto.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWatchlist(crypto)
                      }}
                      className={`p-1 rounded transition-colors ${
                        isInWatchlist(crypto.symbol) 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isInWatchlist(crypto.symbol) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Book and Recent Trades - Only show in expanded layout */}
        {layoutMode === 'expanded' && selectedCrypto && showOrderBook && (
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Order Book */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Order Book</h3>
                  <button
                    onClick={() => setShowOrderBook(!showOrderBook)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Asks (Sell Orders) */}
                  <div>
                    <div className="text-xs font-medium text-red-600 mb-2">SELL</div>
                    <div className="space-y-1">
                      {orderBook.asks.slice(0, 5).map((ask, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-red-600">${ask.price.toFixed(2)}</span>
                          <span className="text-gray-600">{ask.quantity.toFixed(2)}</span>
                          <span className="text-gray-500">${ask.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Spread */}
                  <div className="border-t border-b py-2">
                    <div className="text-center font-medium text-gray-900">
                      ${selectedCrypto.price.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Bids (Buy Orders) */}
                  <div>
                    <div className="text-xs font-medium text-green-600 mb-2">BUY</div>
                    <div className="space-y-1">
                      {orderBook.bids.slice(0, 5).map((bid, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-green-600">${bid.price.toFixed(2)}</span>
                          <span className="text-gray-600">{bid.quantity.toFixed(2)}</span>
                          <span className="text-gray-500">${bid.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h3>
                <div className="space-y-2">
                  {recentTrades.slice(0, 8).map((trade, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${
                        trade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${trade.price.toFixed(2)}
                      </span>
                      <span className="text-gray-600">{trade.quantity.toFixed(2)}</span>
                      <span className="text-gray-500">${trade.total.toFixed(2)}</span>
                      <span className="text-gray-400">
                        {new Date(trade.time).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Watchlist - Show at bottom on mobile/tablet */}
      {watchlist.length > 0 && layoutMode !== 'expanded' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Watchlist</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Symbol</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Price</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Change</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.symbol} className="border-b border-gray-100">
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 text-sm">{item.symbol}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium text-gray-900 text-sm">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`text-xs font-medium ${
                        item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setSelectedCrypto(cryptos.find(c => c.symbol === item.symbol) || null)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
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
      )}
    </div>
  )
}

export default TradingChartsPage
