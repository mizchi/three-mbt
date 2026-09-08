import { defineConfig } from 'vite';
import moonbit from 'vite-plugin-moonbit';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('./web', import.meta.url)),
  base: './',
  plugins: [moonbit({ root: workspace, target: 'js' })],
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: {
    outDir: fileURLToPath(new URL('../../_build/mouse-site', import.meta.url)),
    emptyOutDir: true,
    target: 'esnext',
  },
});
