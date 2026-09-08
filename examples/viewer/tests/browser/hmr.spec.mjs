import { test, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import moonbit from 'vite-plugin-moonbit';

test('MoonBit dependency edits rebuild and reload a Vite workspace repeatedly', async ({ page }) => {
  const root = await mkdtemp(join(tmpdir(), 'three-mbt-hmr-'));
  let server;
  const source = join(root, 'value/src/value.mbt');
  const valueSource = value => `pub fn current() -> Int { ${value} }\n`;
  try {
    await mkdir(join(root, 'value/src'), { recursive: true });
    await mkdir(join(root, 'app/src'), { recursive: true });
    await writeFile(join(root, 'moon.work'), 'members = ["value", "app"]\n');
    await writeFile(join(root, 'value/moon.mod'), 'name = "hmr/value"\nversion = "0.1.0"\nsource = "src"\npreferred_target = "js"\n');
    await writeFile(join(root, 'value/src/moon.pkg'), 'supported_targets = "js"\n');
    await writeFile(source, valueSource(1));
    await writeFile(join(root, 'app/moon.mod'), 'name = "hmr/app"\nsource = "src"\npreferred_target = "js"\nimport { "hmr/value@0.1.0" }\n');
    await writeFile(join(root, 'app/src/moon.pkg'), 'import { "hmr/value" }\nsupported_targets = "js"\npkgtype(kind: "executable")\noptions(link: { "js": { "exports": ["current"], "format": "esm" } })\n');
    await writeFile(join(root, 'app/src/main.mbt'), 'pub fn current() -> Int { @value.current() }\nfn main {}\n');
    await writeFile(join(root, 'index.html'), '<!doctype html><output id="value"></output><script type="module" src="/main.js"></script>');
    await writeFile(join(root, 'main.js'), 'import { current } from "mbt:hmr/app"; document.querySelector("#value").textContent = current();');
    execFileSync('moon', ['build', '--target', 'js', '--release'], { cwd: root, stdio: 'pipe' });
    server = await createServer({ configFile: false, root, plugins: [moonbit({ root, target: 'js', showLogs: false })], server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
    await server.listen();
    const port = server.httpServer.address().port;
    await page.goto(`http://127.0.0.1:${port}`);
    await expect(page.locator('#value')).toHaveText('1');
    for (const value of [2, 3]) {
      await writeFile(source, valueSource(value));
      await expect(page.locator('#value')).toHaveText(String(value), { timeout: 20000 });
    }
  } finally {
    await server?.close();
    await rm(root, { recursive: true, force: true });
  }
});
