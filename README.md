# Trade with Dhiru - Professional Trading Platform

A comprehensive real-time trading platform supporting both stocks and cryptocurrencies with advanced portfolio management, multiple configuration support, and professional-grade trading features.

## 🏗️ Project Structure

```
Trade_with_Dhiru/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── pages/     # Page components (Dashboard, Trading, etc.)
│   │   │   ├── charts/    # Chart components
│   │   │   └── common/    # Shared components
│   │   ├── services/      # API and data services
│   │   │   ├── portfolioService.ts    # Portfolio management
│   │   │   ├── cryptoDataService.ts  # Crypto data service
│   │   │   ├── marketDataService.ts  # Stock data service
│   │   │   └── authService.ts        # Authentication service
│   │   ├── main.tsx       # App entry point
│   │   └── App.tsx        # Main app component
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── .env                # Environment variables
├── backend/                  # Node.js backend server
│   ├── server.js             # Express server entry point
│   ├── package.json          # Backend dependencies
│   └── .env                 # Backend environment variables
├── docs/                     # Documentation and reports
│   ├── REAL_TRADING_IMPLEMENTATION_REPORT.md
│   ├── PORTFOLIO_CONFIGURATION_IMPLEMENTATION_REPORT.md
│   ├── ERROR_FIX_REPORT.md
│   └── ENHANCEMENT_SUMMARY.md
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd CryptoQuantix
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

### Running the Application

1. **Start backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on: `http://localhost:3001`

2. **Start frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on: `http://localhost:5174`

## 🔧 Features

### 🚀 Core Trading Features
- **Real Trading Platform**: Professional buy/sell operations with real-time portfolio updates
- **Multi-Asset Support**: Trade both stocks (AAPL, GOOGL, MSFT, etc.) and cryptocurrencies (BTC, ETH, etc.)
- **Portfolio Configuration Management**: Multiple portfolio configurations (Conservative, Moderate, Aggressive)
- **Asset Transfer System**: Transfer assets between different portfolio configurations
- **Real-time Portfolio Updates**: Instant portfolio value and cash balance updates
- **Professional Order Execution**: Market and limit orders with confirmation dialogs
- **Transaction History**: Complete trade history with detailed information

### 🎨 Frontend Features
- **Modern React UI** with TypeScript and Vite
- **Responsive Design** with Tailwind CSS
- **Real-time Updates** via WebSocket connections
- **Authentication System** with JWT tokens and user profiles
- **Advanced Trading Interface** with buy/sell orders and order status
- **Portfolio Management** with P&L tracking and position management
- **Interactive Charts** with technical indicators and candlestick charts
- **Correlation Analysis** between BTC and altcoins
- **Algorithm Testing** with backtesting capabilities
- **Performance Analytics** with comprehensive trading statistics
- **Mobile Responsive** design with professional UI/UX
- **Error Handling** with comprehensive null checks and validation

### 🔧 Backend Features
- **RESTful API** with Express.js
- **Real-time WebSocket** for price updates and notifications
- **JWT Authentication** with bcrypt password hashing
- **Advanced Portfolio Management** with multi-configuration support
- **Multi-Asset Data** for both stocks and cryptocurrencies
- **Asset Transfer Engine** for portfolio configuration management
- **CORS Configuration** for frontend integration
- **Comprehensive Error Handling** and input validation
- **Health Check** endpoints for monitoring

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Cryptocurrency Data
- `GET /api/crypto/prices` - Get all crypto prices
- `GET /api/crypto/:symbol` - Get specific crypto data
- `WebSocket ws://localhost:3001` - Real-time price updates

### Stock Market Data
- `GET /api/stocks/prices` - Get all stock prices
- `GET /api/stocks/:symbol` - Get specific stock data
- `WebSocket ws://localhost:3001` - Real-time stock price updates

### Portfolio Management
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/trade` - Execute buy/sell orders
- `GET /api/portfolio/trades` - Get trade history
- `GET /api/portfolio/configs` - Get portfolio configurations
- `POST /api/portfolio/transfer` - Transfer assets between configurations
- `POST /api/portfolio/switch` - Switch active portfolio configuration

## 🛠️ Development Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start development server with nodemon
npm run start    # Start production server
```

