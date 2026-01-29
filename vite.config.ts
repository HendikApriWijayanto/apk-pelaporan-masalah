import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';  // Import plugin PWA

export default defineConfig({
  plugins: [
    // Plugin lainnya kalau ada (misal React atau Vue)
    VitePWA({
      registerType: 'autoUpdate',  // Auto-update service worker
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],  // File yang mau di-cache
      },
      manifest: {
        name: 'Laporan Kelurahan',  // Nama app di home screen
        short_name: 'Laporan',
        description: 'Aplikasi laporan pengaduan kelurahan',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',  // Mode standalone (kayak app native)
        icons: [
          {
            src: 'icon-192.png',  // Icon 192x192 (buat di folder public/)
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',  // Icon 512x512
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  // Konfigurasi lainnya (misal build, server)
});