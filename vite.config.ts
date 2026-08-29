import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Production build is served from https://<user>.github.io/emoji-storyteller/
      // on GitHub Pages. Dev server stays at '/'. Override with BASE_PATH for
      // root deploys (Vercel/Netlify/custom domain).
      base: command === 'build' ? (process.env.BASE_PATH ?? '/emoji-storyteller/') : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
