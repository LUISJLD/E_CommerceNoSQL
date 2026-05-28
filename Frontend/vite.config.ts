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
        target: 'http://127.0.0.1:4566/restapis',
        changeOrigin: true,
        rewrite: (path) => {
          // Usamos el ID estático 'ecommerce123' que configuramos en lambda_stack.py
          const apiId = process.env.VITE_API_ID || 'ecommerce123'
          return path.replace(/^\/api/, `/${apiId}/prod/_user_request_`)
        },
      },
    },
  },
})