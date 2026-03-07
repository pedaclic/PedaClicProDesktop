import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // CRITIQUE : './' obligatoire pour Electron (protocole file://)
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, strictPort: true },
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
});