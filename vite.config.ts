import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://akademikmqbaisykarima.pages.dev',
        changeOrigin: true,
      },
    },
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? undefined : {},
    // Izinkan semua host agar Railway dan domain lainnya bisa diakses
    allowedHosts: true,
  },
});
