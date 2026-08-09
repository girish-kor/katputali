import { defineConfig } from 'vite';

// index.html lives at the project root (standard Vite convention), not /public — see
// ARCHITECTURE §2's note on why. /public holds only true static passthrough files (style.css,
// favicon), served at '/' via Vite's default publicDir in both dev and build.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
