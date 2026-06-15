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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('three') || id.includes('@react-three')) return 'three'
          if (id.includes('d3')) return 'd3'
          if (id.includes('shiki') || id.includes('katex')) return 'markdown'
          if (id.includes('@ai-sdk/')) return 'ai-sdk-providers'
          if (id.includes('@google/genai')) return 'live-assistant'
          if (id.includes('recharts')) return 'charts'
          if (id.includes('framer-motion') || id.includes('motion/')) return 'motion'
          if (id.includes('@radix-ui')) return 'radix'
        },
      },
    },
  },
})
