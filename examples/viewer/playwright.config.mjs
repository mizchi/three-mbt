import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: '../../test-results',
  fullyParallel: true,
  webServer: {
    command: 'pnpm exec vite --config examples/viewer/vite.config.mjs --port 4175',
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
  use: { browserName: 'chromium', headless: true },
});
