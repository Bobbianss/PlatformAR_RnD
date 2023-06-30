// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig({
  base:'/PlatformAR_RnD/',
  build: {
    rollupOptions:{
      external: ['public/libs/*'], // specifica il file da escludere dalla build
    },
  },
});
