import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor читает собранные файлы из dist/ и копирует их в нативный проект
  build: {
    outDir: 'dist',
  },
});
