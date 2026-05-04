import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, TrendingUp, TrendingDown, Globe, AlertTriangle, Zap, DollarSign, BarChart3, Newspaper, Eye, Share2, Bookmark, Search, Filter, RefreshCw, X, ChevronRight, Minus, Bell, TrendingUp as TrendingIcon, Users, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  content: string
  summary: string
  source: string
  author: string
  date: string
  time: string
  category: 'Market' | 'Regulation' | 'Technology' | 'Adoption' | 'Analysis' | 'Breaking'
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
  tags: string[]
  relatedCryptos: string[]
  readCount: number
  imageUrl: string
  isLive: boolean
  isBookmarked: boolean
  likes: number
  dislikes: number
  comments: number
  shares: number
  lastUpdated: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  authorAvatar: string
  readingTime: number
}

const NewsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('today')
  const [selectedSentiment, setSelectedSentiment] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([])
  const [searchParams] = useSearchParams()

  const newsArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'Bitcoin Surges Past $50,000 as Institutional Adoption Accelerates',
      content: 'Bitcoin broke through the $50,000 resistance level today as major institutional investors announced increased allocation to cryptocurrency assets. The surge comes as several Fortune 500 companies revealed plans to add Bitcoin to their balance sheets, signaling mainstream acceptance...',
      summary: 'Bitcoin reaches new milestone as institutional investors increase crypto allocations.',
      source: 'CryptoNews',
      author: 'Sarah Mitchell',
      date: '2024-01-15',
      time: '14:30',
      category: 'Market',
      sentiment: 'positive',
      impact: 'high',
      tags: ['Bitcoin', 'Institutional', 'BTC'],
      relatedCryptos: ['BTC', 'ETH'],
      readCount: 15420,
      imageUrl: '/api/placeholder/800/400',
      isLive: true,
      isBookmarked: false,
      likes: 892,
      dislikes: 23,
      comments: 156,
      shares: 423,
      lastUpdated: '2 minutes ago',
      priority: 'urgent',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 4
    },
    {
      id: '2',
      title: 'SEC Delays Decision on Spot Bitcoin ETF Again',
      content: 'The Securities and Exchange Commission has once again delayed its decision on several spot Bitcoin ETF applications, citing the need for more time to review the proposals thoroughly. This marks the third delay for major applications including those from BlackRock and Fidelity...',
      summary: 'SEC postpones ruling on spot Bitcoin ETFs as regulatory review continues.',
      source: 'Reuters',
      author: 'Michael Chen',
      date: '2024-01-15',
      time: '11:15',
      category: 'Regulation',
      sentiment: 'negative',
      impact: 'high',
      tags: ['SEC', 'ETF', 'Regulation'],
      relatedCryptos: ['BTC'],
      readCount: 12350,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 234,
      dislikes: 189,
      comments: 267,
      shares: 189,
      lastUpdated: '1 hour ago',
      priority: 'high',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 3
    },
    {
      id: '3',
      title: 'Ethereum 2.0 Staking Reaches New All-Time High',
      content: 'Ethereum 2.0 staking has reached a new all-time high with over 20 million ETH now locked in the beacon chain, indicating growing confidence in the network. The surge in staking comes as Ethereum approaches its next major upgrade...',
      summary: 'Ethereum staking hits record high as network security and adoption grow.',
      source: 'CoinDesk',
      author: 'David Lee',
      date: '2024-01-15',
      time: '09:45',
      category: 'Technology',
      sentiment: 'positive',
      impact: 'medium',
      tags: ['Ethereum', 'Staking', 'ETH 2.0'],
      relatedCryptos: ['ETH'],
      readCount: 8920,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 456,
      dislikes: 34,
      comments: 89,
      shares: 234,
      lastUpdated: '3 hours ago',
      priority: 'normal',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 5
    },
    {
      id: '4',
      title: 'Major Bank Announces Crypto Trading Services for Wealth Management Clients',
      content: 'One of the world\'s largest banks announced today that it will begin offering cryptocurrency trading services to its wealth management clients starting next quarter. The move represents a significant milestone for crypto adoption...',
      summary: 'Traditional banking giant enters crypto market with services for high-net-worth clients.',
      source: 'Financial Times',
      author: 'Jennifer Wu',
      date: '2024-01-14',
      time: '16:20',
      category: 'Adoption',
      sentiment: 'positive',
      impact: 'high',
      tags: ['Banking', 'Adoption', 'Institutional'],
      relatedCryptos: ['BTC', 'ETH', 'ADA'],
      readCount: 18760,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 678,
      dislikes: 45,
      comments: 123,
      shares: 567,
      lastUpdated: '5 hours ago',
      priority: 'high',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 4
    },
    {
      id: '5',
      title: 'DeFi TVL Drops 15% Amid Market Volatility',
      content: 'Total Value Locked in DeFi protocols has dropped by 15% over the past week as increased market volatility leads to risk-off sentiment among investors. Major DeFi platforms have seen significant outflows...',
      summary: 'DeFi sector experiences outflows as investors reduce exposure amid market uncertainty.',
      source: 'DeFi Pulse',
      author: 'Alex Kumar',
      date: '2024-01-14',
      time: '13:00',
      category: 'Market',
      sentiment: 'negative',
      impact: 'medium',
      tags: ['DeFi', 'TVL', 'Market'],
      relatedCryptos: ['ETH', 'UNI', 'AAVE'],
      readCount: 6540,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 234,
      dislikes: 156,
      comments: 78,
      shares: 123,
      lastUpdated: '6 hours ago',
      priority: 'normal',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 3
    },
    {
      id: '6',
      title: 'New Layer 2 Solution Achieves 10,000 TPS in Testing',
      content: 'A new Layer 2 scaling solution has achieved 10,000 transactions per second in its testnet, promising to solve Ethereum\'s scalability challenges. The breakthrough could revolutionize DeFi applications...',
      summary: 'Breakthrough in blockchain scalability as new L2 solution demonstrates impressive performance.',
      source: 'TechCrunch',
      author: 'Robert Chang',
      date: '2024-01-14',
      time: '10:30',
      category: 'Technology',
      sentiment: 'positive',
      impact: 'medium',
      tags: ['Layer 2', 'Scalability', 'Ethereum'],
      relatedCryptos: ['ETH', 'MATIC', 'ARB'],
      readCount: 11230,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 567,
      dislikes: 23,
      comments: 145,
      shares: 345,
      lastUpdated: '8 hours ago',
      priority: 'normal',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 6
    },
    {
      id: '7',
      title: 'Central Bank Digital Currency (CBDC) Pilot Launches in Major Economy',
      content: 'A major economy has launched its Central Bank Digital Currency pilot program, involving over 10,000 citizens and 500 merchants in the initial phase. The program aims to test the feasibility of digital currency in daily transactions...',
      summary: 'Government launches CBDC pilot program as digital currency adoption accelerates globally.',
      source: 'Bloomberg',
      author: 'Maria Garcia',
      date: '2024-01-13',
      time: '15:45',
      category: 'Adoption',
      sentiment: 'neutral',
      impact: 'high',
      tags: ['CBDC', 'Digital Currency', 'Government'],
      relatedCryptos: ['BTC', 'ETH', 'XRP'],
      readCount: 21450,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 890,
      dislikes: 234,
      comments: 267,
      shares: 789,
      lastUpdated: '1 day ago',
      priority: 'high',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 7
    },
    {
      id: '8',
      title: 'Crypto Market Analysis: Correlation Patterns Shift Amid New Regulations',
      content: 'Recent regulatory changes have altered traditional correlation patterns in cryptocurrency markets, with Bitcoin showing increased independence from traditional assets. Market analysts suggest this could indicate crypto market maturation...',
      summary: 'Market analysis reveals changing correlation patterns as crypto markets mature.',
      source: 'MarketWatch',
      author: 'Thomas Brown',
      date: '2024-01-13',
      time: '11:00',
      category: 'Analysis',
      sentiment: 'neutral',
      impact: 'medium',
      tags: ['Analysis', 'Correlation', 'Market'],
      relatedCryptos: ['BTC', 'ETH', 'SPY'],
      readCount: 7890,
      imageUrl: '/api/placeholder/800/400',
      isLive: false,
      isBookmarked: false,
      likes: 345,
      dislikes: 67,
      comments: 56,
      shares: 234,
      lastUpdated: '1 day ago',
      priority: 'normal',
      authorAvatar: '/api/placeholder/40/40',
      readingTime: 8
    }
  ]

  const categories = ['all', 'Market', 'Regulation', 'Technology', 'Adoption', 'Analysis', 'Breaking']
  const timeframes = ['today', 'week', 'month']
  const sentiments = ['all', 'positive', 'negative', 'neutral']

  // Enhanced filtering with search functionality
  const filteredArticles = newsArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    const matchesSentiment = selectedSentiment === 'all' || article.sentiment === selectedSentiment
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      article.relatedCryptos.some(crypto => crypto.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSentiment && matchesSearch
  })

  // Sort by priority and last updated
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // If same priority, sort by last updated (more recent first)
    return b.lastUpdated.localeCompare(a.lastUpdated)
  })

  const breakingNews = sortedArticles.filter(article => article.category === 'Breaking')
  const highImpactNews = sortedArticles.filter(article => article.impact === 'high' && article.category !== 'Breaking')
  const regularNews = sortedArticles.filter(article => article.category !== 'Breaking' && article.impact !== 'high')

  // Professional features functions
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call to refresh news
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const handleBookmark = (articleId: string) => {
    setBookmarkedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    )
  }

  const handleShare = (article: NewsArticle) => {
    // Simulate share functionality
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${article.title} - ${article.summary}`)
    }
  }

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Update read counts and last updated times
      // This would normally come from a WebSocket or API
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Handle URL params for search
  useEffect(() => {
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatReadCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Newspaper className="w-12 h-12 sm:w-16 sm:h-16 mr-4" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                Professional News Hub
              </h1>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl mb-8 sm:mb-12 max-w-5xl mx-auto px-4 text-blue-100 leading-relaxed">
              Real-time cryptocurrency news, market analysis, and regulatory updates with professional insights
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
              <div className="flex items-center group">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Global Coverage</div>
                  <div className="text-sm text-blue-200">150+ Sources</div>
                </div>
              </div>
              <div className="flex items-center group">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Breaking News</div>
                  <div className="text-sm text-blue-200">Live Updates</div>
                </div>
              </div>
              <div className="flex items-center group">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Market Analysis</div>
                  <div className="text-sm text-blue-200">AI-Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Search and Filters Section */}
      <section className="py-6 sm:py-8 bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-3xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search news, cryptocurrencies, tags..."
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-gray-50"
                />
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center">
              {/* Category Filter */}
              <div className="flex-1 lg:flex-none lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sentiment Filter */}
              <div className="flex-1 lg:flex-none lg:w-48">
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Sentiment</option>
                  {sentiments.slice(1).map(sentiment => (
                    <option key={sentiment} value={sentiment}>
                      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Filter */}
              <div className="flex-1 lg:flex-none lg:w-48">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {timeframes.map(timeframe => (
                    <option key={timeframe} value={timeframe}>
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors lg:hidden"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Results Count */}
            <div className="mt-4 text-center lg:text-left">
              <span className="text-sm text-gray-600">
                Showing {filteredArticles.length} of {newsArticles.length} articles
                {searchQuery && ` for "${searchQuery}"`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Breaking News */}
      {breakingNews.length > 0 && (
        <section className="py-8 sm:py-12 bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse"></div>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="relative">
                    <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-red-900">Breaking News</h2>
                    <p className="text-red-700 text-sm mt-1">Live updates as they happen</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700 font-medium">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {breakingNews.map(article => (
                  <article key={article.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-red-500 overflow-hidden group">
                    {article.isLive && (
                      <div className="bg-red-500 text-white px-3 py-1 text-xs font-bold flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        LIVE UPDATES
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getImpactColor(article.impact)} mr-2`}>
                              {article.impact.toUpperCase()} IMPACT
                            </span>
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getSentimentColor(article.sentiment)}`}>
                              {article.sentiment.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 text-base line-clamp-3 mb-4">
                            {article.summary}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                              <div>
                                <div className="font-medium text-gray-900">{article.author}</div>
                                <div className="flex items-center">
                                  <span className="text-gray-600">{article.source}</span>
                                  <span className="mx-2">·</span>
                                  <span>{article.lastUpdated}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <Eye className="w-4 h-4 mr-1" />
                                <span>{formatReadCount(article.readCount)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                <span>{article.comments}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{article.readingTime} min read</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleBookmark(article.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  bookmarkedArticles.includes(article.id) 
                                    ? 'text-yellow-600 bg-yellow-100' 
                                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleShare(article)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Professional High Impact News */}
      {highImpactNews.length > 0 && (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">High Impact News</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Stories that could significantly affect market movements and trading strategies
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {highImpactNews.slice(0, 4).map((article, index) => (
                  <article key={article.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-600 relative">
                      <div className="absolute inset-0 bg-black opacity-20"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getImpactColor(article.impact)} bg-white/90`}>
                            {article.impact.toUpperCase()} IMPACT
                          </span>
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getSentimentColor(article.sentiment)} bg-white/90`}>
                            {article.sentiment.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {article.priority === 'urgent' && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          URGENT
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-6 line-clamp-3">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                          <div>
                            <div className="font-medium text-gray-900">{article.author}</div>
                            <div className="text-sm text-gray-500">
                              {article.source} • {article.lastUpdated}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{formatReadCount(article.readCount)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            <span>{article.comments}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-wrap gap-2">
                          {article.relatedCryptos.slice(0, 3).map(crypto => (
                            <span key={crypto} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {crypto}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          {article.readingTime} min read
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            <span>{article.likes}</span>
                          </button>
                          <button className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            <span>{article.dislikes}</span>
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleBookmark(article.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              bookmarkedArticles.includes(article.id) 
                                ? 'text-yellow-600 bg-yellow-100' 
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleShare(article)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Professional Regular News */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Latest News</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Comprehensive coverage of cryptocurrency markets, technology, and regulations
              </p>
            </div>
            
            {regularNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {regularNews.map(article => (
                  <article key={article.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="h-40 bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 relative">
                      <div className="absolute inset-0 bg-black opacity-20"></div>
                      <div className="absolute top-4 left-4">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getSentimentColor(article.sentiment)} bg-white/90`}>
                          {article.sentiment.toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 px-2 py-1 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs">{article.author}</div>
                            <div className="text-xs">{article.source}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {article.lastUpdated}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            <span>{formatReadCount(article.readCount)}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            <span>{article.comments}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{article.readingTime}m</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {article.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleBookmark(article.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              bookmarkedArticles.includes(article.id) 
                                ? 'text-yellow-600 bg-yellow-100' 
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                          >
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleShare(article)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                        <Link
                          to={`/news/${article.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center group"
                        >
                          Read More
                          <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Newspaper className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No news found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Try adjusting your filters or search terms to see more articles.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Professional Market Overview */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Market Overview</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Real-time sentiment analysis and market impact indicators
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-green-700">Positive News</span>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-green-900 mb-2">
                  {filteredArticles.filter(a => a.sentiment === 'positive').length}
                </div>
                <div className="text-sm text-green-600">Articles today</div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="text-xs text-green-600">
                    {filteredArticles.filter(a => a.sentiment === 'positive').length > 0 ? '+12%' : '0%'} vs yesterday
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-red-700">Negative News</span>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-red-900 mb-2">
                  {filteredArticles.filter(a => a.sentiment === 'negative').length}
                </div>
                <div className="text-sm text-red-600">Articles today</div>
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="text-xs text-red-600">
                    {filteredArticles.filter(a => a.sentiment === 'negative').length > 0 ? '-8%' : '0%'} vs yesterday
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-blue-700">High Impact</span>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">
                  {filteredArticles.filter(a => a.impact === 'high').length}
                </div>
                <div className="text-sm text-blue-600">Breaking stories</div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-600">
                    {filteredArticles.filter(a => a.impact === 'high').length > 0 ? 'Market moving' : 'No alerts'}
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-purple-700">Total Views</span>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-purple-900 mb-2">
                  {formatReadCount(filteredArticles.reduce((sum, a) => sum + a.readCount, 0))}
                </div>
                <div className="text-sm text-purple-600">Total reads</div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="text-xs text-purple-600">
                    +24% engagement this week
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredArticles.filter(a => a.category === 'Technology').length}
                    </div>
                    <div className="text-sm text-gray-600">Technology News</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredArticles.filter(a => a.category === 'Regulation').length}
                    </div>
                    <div className="text-sm text-gray-600">Regulation News</div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredArticles.filter(a => a.isLive).length}
                    </div>
                    <div className="text-sm text-gray-600">Live Updates</div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default NewsPage
