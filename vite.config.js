import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasi Vite + plugin React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
