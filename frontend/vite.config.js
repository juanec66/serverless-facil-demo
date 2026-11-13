import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Solo en desarrollo: /api/* va a la misma Lambda emulada localmente.
    proxy: {
      '/api': 'http://127.0.0.1:3000'
    }
  }
});
