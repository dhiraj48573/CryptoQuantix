import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, BarChart } from 'recharts'
import { cryptoDataService } from "../../services/cryptoDataService"

interface CandlestickData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma20?: number
  ma50?: number
  rsi?: number
}

interface CandlestickChartProps {
  symbol: string
  timeframe: string
  height?: number
  showVolume?: boolean
  showMA?: boolean
  showRSI?: boolean
}

const CandlestickChartFixed: React.FC<CandlestickChartProps> = ({
  symbol,
  timeframe,
  height = 400,
  showVolume = true,
  showMA = true,
  showRSI = false
}) => {
  const [data, setData] = useState<CandlestickData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateCandlestickData = () => {
      try {
        const crypto = cryptoDataService.getCryptoBySymbol(symbol)
        if (!crypto || !crypto.price) {
          return []
        }

        const now = new Date()
        const dataPoints: CandlestickData[] = []
        let basePrice = crypto.price

        // Generate data based on timeframe
        const intervals: { [key: string]: number } = {
          '1m': 60,
          '5m': 12,
          '15m': 4,
          '1h': 1,
          '4h': 0.25,
          '1d': 0.0625
        }

        const interval = intervals[timeframe] || 1
        const numPoints = Math.floor(interval * 24)
        const timeStep = (24 * 60) / numPoints

        for (let i = numPoints; i >= 0; i--) {
          const time = new Date(now.getTime() - i * timeStep * 60 * 1000)
          const volatility = crypto.symbol === 'BTC' ? 0.01 : 0.015
          
          // Generate OHLC data with safety checks
          const open = basePrice > 0 ? basePrice : 1
          const change = (Math.random() - 0.5) * open * volatility
          const close = Math.max(0.01, open + change)
          const high = Math.max(open, close) + Math.random() * open * volatility * 0.5
          const low = Math.max(0.01, Math.min(open, close) - Math.random() * open * volatility * 0.5)
          const volume = Math.floor(Math.random() * 1000000) + 100000

          // Calculate moving averages safely
          let ma20: number | undefined
          let ma50: number | undefined
          
          if (i >= 20 && dataPoints.length >= 20) {
            const last20 = dataPoints.slice(-20)
            ma20 = last20.reduce((sum, d) => sum + d.close, 0) / 20
          }
          
          if (i >= 50 && dataPoints.length >= 50) {
            const last50 = dataPoints.slice(-50)
            ma50 = last50.reduce((sum, d) => sum + d.close, 0) / 50
          }

          // Calculate RSI safely
          let rsi: number | undefined
          if (i >= 14 && dataPoints.length >= 14) {
            const gains: number[] = []
            const losses: number[] = []
            const recent = dataPoints.slice(-14)
            
            for (let j = 1; j < recent.length; j++) {
              const diff = recent[j].close - recent[j - 1].close
              if (diff > 0) gains.push(diff)
              else losses.push(Math.abs(diff))
            }
            
            const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0
            const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
            rsi = 100 - (100 / (1 + rs))
          }

          dataPoints.push({
            time: time.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              ...(timeframe === '1d' && { month: 'short', day: 'numeric' })
            }),
            open: parseFloat(open.toFixed(crypto.symbol === 'BTC' ? 2 : 4)),
            high: parseFloat(high.toFixed(crypto.symbol === 'BTC' ? 2 : 4)),
            low: parseFloat(low.toFixed(crypto.symbol === 'BTC' ? 2 : 4)),
            close: parseFloat(close.toFixed(crypto.symbol === 'BTC' ? 2 : 4)),
            volume,
            ma20: ma20 ? parseFloat(ma20.toFixed(crypto.symbol === 'BTC' ? 2 : 4)) : undefined,
            ma50: ma50 ? parseFloat(ma50.toFixed(crypto.symbol === 'BTC' ? 2 : 4)) : undefined,
            rsi: rsi ? parseFloat(rsi.toFixed(2)) : undefined
          })

          basePrice = close
        }

        return dataPoints
      } catch (error) {
        console.error('Error generating candlestick data:', error)
        return []
      }
    }

    const loadData = () => {
      setLoading(true)
      const newData = generateCandlestickData()
      setData(newData)
      setLoading(false)
    }

    loadData()

    // Subscribe to real-time updates
    const unsubscribe = cryptoDataService.subscribeToCryptoUpdates(() => {
      loadData()
    })

    return unsubscribe
  }, [symbol, timeframe])

  // Custom candlestick shape with error handling
  const Candlestick = (props: any) => {
    try {
      const { x, y, width, height, payload } = props
      const { open, close, high, low } = payload
      
      // Prevent division by zero and invalid data
      if (!high || !low || high === low || !open || !close) {
        return null
      }
      
      const isGreen = close > open
      const color = isGreen ? '#10b981' : '#ef4444'
      const priceRange = high - low
      const bodyHeight = priceRange > 0 ? Math.abs(close - open) * (height / priceRange) : 1
      const bodyY = priceRange > 0 ? y + (Math.max(open, close) - low) * (height / priceRange) : y + height / 2

      return (
        <g>
          {/* High-Low Line */}
          <line
            x1={x + width / 2}
            y1={y}
            x2={x + width / 2}
            y2={y + height}
            stroke={color}
            strokeWidth={1}
          />
          {/* Body */}
          <rect
            x={x + width * 0.2}
            y={bodyY}
            width={width * 0.6}
            height={bodyHeight || 1}
            fill={color}
            stroke={color}
          />
        </g>
      )
    } catch (error) {
      console.error('Error rendering candlestick:', error)
      return null
    }
  }

  // Custom tooltip with error handling
  const CustomTooltip = ({ active, payload }: any) => {
    try {
      if (active && payload && payload.length) {
        const data = payload[0].payload
        const isGreen = data.close > data.open
        
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">{data.time}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Open:</span>
                <span className={`ml-1 font-medium ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                  ${data.open}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Close:</span>
                <span className={`ml-1 font-medium ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                  ${data.close}
                </span>
              </div>
              <div>
                <span className="text-gray-500">High:</span>
                <span className="ml-1 font-medium text-gray-900">${data.high}</span>
              </div>
              <div>
                <span className="text-gray-500">Low:</span>
                <span className="ml-1 font-medium text-gray-900">${data.low}</span>
              </div>
              <div>
                <span className="text-gray-500">Volume:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {(data.volume / 1000000).toFixed(2)}M
                </span>
              </div>
              {data.ma20 && (
                <div>
                  <span className="text-gray-500">MA20:</span>
                  <span className="ml-1 font-medium text-blue-600">${data.ma20}</span>
                </div>
              )}
              {data.ma50 && (
                <div>
                  <span className="text-gray-500">MA50:</span>
                  <span className="ml-1 font-medium text-purple-600">${data.ma50}</span>
                </div>
              )}
              {data.rsi && (
                <div>
                  <span className="text-gray-500">RSI:</span>
                  <span className={`ml-1 font-medium ${
                    data.rsi > 70 ? 'text-red-600' : 
                    data.rsi < 30 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {data.rsi}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      }
    } catch (error) {
      console.error('Error rendering tooltip:', error)
    }
    return null
  }

  if (loading || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">
          {loading ? 'Loading chart data...' : 'No data available'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Candlestick Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {symbol} - {timeframe.toUpperCase()}
          </h3>
          <div className="flex items-center space-x-2">
            {data.length > 0 && (
              <span className={`text-sm font-medium ${
                data[data.length - 1].close > data[data.length - 1].open 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                ${data[data.length - 1].close}
              </span>
            )}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />

            {/* Candlesticks */}
            <Bar dataKey="high" fill="transparent" shape={<Candlestick />} />

            {/* Moving Averages */}
            {showMA && (
              <>
                <Line type="monotone" dataKey="ma20" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ma50" stroke="#10B981" strokeWidth={2} dot={false} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {showVolume && (
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Volume</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (window.innerWidth < 640) {
                    return value.split(':')[0] + ':' + value.split(':')[1];
                  }
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="volume" fill="#6B7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI Chart */}
      {showRSI && (
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">RSI (14)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (window.innerWidth < 640) {
                    return value.split(':')[0] + ':' + value.split(':')[1];
                  }
                  return value;
                }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="rsi" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              {/* RSI levels */}
              <Line type="monotone" dataKey={() => 70} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey={() => 30} stroke="#10B981" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-1 sm:w-4 sm:h-1 bg-blue-500"></div>
            <span>MA20</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-1 sm:w-4 sm:h-1 bg-green-500"></div>
            <span>MA50</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-1 sm:w-4 sm:h-1 bg-purple-500"></div>
            <span>RSI</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-1 sm:w-4 sm:h-1 bg-gray-500"></div>
            <span>Volume</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandlestickChartFixed;
