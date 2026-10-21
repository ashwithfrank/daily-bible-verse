/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spaFallback } from './vite-plugins/spa-fallback';

// GitHub Pages project site: https://ashwithfrank.github.io/daily-bible-verse/
// This is the single source of truth for the base path. It is exposed to the app as
// import.meta.env.BASE_URL, and spaFallback() derives its 404.html from it.
const base = '/daily-bible-verse/';

export default defineConfig({
  base,
  plugins: [react(), spaFallback(base)],
  build: { sourcemap: false, target: 'es2020' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
