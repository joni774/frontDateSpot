import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Cloudflare quick tunnels (Stitch / public preview)
    allowedHosts: [".trycloudflare.com"],
  },
})
