import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let moduleUrl;
test.beforeAll(async () => {
  const { outputFiles } = await build({ entryPoints: [resolve('_build/js/release/build/mizchi/three-viewer/pbr/pbr.js')], bundle: true, platform: 'browser', format: 'esm', write: false });
  moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
});

test('HDR URL loading and PMREM illuminate a material without lights', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const hdr = await readFile(new URL('../../../../tests/fixtures/studio.hdr', import.meta.url));
  await page.route('http://pbr.test/studio.hdr', route => route.fulfill({ body: hdr, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/octet-stream' }));
  const result = await page.evaluate(async url => {
    const module = await import(url);
    return Array.from(await module.render_environment('http://pbr.test/studio.hdr'));
  }, moduleUrl);
  expect(result.slice(0, 3)).toEqual([0, 0, 0]);
  expect(result[3]).toBeGreaterThan(20);
  expect(result[3]).toBeGreaterThan(result[4]);
  expect(result[4]).toBeGreaterThan(result[5]);
  expect(result[6]).toBeGreaterThan(0);
  expect(result[7]).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('loaded PhysicalMaterial switches shader paths when transmission changes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const glb = await readFile(new URL('../../../../tests/fixtures/physical.glb', import.meta.url));
  await page.route('http://pbr.test/physical.glb', route => route.fulfill({ body: glb, headers: { 'access-control-allow-origin': '*' }, contentType: 'model/gltf-binary' }));
  const result = await page.evaluate(async url => {
    const module = await import(url);
    return Array.from(await module.render_transmission('http://pbr.test/physical.glb'));
  }, moduleUrl);
  expect(result.slice(0, 3)).toEqual([0, 0, 0]);
  expect(result[3]).toBe(0);
  expect(result[4]).toBe(0);
  expect(result[5]).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
