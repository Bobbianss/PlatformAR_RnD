// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    base:'/PlatformAR_RnD/',
    rollupOptions:{
      external: ['public/libs/*'], // specifica il file da escludere dalla build
    },
  },
});
