import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/renderer',
  base: './',
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  build: {
    outDir: resolve('out/renderer'),
    emptyOutDir: true
  },
  plugins: [react()]
})
