import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/localstack': {
        target: 'http://localstack:4566',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/localstack/, ''),
      },
      '/api': {
        target: 'http://localstack:4566/restapis',
        changeOrigin: true,
        rewrite: (path) => {
          const apiId = process.env.VITE_API_ID || 'ecommerce123'
          return path.replace(/^\/api/, `/${apiId}/prod/_user_request_`)
        },
      },
    },
  },
})
