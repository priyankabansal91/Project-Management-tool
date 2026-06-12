import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // State management + data fetching
          'vendor-state': ['zustand', '@tanstack/react-query', 'axios'],
          // UI components (Radix UI primitives)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          // Charts
          'vendor-charts': ['recharts'],
          // Date utilities + icons + styling
          'vendor-utils': ['date-fns', 'lucide-react', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          // Form libraries
          'vendor-forms': ['react-hook-form'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
