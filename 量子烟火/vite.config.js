import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_AMAP_KEY': JSON.stringify(process.env.VITE_AMAP_KEY || ''),
    'import.meta.env.VITE_AMAP_SECURITY_CODE': JSON.stringify(process.env.VITE_AMAP_SECURITY_CODE || ''),
  },
  server: {
    port: 5000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
