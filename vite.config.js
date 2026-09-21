import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        // Keep the Vercel routes extension-free while mapping local development
        // requests to the existing PHP endpoints.
        rewrite: (path) => path.replace(/^\/api\/(.+)$/, '/tripeso_reward/api/$1.php'),
      },
    },
  },
})
