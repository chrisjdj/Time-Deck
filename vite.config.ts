import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Time-Deck — Clocks, Timers & World Time',
        short_name: 'Time-Deck',
        description: 'Full-screen clocks, countdowns, stopwatch, world clocks, presenter and exam timers. Works offline.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0b0d14',
        theme_color: '#0b0d14',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    sourcemap: false,
    target: 'es2022',
  },
});
