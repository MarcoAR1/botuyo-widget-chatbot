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
      filename: './dist/stats-umd.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  
  build: {
    emptyOutDir: false, // Don't empty dist, as we run this AFTER ES build
    lib: {
      entry: resolve(__dirname, 'standalone.tsx'),
      name: 'BotUyoChat',
      formats: ['umd'],
      fileName: () => 'botuyo-chat.umd.js',
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
        assetFileNames: 'botuyo-chat.umd.[ext]',
        // NO manualChunks for UMD
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep logs for debugging in this specific build if needed, or set to false
        drop_debugger: true,
      },
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
