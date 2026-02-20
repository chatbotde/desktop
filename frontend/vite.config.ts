import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for assets
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Allow Vite to automatically use a different free port if 5173 is busy
    strictPort: false,
    proxy: {
      '/api/tts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/tts'),
      },
    },
  },
  // Load environment variables from both current directory and parent directory
  envDir: path.resolve(__dirname, '..'),
})
