import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // En desarrollo, el proxy redirige las llamadas /v1 al servidor API
      '/v1': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
