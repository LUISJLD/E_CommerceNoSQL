import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function readApiId(): string {
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8')
    const match = envFile.match(/VITE_API_ID=(.+)/)
    return match ? match[1].trim() : 'pending'
  } catch {
    return 'pending'
  }
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4566',
        changeOrigin: true,
        rewrite: (path) => {
          const apiId = readApiId()
          return path.replace(/^\/api/, `/restapis/${apiId}/prod/_user_request_`)
        },
      },
    },
  },
})
