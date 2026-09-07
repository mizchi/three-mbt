import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const entry = resolve('_build/js/release/build/examples/scene_graph/scene_graph.js');

test('generated ESM executes in Node.js', async () => {
  const module = await import(pathToFileURL(entry).href);
  expect(Array.from(module.world_position())).toEqual([12, 4, 6]);
});

test('bundled ESM executes in a browser without Node.js globals', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { outputFiles } = await build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'esm', write: false,
  });
  const url = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
  const position = await page.evaluate(async moduleUrl => {
    const module = await import(moduleUrl);
    return Array.from(module.world_position());
  }, url);
  expect(position).toEqual([12, 4, 6]);
  expect(errors).toEqual([]);
});
