import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api/v1/finance': { target: process.env.DASHBOARD_BACKEND_ORIGIN || 'http://127.0.0.1:8000', changeOrigin: false },
      '/admin': { target: process.env.DASHBOARD_BACKEND_ORIGIN || 'http://127.0.0.1:8000', changeOrigin: false },
      '/static/admin': { target: process.env.DASHBOARD_BACKEND_ORIGIN || 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
})
