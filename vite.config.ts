import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `BASE_PATH` est injecté par le workflow GitHub Pages (`/<repo>/`).
// En local il reste à la racine.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte(), basicSsl()],
  server: { host: true, port: 5173 },
  build: { target: 'es2022' },
});
