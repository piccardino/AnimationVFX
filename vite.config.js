import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the same bundle works both at web.app root and on
  // GitHub Pages project subpaths (/AnimationVFX/)
  base: './',
  build: {
    outDir: 'dist',
  },
})

