import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    // Define environment variables for production build
    __APP_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
    __API_BASE_URL__: JSON.stringify(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3003')
  }
})
