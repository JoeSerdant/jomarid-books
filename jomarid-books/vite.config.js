import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  // 🔥 Esbuild nastavení pro vývojové prostředí (dev)
  esbuild: {
    keepNames: true,
  },
  build: {
    outDir: 'dist',
    // 🔥 Použijeme Terser, který umí stoprocentně zachovat názvy komponent pro odznáčky
    minify: 'terser',
    terserOptions: {
      keep_classnames: true,
      keep_fnames: true,
    },
    // Vypneme sourcemapy, což dramaticky zrychlí build na Vercelu a ušetří paměť
    sourcemap: false,
    // Zvýšíme limit pro varování o velikosti chunků, aby build nepanikařil
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 3000,
  },
});
