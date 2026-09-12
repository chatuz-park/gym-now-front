import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || 'app.chatuzpark.store')
  .split(',')
  .map((h: string) => h.trim())
  .filter(Boolean)

const host = process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORT || 5173)
const analyze = process.env.ANALYZE === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(analyze
      ? [
          visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react-dom|react-router|scheduler)[\\/]|node_modules[\\/]react[\\/]/,
              priority: 30,
            },
            {
              name: 'http',
              test: /node_modules[\\/]axios[\\/]/,
              priority: 20,
            },
            {
              name: 'forms',
              test: /node_modules[\\/](formik|yup)[\\/]/,
              priority: 20,
            },
            {
              name: 'charts',
              test: /node_modules[\\/]recharts[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  server: {
    host,
    port,
    allowedHosts,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
  },
})
