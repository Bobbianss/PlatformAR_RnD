// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['public'], // specifica il file da escludere dalla build
    },
  },
});
