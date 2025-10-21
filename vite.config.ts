import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'lucide': ['lucide'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
  },

  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    strictPort: false,
  },

  preview: {
    port: 4173,
    host: true,
    open: true,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@types': resolve(__dirname, './src/types'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },

  optimizeDeps: {
    include: [],
    exclude: [],
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