## 🔒 Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### Backend (.env)
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5174
```

## 🎯 Supported Assets

### 📈 Stocks
- **Apple (AAPL)** - Technology giant
- **Alphabet (GOOGL)** - Search and advertising
- **Microsoft (MSFT)** - Software and cloud services
- **Amazon (AMZN)** - E-commerce and cloud computing
- **Tesla (TSLA)** - Electric vehicles and energy
- **Meta (META)** - Social media and metaverse
- **NVIDIA (NVDA)** - Graphics and AI chips
- **JPMorgan (JPM)** - Banking and financial services

### 🪙 Cryptocurrencies
- **Bitcoin (BTC)** - Market leader and digital gold
- **Ethereum (ETH)** - Smart contract platform
- **Binance Coin (BNB)** - Exchange token and DeFi hub
- **Solana (SOL)** - High-performance blockchain
- **Cardano (ADA)** - Proof-of-stake blockchain
- **Ripple (XRP)** - Digital payment protocol
- **Polkadot (DOT)** - Interoperability platform
- **Avalanche (AVAX)** - DeFi and smart contracts

## 📊 Real-time Features

- **Price Updates**: Every second with realistic volatility for both stocks and crypto
- **WebSocket Connection**: Automatic reconnection with retry logic
- **Portfolio Sync**: Real-time P&L calculations and position updates
- **Trading Signals**: Automated buy/sell recommendations with confidence scores
- **Correlation Analysis**: BTC vs altcoins correlation matrix
- **Order Status Updates**: Real-time order execution feedback
- **Portfolio Configuration Sync**: Instant updates across all portfolio configurations

## 🎛️ Portfolio Configuration Features

- **Multiple Configurations**: Conservative, Moderate, and Aggressive portfolio strategies
- **Risk Management**: Customizable stop-loss and take-profit percentages
- **Position Sizing**: Maximum position size limits per configuration
- **Asset Transfer**: Move assets between portfolio configurations
- **Independent Tracking**: Separate portfolio metrics for each configuration
- **Instant Switching**: Switch between configurations with one click
- **Cost Basis Preservation**: Accurate cost tracking during transfers

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for secure storage
- **CORS Protection**: Configured for frontend origin
- **Input Validation**: Request sanitization
- **Helmet Security**: HTTP security headers

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Toggle theme support
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Interactive Charts**: Hover and zoom functionality
- **Smooth Animations**: CSS transitions

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to hosting service
```

### Backend Deployment
```bash
cd backend
npm install --production
npm start
# Deploy with PM2 or Docker for production
```

## 📝 Technologies Used

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing with protected routes
- **Recharts** - Interactive data visualization and charts
- **Lucide React** - Modern icon library
- **Portfolio Service** - Advanced portfolio management system
- **Multi-Asset Services** - Unified stock and crypto data services

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **WebSocket** - Real-time communication for price updates
- **JWT** - Authentication tokens
- **bcrypt** - Secure password hashing
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-restart

### 🚀 Recent Implementations
- **Real Trading Platform**: Professional-grade trading functionality
- **Portfolio Configuration System**: Multi-portfolio management
- **Asset Transfer Engine**: Cross-configuration asset transfers
- **Error Handling**: Comprehensive null checks and validation
- **User Authentication**: JWT-based login/signup system
- **Real-time Updates**: WebSocket connections for live data
- **Multi-Asset Support**: Unified stock and cryptocurrency trading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API endpoints and implementation reports
- Check the error fix reports for troubleshooting

## 📚 Documentation

- **[Real Trading Implementation Report](docs/REAL_TRADING_IMPLEMENTATION_REPORT.md)** - Complete real trading platform implementation
- **[Portfolio Configuration Report](docs/PORTFOLIO_CONFIGURATION_IMPLEMENTATION_REPORT.md)** - Multi-portfolio management system
- **[Error Fix Report](docs/ERROR_FIX_REPORT.md)** - Comprehensive error handling and fixes
- **[Enhancement Summary](docs/ENHANCEMENT_SUMMARY.md)** - Overall project enhancements

## 🌐 Live Demo

**Access the trading platform at:** `http://localhost:5174`

### Key Pages
- **Dashboard**: `/dashboard` - Portfolio overview and analytics
- **Paper Trading**: `/paper-trading` - Real trading interface with portfolio configs
- **Trading Charts**: `/trading-charts` - Advanced charts and technical analysis
- **Correlation Analysis**: `/correlation` - BTC vs altcoins correlation matrix

---

**Trade with Dhiru** - Your comprehensive professional trading platform with real-time portfolio management and multi-configuration support.
#   C r y p t o Q u a n t i x  
 