// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    base:'./',
    rollupOptions: {
      external: ['public/libs/loader.js'], // specifica il file da escludere dalla build
    },
  },
});
