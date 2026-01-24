import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'standalone.tsx'),
      name: 'PaseoLibreChat',
      formats: ['iife'], // Solo IIFE para CDN
      fileName: () => 'paseo-libre-chat.js',
    },
    rollupOptions: {
      // Externalize dependencies that are too large
      // For standalone, we bundle everything
      external: [],
      output: {
        globals: {},
        // Evita la advertencia por usar default + named exports en el entry
        exports: 'named',
        // Inline all assets
        assetFileNames: 'paseo-libre-chat.[ext]',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    // Reduce bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console.* calls in production
        drop_debugger: true,
      },
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'next-intl': resolve(__dirname, './src/chat-widget/i18n/useTranslations.ts'),
    },
  },

  // For development
  server: {
    port: 3001,
    open: '/index.html',
  },

  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client'],
  },
});
