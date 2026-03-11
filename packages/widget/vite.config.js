import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/bizquss-widget.js',
      name: 'BizqussWidget',
      // IIFE → bizquss.min.js (para <script src="...">)
      // ES  → bizquss.esm.js  (para import / bundlers)
      fileName: (format) => format === 'iife' ? 'bizquss.min.js' : 'bizquss.esm.js',
      formats: ['iife', 'es'],
    },
    rollupOptions: {
      // Sin dependencias externas — el widget es auto-contenido
      external: [],
    },
  },
})
