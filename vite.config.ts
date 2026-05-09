import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ahram-store/',
  server: { host: '0.0.0.0', port: 4173 },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022'
  }
});
