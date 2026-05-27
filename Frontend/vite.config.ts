import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4566/restapis',
        changeOrigin: true,
        rewrite: (path) => {
          // Lee el ID real del API Gateway desde env o archivo
          const apiId = process.env.VITE_API_ID || 'PLACEHOLDER'
          return path.replace(/^\/api/, `/${apiId}/prod/_user_request_`)
        },
      },
    },
  },
})