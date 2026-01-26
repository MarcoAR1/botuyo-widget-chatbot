import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'standalone.tsx'),
      name: 'BotUyoChat',
      formats: ['iife'],
      fileName: () => 'botuyo-chat.js',
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
        assetFileNames: 'botuyo-chat.[ext]',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5173,
    open: true,
  },
})
