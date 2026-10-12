import { defineConfig } from 'vite';

// Relative base so the site works on any GitHub Pages path.
export default defineConfig({ base: './', build: { target: 'es2022' } });
