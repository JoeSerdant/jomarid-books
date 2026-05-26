import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Vercel hledá výsledky buildu v této složce
  },
  server: {
    port: 3000,
  },
});
