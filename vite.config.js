import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs (e.g. 192.168.x.x) so iPhone/Android can connect
    port: 5173,
  },
})

