import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_AMAP_KEY': JSON.stringify(process.env.VITE_AMAP_KEY || '014815678eb1b4a4bf6508bb84fd4b62'),
    'import.meta.env.VITE_AMAP_SECURITY_CODE': JSON.stringify(process.env.VITE_AMAP_SECURITY_CODE || '49afb19817ab68d0c4f8017e31f0a838'),
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
