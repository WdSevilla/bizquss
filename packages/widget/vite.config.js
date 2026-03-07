import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/remarq-widget.js',
      name: 'RemarqWidget',
      fileName: 'widget',
      formats: ['es', 'iife'],
    },
    rollupOptions: {
      // Sin dependencias externas — el widget es auto-contenido
      external: [],
    },
  },
})
