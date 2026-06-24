import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Laundry Modern Multi-Role',
          short_name: 'Laundry Modern',
          description: 'Aplikasi laundry modern berbasis web multi-role dengan tracking publik tanpa login, manajemen order, invoice, cetak struk, dan integrasi Firebase.',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          prefer_related_applications: false,
          icons: [
            {
              src: '/laundry_logo.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any'
            },
            {
              src: '/laundry_logo.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'maskable'
            },
            {
              src: '/laundry_logo.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any'
            },
            {
              src: '/laundry_logo.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
          navigateFallback: '/index.html'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
