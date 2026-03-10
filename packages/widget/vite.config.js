import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/remarq-widget.js',
      name: 'RemarqWidget',
      // IIFE → remarq.min.js (para <script src="...">)
      // ES  → remarq.esm.js  (para import / bundlers)
      fileName: (format) => format === 'iife' ? 'remarq.min.js' : 'remarq.esm.js',
      formats: ['iife', 'es'],
    },
    rollupOptions: {
      // Sin dependencias externas — el widget es auto-contenido
      external: [],
    },
  },
})
