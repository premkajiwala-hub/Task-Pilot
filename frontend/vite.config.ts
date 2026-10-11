import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // No precaching for this app.
      //
      // TaskPilot is served from 127.0.0.1 by its own backend. A precache buys
      // nothing — if the engine isn't running there is no API to talk to, so a
      // cached shell is a broken app either way — while costing a real and
      // recurring hazard: the worker keeps answering with the previous build.
      // That is what left http://localhost:3000 blank, and it also served a
      // stale bundle after a rebuild here.
      //
      // `selfDestroying` still emits a worker, but one that unregisters itself
      // and empties its caches. That is deliberate: simply dropping the plugin
      // would leave already-registered workers in place forever, still serving
      // whatever they cached. This evicts them on next load, then gets out of
      // the way. Revisit only if genuine offline use is ever needed.
      selfDestroying: true,

      devOptions: {
        enabled: false,
        type: 'module'
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TaskPilot',
        short_name: 'TaskPilot',
        description: 'Local-first premium responsive task management system',
        theme_color: '#0d1218',
        background_color: '#0d1218',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    // The app calls /api/... relatively; in dev that has to reach FastAPI.
    // 127.0.0.1 rather than localhost: uvicorn binds IPv4, and localhost
    // resolves to ::1 first on Windows.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
