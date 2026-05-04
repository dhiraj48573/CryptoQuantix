import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Send, TrendingUp, MessageCircle, Headphones, Globe } from 'lucide-react'

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real application, you would send the data to your backend
      console.log('Contact form submitted:', formData)
      
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setErrors({})
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="w-full px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 lg:mb-10">Contact Us</h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 lg:mb-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                Get in touch with our team for support, partnerships, or any questions about CryptoQuantix
              </p>
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Headphones className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16 lg:mb-20">
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Mail className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">Email</h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-1">support@cryptoquantix.com</p>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-500">24/7 Support</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Phone</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-1">9259534648</p>
                  <p className="text-sm sm:text-base text-gray-500">Mon-Fri 9AM-6PM EST</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Office</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-1">Jurs Country</p>
                  <p className="text-sm sm:text-base text-gray-500">Haridwar,Uttrakhand</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-1">Within 24 hours</p>
                  <p className="text-sm sm:text-base text-gray-500">Urgent: 2-4 hours</p>
                </div>
              </div>

              {/* Contact Form and Map */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                {/* Contact Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10">Send us a message</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`block w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base lg:text-lg ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Subject Field */}
                    <div>
                      <label htmlFor="subject" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className={`block w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                          errors.subject ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="How can we help you?"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div>
                      <label htmlFor="message" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className={`block w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none ${
                          errors.message ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Tell us more about your inquiry..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-lg shadow-sm text-sm sm:text-base lg:text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 md:w-1/2 lg:w-1/3 xl:w-1/4 2xl:w-1/5 mx-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        Thank you for your message! We'll get back to you within 24 hours.
                      </div>
                    )}
                    
                    {submitStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        Something went wrong. Please try again later.
                      </div>
                    )}
                  </form>
                </div>

                {/* Map and Additional Info */}
                <div className="space-y-6 sm:space-y-8">
                  {/* Map Placeholder */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Our Location</h3>
                    <div className="bg-gray-100 rounded-lg h-48 sm:h-64 flex items-center justify-center mb-4">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm sm:text-base text-gray-500">Interactive Map</p>
                        <p className="text-xs sm:text-sm text-gray-400">Jurs Counntry,Haridwar Uttrakhand</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm sm:text-base text-gray-600">
                      <p><strong>Address:</strong> Jurs Country</p>
                      <p><strong>City:</strong> Haridwar,Uttrakhand</p>
                      <p><strong>Country:</strong>India</p>
                    </div>
                  </div>

                  {/* FAQ Section */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">What is CryptoQuantix?</h4>
                        <p className="text-sm sm:text-base text-gray-600">
                          A cryptocurrency trading platform with advanced correlation analysis and algorithmic trading signals.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">How do I get started?</h4>
                        <p className="text-sm sm:text-base text-gray-600">
                          Sign up for a free account, get $100,000 virtual capital, and start trading immediately.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Is the platform really free?</h4>
                        <p className="text-sm sm:text-base text-gray-600">
                          Yes! All core features are free. We offer premium features for advanced users.
                        </p>
                      </div>
                      
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Connect With Us</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <a
                        href="#"
                        className="flex items-center justify-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">f</span>
                        </div>
                      </a>
                      <a
                        href="#"
                        className="flex items-center justify-center p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-sky-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">t</span>
                        </div>
                      </a>
                      <a
                        href="#"
                        className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">in</span>
                        </div>
                      </a>
                      <a
                        href="#"
                        className="flex items-center justify-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">yt</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ContactPage
