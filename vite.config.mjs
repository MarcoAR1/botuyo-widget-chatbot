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
      formats: ['es'], // ES module format for modern browsers with code splitting
      fileName: () => 'botuyo-chat.js',
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
        assetFileNames: 'botuyo-chat.[ext]',
        // Manual chunks for code splitting
        manualChunks: (id) => {
          // React vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // Socket.IO chunk (lazy loaded)
          if (id.includes('node_modules/socket.io-client') || id.includes('engine.io-client')) {
            return 'vendor-socket';
          }
          
          // Features chunk (Gallery, AudioPlayer - lazy loaded)
          if (id.includes('/components/Gallery') || id.includes('/components/AudioPlayer')) {
            return 'chunk-features';
          }
          
          // Chat UI chunk (main chat interface)
          if (id.includes('/components/ChatWindow') || 
              id.includes('/components/MessageList') ||
              id.includes('/components/InputArea')) {
            return 'chunk-chat-ui';
          }
        },
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
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
