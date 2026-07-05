import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { jsonLdPlugin } from './scripts/json-ld-plugin.ts'

// Deployed to GitHub Pages under /resume/ — built output is committed to ../resume
export default defineConfig({
  base: '/resume/',
  plugins: [react(), tailwindcss(), jsonLdPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../resume',
    emptyOutDir: true,
  },
})
