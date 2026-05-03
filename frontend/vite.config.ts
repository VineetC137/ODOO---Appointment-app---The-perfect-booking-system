import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    strictPort: false, // auto-increment if 4000 is taken
    host: true,        // expose on all interfaces
    open: false,
  },
})
