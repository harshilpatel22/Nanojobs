import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunks for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'http-vendor': ['axios'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        }
      }
    },
    // Increase chunk size warning limit for images and assets
    chunkSizeWarningLimit: 1000
  },

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
    }
  },

  // CSS configuration
  css: {
    modules: {
      // CSS Modules configuration
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      css: {
        // Make CSS variables available globally
        additionalData: `@import "@styles/variables.css";`
      }
    }
  },

  // Environment variables
  define: {
    // Make environment variables available in the app
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // Optimization for mobile devices (Indian market focus)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react'
    ],
    // Pre-bundle dependencies for faster loading
    force: true
  },

  // Asset handling
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf'],

  // Development-specific settings
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  // PWA and performance optimizations
  experimental: {
    buildAdvancedBaseOptions: true
  }
})