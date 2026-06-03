import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // 🔥 Tohle natvrdo zakáže Babelu i esbuildu přejmenovávat tvoje komponenty a funkce
      babel: {
        plugins: [],
      },
    }),
  ],
  esbuild: {
    keepNames: true,
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
});
