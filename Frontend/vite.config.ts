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
      '/localstack': {
        target: process.env.VITE_LOCALSTACK_HOST || 'http://localhost:4566',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/localstack/, ''),
      },
    },
  },
})