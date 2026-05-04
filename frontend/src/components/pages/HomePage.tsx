import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, BarChart3, Activity, DollarSign, Shield, Zap, Users, ArrowRight, Sparkles, Rocket, Star } from 'lucide-react'

const HomePage: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-slate-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100/30 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-100/30 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-purple-100/30 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-40 w-72 h-72 bg-cyan-100/30 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating 3D Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-32 left-32 w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transform rotate-45 animate-float shadow-lg"
          style={{
            transform: `rotate(45deg) translateX(${mousePosition.x * 0.02}px) translateY(${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute top-64 right-48 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-float animation-delay-1000 shadow-lg"
          style={{
            transform: `translateX(${mousePosition.x * 0.03}px) translateY(${mousePosition.y * 0.03}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute bottom-48 left-64 w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg transform rotate-12 animate-float animation-delay-2000 shadow-lg"
          style={{
            transform: `rotate(12deg) translateX(${mousePosition.x * 0.025}px) translateY(${mousePosition.y * 0.025}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute bottom-32 right-32 w-24 h-24 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full animate-float animation-delay-3000 shadow-lg"
          style={{
            transform: `translateX(${mousePosition.x * 0.015}px) translateY(${mousePosition.y * 0.015}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="w-full px-6 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 animate-pulse shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Smart Cryptocurrency
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">
                Trading Platform
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-10 sm:mb-12 lg:mb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 leading-relaxed">
              Leverage advanced <span className="text-blue-600 font-semibold">correlation analysis</span> between Bitcoin and altcoins to identify <span className="text-indigo-600 font-semibold">profitable trading opportunities</span> with <span className="text-gray-700 font-semibold">institutional-grade analytics</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center px-4 sm:px-6 lg:px-8">
              <Link
                to="/paper-trading"
                className="group inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-xl text-lg sm:text-xl"
              >
                <span className="flex items-center">
                  <Rocket className="mr-3 w-5 h-5 sm:w-6 sm:h-6" />
                  Start Trading
                  <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                to="/correlations"
                className="group inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-white text-gray-700 font-bold rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-lg text-lg sm:text-xl"
              >
                <BarChart3 className="mr-3 w-5 h-5 sm:w-6 sm:h-6" />
                View Analytics
                <Star className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-gray-50 to-slate-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Advanced Trading Features
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 leading-relaxed">
              Everything you need for <span className="text-blue-600 font-semibold">sophisticated cryptocurrency trading</span> with <span className="text-indigo-600 font-semibold">correlation-based insights</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 px-2 sm:px-4">
            <div className="group relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200 hover:border-blue-300 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Correlation Analysis
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Real-time Pearson correlation coefficients between Bitcoin and altcoins with statistical significance testing.
                </p>
                <Link to="/correlations" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base lg:text-lg group-hover:translate-x-2 transition-transform">
                  Explore Correlations
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200 hover:border-purple-300 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Algorithmic Signals
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Automated buy/sell signals based on statistical relationships and BTC lead/lag detection.
                </p>
                <Link to="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold text-sm sm:text-base lg:text-lg group-hover:translate-x-2 transition-transform">
                  View Dashboard
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200 hover:border-green-300 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Risk-Free Trading
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Paper trading with $100,000 virtual capital for strategy testing without financial risk.
                </p>
                <Link to="/paper-trading" className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold text-sm sm:text-base lg:text-lg group-hover:translate-x-2 transition-transform">
                  Start Trading
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200 hover:border-cyan-300 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <Zap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Real-Time Updates
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Live price updates every second with correlation recalculations every 5 seconds.
                </p>
                <Link to="/dashboard" className="inline-flex items-center text-cyan-600 hover:text-cyan-700 font-semibold text-sm sm:text-base lg:text-lg group-hover:translate-x-2 transition-transform">
                  Live Dashboard
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200 hover:border-orange-300 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Advanced Analytics
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Statistical heatmaps, trend analysis, and portfolio optimization recommendations.
                </p>
                <Link to="/correlations" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold text-sm sm:text-base lg:text-lg group-hover:translate-x-2 transition-transform">
                  View Analytics
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200 hover:border-indigo-300 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Portfolio Management
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Track crypto positions with real-time P&L and asset allocation visualization.
                </p>
                <Link to="/portfolio" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm sm:text-base lg:text-lg group-hover:translate-x-2 transition-transform">
                  Manage Portfolio
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crypto Markets Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 via-gray-50 to-white">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Supported Cryptocurrencies
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 leading-relaxed">
              Real-time data and <span className="text-blue-600 font-semibold">correlation analysis</span> for major crypto assets
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 px-2 sm:px-4">
            {[
              { symbol: 'BTC', name: 'Bitcoin', color: 'bg-orange-500', textColor: 'text-orange-600' },
              { symbol: 'ETH', name: 'Ethereum', color: 'bg-blue-500', textColor: 'text-blue-600' },
              { symbol: 'BNB', name: 'Binance', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
              { symbol: 'SOL', name: 'Solana', color: 'bg-purple-500', textColor: 'text-purple-600' },
              { symbol: 'ADA', name: 'Cardano', color: 'bg-blue-600', textColor: 'text-blue-700' },
              { symbol: 'XRP', name: 'Ripple', color: 'bg-gray-500', textColor: 'text-gray-600' },
              { symbol: 'DOT', name: 'Polkadot', color: 'bg-pink-500', textColor: 'text-pink-600' },
              { symbol: 'AVAX', name: 'Avalanche', color: 'bg-red-500', textColor: 'text-red-600' }
            ].map((crypto) => (
              <div key={crypto.symbol} className="group text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-20 lg:h-20 ${crypto.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-2xl`}>
                  <span className="text-white font-bold text-sm sm:text-base lg:text-lg">{crypto.symbol}</span>
                </div>
                <p className={`text-xs sm:text-sm font-medium ${crypto.textColor} hidden sm:block group-hover:scale-105 transition-transform`}>{crypto.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/20 rounded-full animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-pulse">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 sm:mb-10 lg:mb-12">
            Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-300">Trade Smarter</span>?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-12 sm:mb-16 lg:mb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 leading-relaxed">
            Join thousands of traders using <span className="text-yellow-300 font-semibold">correlation analysis</span> to gain an edge in the <span className="text-orange-300 font-semibold">cryptocurrency markets</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center px-4 sm:px-6 lg:px-8">
            <Link
              to="/paper-trading"
              className="group inline-flex items-center justify-center px-10 sm:px-12 py-5 sm:py-6 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl text-lg sm:text-xl"
            >
              <span className="flex items-center">
                <Zap className="mr-3 w-5 h-5 sm:w-6 sm:h-6" />
                Start Trading Now
                <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </Link>
            <Link
              to="/about"
              className="group inline-flex items-center justify-center px-10 sm:px-12 py-5 sm:py-6 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full border-2 border-white/30 hover:bg-white/30 transform hover:scale-105 transition-all duration-300 text-lg sm:text-xl"
            >
              <Sparkles className="mr-3 w-5 h-5 sm:w-6 sm:h-6" />
              Learn More
              <Star className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
