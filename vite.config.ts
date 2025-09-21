import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Default to DB mode true if not set via .env
        'import.meta.env.VITE_USE_DB': JSON.stringify(env.VITE_USE_DB ?? 'true')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/.netlify/functions': {
            target: 'http://localhost:8787',
            changeOrigin: true,
          },
        },
      },
    };
});
