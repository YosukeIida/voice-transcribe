import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import preact from '@preact/preset-vite';
import manifest from './src/manifest';

export default defineConfig({
  plugins: [
    preact(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@background': '/src/background',
      '@content': '/src/content',
      '@popup': '/src/popup',
      '@shared': '/src/shared',
    },
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    hmr: {
      host: 'localhost',
    },
  },
});