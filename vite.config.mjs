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
  
  // Replace process.env for browser compatibility
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  
  build: {
    lib: {
      entry: resolve(__dirname, 'standalone.tsx'),
      name: 'BotUyoChat',
      formats: ['es'], // ES module format only
      fileName: () => 'botuyo-chat.es.js',
    },
    cssCodeSplit: false, // CSS inlined in JS via ?inline import
    rollupOptions: {
      // Externalize React + Three.js for npm consumers (they provide their own)
      // Use function to catch deep imports like react-dom/cjs/... or three/examples/jsm/...
      external: (id) => {
        // React family
        if (/^react($|\/)/.test(id) || /^react-dom($|\/)/.test(id)) return true
        // Three.js family — externalize to avoid 1MB+ Avatar3D chunk duplication issues
        if (/^three($|\/)/.test(id)) return true
        if (id.startsWith('@react-three/')) return true
        if (id.startsWith('@pixiv/three-vrm')) return true
        return false
      },
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        exports: 'named',
        assetFileNames: 'botuyo-chat.[ext]',
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
