import { defineConfig } from 'vite'

export default defineConfig({
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    open: true, // Auto-open browser
  },

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    
    // Optimize for game assets
    rollupOptions: {
      output: {
        // Separate chunks for better caching
        manualChunks: {
          vendor: ['vite']
        }
      }
    },
    
    // Asset handling
    assetsInlineLimit: 4096, // Inline small assets
    
    // Target modern browsers for better performance
    target: 'es2020'
  },

  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.mp3', '**/*.wav', '**/*.ogg'],

  // Public directory for static assets
  publicDir: 'assets',

  // Optimizations
  optimizeDeps: {
    include: []
  },

  // CSS configuration
  css: {
    devSourcemap: true
  }
})