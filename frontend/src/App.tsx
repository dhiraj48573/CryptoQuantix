import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './components/pages/HomePage'
import AboutPage from './components/pages/AboutPage'
import ContactPage from './components/pages/ContactPage'
import NewsPage from './components/pages/NewsPage'
import LoginPage from './components/pages/LoginPage'
import SignupPage from './components/pages/SignupPage'
import DashboardPortfolioPage from './components/pages/DashboardPortfolioPage'
import TradingChartsPage from './components/pages/TradingChartsPage'
import EnhancedCorrelationDashboard from './components/pages/EnhancedCorrelationDashboard'
import PaperTradingPage from './components/pages/PaperTradingPage'
import ProtectedRoute from './components/ProtectedRoute'
import { authService } from './services/authService'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        <main className="flex-grow w-full">
          <Routes>
            {/* Public Routes - Accessible without authentication */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Protected Routes - Require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPortfolioPage />
              </ProtectedRoute>
            } />
            <Route path="/trade" element={
              <ProtectedRoute>
                <TradingChartsPage />
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <DashboardPortfolioPage />
              </ProtectedRoute>
            } />
            <Route path="/correlations" element={
              <ProtectedRoute>
                <EnhancedCorrelationDashboard />
              </ProtectedRoute>
            } />
            <Route path="/charts" element={
              <ProtectedRoute>
                <TradingChartsPage />
              </ProtectedRoute>
            } />
            <Route path="/paper-trading" element={
              <ProtectedRoute>
                <PaperTradingPage />
              </ProtectedRoute>
            } />
            
            {/* Redirect authenticated users from login/signup to dashboard */}
            <Route path="/login" element={
              authService.isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } />
            <Route path="/signup" element={
              authService.isAuthenticated() ? <Navigate to="/dashboard" replace /> : <SignupPage />
            } />
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  )
}

export default App
