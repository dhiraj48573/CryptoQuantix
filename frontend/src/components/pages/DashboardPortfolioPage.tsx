import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  Target, 
  Zap, 
  Clock, 
  BarChart3, 
  PieChart, 
  Eye, 
  Star, 
  Bell, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  Calendar,
  Award,
  BookOpen,
  Shield,
  Trophy,
  Info,
  TrendingDown as TrendingDownIcon,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cryptoDataService } from '../../services/cryptoDataService'
import { portfolioService } from '../../services/portfolioService'
import { authService } from '../../services/authService'
import type { Position } from '../../services/portfolioService'

interface MarketSentiment {
  overall: 'Bullish' | 'Bearish' | 'Neutral'
  score: number
  factors: {
    volume: number
    volatility: number
    momentum: number
  }
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  action: () => void
}

interface ActivityItem {
  id: string
  type: 'trade' | 'price_alert' | 'signal' | 'portfolio_update'
  title: string
  description: string
  timestamp: Date
  icon: React.ElementType
  color: string
}

interface UserProfile {
  name: string
  email: string
  joinDate: string
  tradingLevel: string
  experience: string
  totalTrades: number
  achievements: string[]
}

interface TradingStats {
  todayTrades: number
  todayPnL: number
  weeklyPnL: number
  monthlyPnL: number
  bestDay: number
  worstDay: number
  averageTradeSize: number
  largestWin: number
  largestLoss: number
}

interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercent: number
  bestPerformer: Position | null
  worstPerformer: Position | null
  winRate: number
  averageHoldingPeriod: number
  riskScore: number
}

interface RiskAssessment {
  overallRisk: 'Low' | 'Medium' | 'High'
  diversificationScore: number
  volatilityScore: number
  concentrationRisk: string
  recommendations: string[]
}

interface EducationalInsight {
  title: string
  description: string
  type: 'tip' | 'warning' | 'opportunity'
  icon: React.ReactNode
}

const DashboardPortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState(portfolioService.getPortfolio())
  const [cryptos, setCryptos] = useState(cryptoDataService.getCryptocurrencies())
  const [topMovers, setTopMovers] = useState(cryptoDataService.getTopMovers())
  const [recentTrades, setRecentTrades] = useState(portfolioService.getRecentTrades(4))
  const [tradingSignals, setTradingSignals] = useState(cryptoDataService.getTradingSignals())
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSignals, setShowSignals] = useState(true)
  const [showActivity, setShowActivity] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'analytics' | 'insights'>('overview')
  const [layoutMode, setLayoutMode] = useState<'compact' | 'expanded'>('expanded')

  // Get actual user profile data from authService
  const currentUser = authService.getCurrentUser()
  const userProfile: UserProfile = {
    name: currentUser?.name || 'Guest User',
    email: currentUser?.email || 'guest@example.com',
    joinDate: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '2024-01-15',
    tradingLevel: 'Intermediate',
    experience: '6 months',
    totalTrades: portfolio.totalTrades,
    achievements: ['First Trade', 'Week Trader', 'Profit Maker']
  }
  
  // Mock trading statistics
  const tradingStats: TradingStats = {
    todayTrades: 3,
    todayPnL: 250.50,
    weeklyPnL: 1250.75,
    monthlyPnL: 5420.30,
    bestDay: 1250.00,
    worstDay: -320.50,
    averageTradeSize: 850.00,
    largestWin: 2100.00,
    largestLoss: -650.00
  }

  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>({
    overall: 'Neutral',
    score: 50,
    factors: {
      volume: 65,
      volatility: 45,
      momentum: 55
    }
  })

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)

  // Calculate risk assessment
  const riskAssessment: RiskAssessment = {
    overallRisk: portfolio.totalValue > 110000 ? 'Medium' : 'Low',
    diversificationScore: Math.min(100, portfolio.positions.length * 20),
    volatilityScore: Math.abs(portfolio.totalUnrealizedPnLPercent) * 2,
    concentrationRisk: portfolio.positions.length > 0 ? 
      `${Math.max(...portfolio.positions.map(p => (p.marketValue / portfolio.totalValue) * 100)).toFixed(1)}% in ${portfolio.positions.reduce((max, pos) => pos.marketValue > max.marketValue ? pos : max).symbol}` : 
      'No positions',
    recommendations: [
      'Consider diversifying across different sectors',
      'Set stop-loss orders to limit downside risk',
      'Monitor correlation between your holdings'
    ]
  }
  
  // Educational insights
  const educationalInsights: EducationalInsight[] = [
    {
      title: 'Portfolio Diversification',
      description: 'Your portfolio is well-diversified with multiple assets. This helps reduce risk.',
      type: 'tip',
      icon: <Shield className="w-4 h-4" />
    },
    {
      title: 'Market Volatility Alert',
      description: 'High volatility detected. Consider reducing position sizes or setting tighter stops.',
      type: 'warning',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      title: 'Opportunity Zone',
      description: 'BTC showing strong momentum. Consider increasing exposure if risk appetite allows.',
      type: 'opportunity',
      icon: <Zap className="w-4 h-4" />
    }
  ]

  useEffect(() => {
    const unsubscribePortfolio = portfolioService.subscribeToPortfolioUpdates(setPortfolio)
    const unsubscribeCryptos = cryptoDataService.subscribeToCryptoUpdates(setCryptos)
    const unsubscribeCryptoUpdates = cryptoDataService.subscribeToCryptoUpdates(() => {
      setTopMovers(cryptoDataService.getTopMovers())
      setRecentTrades(portfolioService.getRecentTrades(4))
      setTradingSignals(cryptoDataService.getTradingSignals())
    })

    const unsubscribeSignals = cryptoDataService.subscribeToSignalUpdates(setTradingSignals)

    // Generate mock recent activity
    const generateActivity = () => {
      const activities: ActivityItem[] = []
      
      recentTrades.slice(0, 3).forEach((trade, index) => {
        activities.push({
          id: `trade-${index}`,
          type: 'trade',
          title: `${trade.type} ${trade.symbol}`,
          description: `${trade.quantity} ${trade.symbol} at $${trade.price.toFixed(2)}`,
          timestamp: new Date(Date.now() - index * 60000),
          icon: trade.type === 'BUY' ? ArrowUpRight : ArrowDownRight,
          color: trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'
        })
      })

      tradingSignals.slice(0, 2).forEach((signal, index) => {
        activities.push({
          id: `signal-${index}`,
          type: 'signal',
          title: `${signal.signal} Signal`,
          description: `${signal.symbol}: ${signal.reason}`,
          timestamp: new Date(Date.now() - (index + 3) * 60000),
          icon: Target,
          color: signal.signal === 'BUY' ? 'text-green-500' : 'text-red-500'
        })
      })

      activities.push({
        id: 'portfolio-update',
        type: 'portfolio_update',
        title: 'Portfolio Updated',
        description: `Total value: $${portfolio.totalValue.toLocaleString()}`,
        timestamp: new Date(Date.now() - 5 * 60000),
        icon: PieChart,
        color: 'text-blue-500'
      })

      setRecentActivity(activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
    }

    generateActivity()

    return () => {
      unsubscribePortfolio()
      unsubscribeCryptos()
      unsubscribeCryptoUpdates()
      unsubscribeSignals()
    }
  }, [recentTrades, tradingSignals, portfolio.totalValue])

  useEffect(() => {
    // Calculate market sentiment
    const avgChange = cryptos.reduce((sum, crypto) => sum + crypto.changePercent, 0) / cryptos.length
    const positiveCount = cryptos.filter(c => c.changePercent > 0).length
    const sentiment = positiveCount / cryptos.length

    let overall: 'Bullish' | 'Bearish' | 'Neutral'
    let score = 50

    if (sentiment > 0.6) {
      overall = 'Bullish'
      score = 70 + (sentiment - 0.6) * 50
    } else if (sentiment < 0.4) {
      overall = 'Bearish'
      score = 30 - (0.4 - sentiment) * 50
    } else {
      overall = 'Neutral'
      score = 50 + (sentiment - 0.5) * 40
    }

    setMarketSentiment({
      overall,
      score: Math.round(score),
      factors: {
        volume: 65 + Math.random() * 20,
        volatility: 45 + Math.random() * 20,
        momentum: 55 + Math.random() * 20
      }
    })
  }, [cryptos])

  useEffect(() => {
    // Calculate performance metrics
    if (portfolio.positions.length > 0) {
      const totalReturn = portfolio.totalUnrealizedPnL
      const totalReturnPercent = portfolio.totalUnrealizedPnLPercent
      const bestPerformer = portfolio.positions.reduce((best, pos) => 
        !best || pos.unrealizedPnLPercent > best.unrealizedPnLPercent ? pos : best, portfolio.positions[0]
      )
      const worstPerformer = portfolio.positions.reduce((worst, pos) => 
        !worst || pos.unrealizedPnLPercent < worst.unrealizedPnLPercent ? pos : worst, portfolio.positions[0]
      )
      
      setPerformanceMetrics({
        totalReturn,
        totalReturnPercent,
        bestPerformer,
        worstPerformer,
        winRate: portfolio.winRate || 0,
        averageHoldingPeriod: 15,
        riskScore: Math.min(100, Math.abs(totalReturnPercent) * 2)
      })
    }
  }, [portfolio])

  const quickActions: QuickAction[] = [
    {
      id: 'trade',
      title: 'Quick Trade',
      description: 'Place a new order',
      icon: Zap,
      color: 'bg-blue-500',
      action: () => window.location.href = '/trade'
    },
    {
      id: 'charts',
      title: 'Charts',
      description: 'Analyze market trends',
      icon: BarChart3,
      color: 'bg-purple-500',
      action: () => window.location.href = '/trade'
    },
    {
      id: 'correlations',
      title: 'Correlations',
      description: 'View crypto correlations',
      icon: Target,
      color: 'bg-orange-500',
      action: () => window.location.href = '/correlations'
    },
    {
      id: 'paper-trading',
      title: 'Paper Trading',
      description: 'Practice trading',
      icon: Trophy,
      color: 'bg-green-500',
      action: () => window.location.href = '/paper-trading'
    }
  ]

  const safeNumber = (value: number, fallback: number = 0) => {
    return isNaN(value) || !isFinite(value) ? fallback : value
  }

  const safePercent = (value: number) => {
    const safe = safeNumber(value, 0)
    return `${safe >= 0 ? '+' : ''}${safe.toFixed(1)}%`
  }

  const stats = [
    {
      title: 'Total Portfolio Value',
      value: `$${safeNumber(portfolio.totalValue, 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: safePercent(portfolio.totalUnrealizedPnLPercent),
      trend: safeNumber(portfolio.totalUnrealizedPnLPercent) >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign
    },
    {
      title: 'Today\'s P&L',
      value: `$${Math.abs(safeNumber(portfolio.dayPnL, 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: safePercent(portfolio.dayPnLPercent),
      trend: safeNumber(portfolio.dayPnL) >= 0 ? 'up' as const : 'down' as const,
      icon: TrendingUp
    },
    {
      title: 'Open Positions',
      value: (portfolio.positions?.length || 0).toString(),
      change: (portfolio.positions?.length || 0) > 0 ? `${portfolio.positions.length} active` : 'No positions',
      trend: 'up' as const,
      icon: Activity
    },
    {
      title: 'Win Rate',
      value: `${safeNumber(portfolio.winRate, 0).toFixed(1)}%`,
      change: (portfolio.totalTrades || 0) > 0 ? `${portfolio.totalTrades} total` : 'No trades',
      trend: safeNumber(portfolio.winRate, 0) >= 50 ? 'up' as const : 'down' as const,
      icon: TrendingDown
    }
  ]

  const allocation = portfolio.positions.map(pos => ({
    symbol: pos.symbol,
    value: pos.marketValue,
    percentage: (pos.marketValue / portfolio.totalValue) * 100
  }))

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4">
      {/* User Profile Header */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{userProfile.name}'s Dashboard</h1>
              <p className="text-sm text-gray-600">{userProfile.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {userProfile.tradingLevel}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Joined {new Date(userProfile.joinDate).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {userProfile.experience} experience
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </button>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Achievements */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-3 sm:mb-4">Achievements</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {userProfile.achievements.map((achievement, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Award className="w-3 h-3 mr-1" />
                {achievement}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 sm:p-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'portfolio' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
          }`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'analytics' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'insights' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
          }`}
        >
          Insights
        </button>
      </div>

      {/* Stats Grid - Always Visible */}
      <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${
        layoutMode === 'compact' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-xs sm:text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                  stat.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Market Sentiment & Quick Actions */}
          <div className={`grid gap-4 sm:gap-6 ${
            layoutMode === 'compact' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {/* Market Sentiment */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Market Sentiment</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  marketSentiment.overall === 'Bullish' ? 'bg-green-100 text-green-800' :
                  marketSentiment.overall === 'Bearish' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {marketSentiment.overall}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{safeNumber(marketSentiment.score, 50)}</div>
                  <div className="text-sm text-gray-600">Sentiment Score</div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">{safeNumber(marketSentiment.factors.volume, 50).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, safeNumber(marketSentiment.factors.volume, 50)))}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Volatility</span>
                      <span className="font-medium">{safeNumber(marketSentiment.factors.volatility, 50).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, safeNumber(marketSentiment.factors.volatility, 50)))}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Momentum</span>
                      <span className="font-medium">{safeNumber(marketSentiment.factors.momentum, 50).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, safeNumber(marketSentiment.factors.momentum, 50)))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all group"
                    >
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {action.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {action.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Trading Signals */}
          {showSignals && tradingSignals.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Trading Signals</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSignals(!showSignals)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-500">
                    {tradingSignals.length} active signals
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tradingSignals.slice(0, 6).map((signal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{signal.symbol}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          signal.signal === 'BUY' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {signal.signal}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-gray-600">
                          {safeNumber(signal.strength, 0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      {signal.reason || 'No reason provided'}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Correlation: {safeNumber(signal.correlation, 0).toFixed(2)}
                      </span>
                      <span className="text-gray-400">
                        {signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString() : 'No time'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Feed */}
          {showActivity && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg bg-white ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {activity.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portfolio Tab Content */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Portfolio Allocation */}
          {allocation.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h3>
                <PieChart className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-3">
                {allocation.map((item, index) => (
                  <div key={item.symbol} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-900">{item.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${item.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${portfolio.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
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
                              {pnlPercent <= -5 && <TrendingDownIcon className="w-4 h-4 text-red-500" />}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-900">{position.quantity}</td>
                          <td className="py-3 px-4 text-gray-900">${position.avgCost.toFixed(2)}</td>
                          <td className="py-3 px-4 text-gray-900">${position.currentPrice.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
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

          {/* Recent Trades */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Symbol</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Quantity</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Price</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-4 text-sm text-gray-900">{trade.symbol || 'Unknown'}</td>
                      <td className="py-2 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.type || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">{safeNumber(trade.quantity, 0)}</td>
                      <td className="py-2 px-4 text-sm text-gray-900">${safeNumber(trade.price, 0).toFixed(2)}</td>
                      <td className="py-2 px-4 text-sm text-gray-900">${safeNumber(trade.quantity * trade.price, 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Trading Statistics */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Trading Statistics</h3>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{tradingStats.todayTrades}</div>
                <div className="text-sm text-gray-600">Today's Trades</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${tradingStats.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${tradingStats.todayPnL.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Today's P&L</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${tradingStats.weeklyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${tradingStats.weeklyPnL.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Weekly P&L</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${tradingStats.monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${tradingStats.monthlyPnL.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Monthly P&L</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Best Performance
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Best Day:</span>
                    <span className="font-medium text-green-900">${tradingStats.bestDay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Largest Win:</span>
                    <span className="font-medium text-green-900">${tradingStats.largestWin.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-3 flex items-center">
                  <TrendingDownIcon className="w-4 h-4 mr-2" />
                  Risk Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Worst Day:</span>
                    <span className="font-medium text-red-900">${tradingStats.worstDay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Largest Loss:</span>
                    <span className="font-medium text-red-900">${tradingStats.largestLoss.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Return</span>
                    <span className={`text-sm font-medium ${
                      performanceMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${performanceMetrics.totalReturn.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Return %</span>
                    <span className={`text-sm font-medium ${
                      performanceMetrics.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {performanceMetrics.totalReturnPercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <span className="text-sm font-medium text-gray-900">
                      {performanceMetrics.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className={`text-sm font-medium ${
                      performanceMetrics.riskScore > 70 ? 'text-red-600' : 
                      performanceMetrics.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {performanceMetrics.riskScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Best Performer</h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                {performanceMetrics.bestPerformer ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Symbol</span>
                      <span className="text-sm font-medium text-gray-900">
                        {performanceMetrics.bestPerformer.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Return</span>
                      <span className="text-sm font-medium text-green-600">
                        {performanceMetrics.bestPerformer.unrealizedPnLPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Value</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${performanceMetrics.bestPerformer.marketValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No positions</div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Worst Performer</h3>
                  <TrendingDownIcon className="w-5 h-5 text-red-500" />
                </div>
                {performanceMetrics.worstPerformer ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Symbol</span>
                      <span className="text-sm font-medium text-gray-900">
                        {performanceMetrics.worstPerformer.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Return</span>
                      <span className="text-sm font-medium text-red-600">
                        {performanceMetrics.worstPerformer.unrealizedPnLPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Value</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${performanceMetrics.worstPerformer.marketValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No positions</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab Content */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Risk Assessment */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Risk Level</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        riskAssessment.overallRisk === 'Low' ? 'bg-green-100 text-green-800' :
                        riskAssessment.overallRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {riskAssessment.overallRisk}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Diversification Score</span>
                      <span className="text-sm font-medium text-gray-900">{riskAssessment.diversificationScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${riskAssessment.diversificationScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Volatility Score</span>
                      <span className="text-sm font-medium text-gray-900">{riskAssessment.volatilityScore.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          riskAssessment.volatilityScore > 70 ? 'bg-red-600' :
                          riskAssessment.volatilityScore > 40 ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(100, riskAssessment.volatilityScore)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-700">Concentration Risk:</span>
                    <span className="text-sm text-gray-900 ml-2">{riskAssessment.concentrationRisk}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {riskAssessment.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Educational Insights */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Educational Insights</h3>
              <BookOpen className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {educationalInsights.map((insight, index) => (
                <div key={index} className={`rounded-lg p-4 border-l-4 ${
                  insight.type === 'tip' ? 'bg-blue-50 border-blue-500' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'tip' ? 'bg-blue-100 text-blue-600' :
                      insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Overview - Always Visible */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top Movers</h3>
            <div className="space-y-2">
              {topMovers.gainers.slice(0, 5).map((crypto: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{crypto.symbol}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">${crypto.price.toLocaleString()}</span>
                    <span className={`text-xs font-medium ${
                      crypto.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Market Indices</h3>
            <div className="space-y-2">
              {cryptos.slice(0, 3).map((crypto: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{crypto.symbol}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">${crypto.price.toLocaleString()}</span>
                    <span className={`text-xs font-medium ${
                      crypto.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPortfolioPage
