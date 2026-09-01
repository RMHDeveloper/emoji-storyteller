import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');

    // GitHub Pages serves from /emoji-storyteller/; Vercel/Netlify/custom domains
    // serve from the root. Vercel sets VERCEL=1 automatically. Override either way
    // with an explicit BASE_PATH. Dev server always stays at '/'.
    const buildBase =
      process.env.BASE_PATH ?? (process.env.VERCEL ? '/' : '/emoji-storyteller/');

    return {
      base: command === 'build' ? buildBase : '/',
      server: {
        port: 3001,
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
