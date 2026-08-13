import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || 'app.chatuzpark.store')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean)

const host = process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORT || 5173)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port,
    allowedHosts,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
  },
})
