import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { resolve } from 'node:path';
// Full Chromium supports Pointer Lock; headless shell rejects it.
test.use({ channel: 'chromium' });
let moduleUrl;
test.beforeAll(async () => {
  const { outputFiles } = await build({ entryPoints: [resolve('_build/js/release/build/mizchi/three-viewer/advanced/advanced.js')], bundle: true, platform: 'browser', format: 'esm', write: false });
  moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
});
test('scissor clips MSAA rendering and async readback reports bounds errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
  const result = await page.evaluate(async url => Array.from(await (await import(url)).render_regions()), moduleUrl);
  expect(result.slice(0, 4)).toEqual([255, 0, 1, 2]);
  expect(result[4]).toBeGreaterThan(0);
  expect(result[5]).toBe(1);
  expect(errors).toEqual([]);
});

test('controls constrain zoom, attach gizmos, and lock/unlock the pointer', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('http://controls.test/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }));
  await page.goto('http://controls.test/');
  await page.evaluate(async url => {
    const api = await import(url);
    window.advanced = api;
    api.setup_controls();
  }, moduleUrl);
  await page.locator('canvas').hover();
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => page.evaluate(() => Array.from(window.advanced.controls_state())[0])).toBe(4);
  const state = await page.evaluate(() => Array.from(window.advanced.controls_state()));
  expect(state[1]).toBe(1);
  expect(state[2]).toBeGreaterThan(0);
  await page.evaluate(() => document.querySelector('canvas').addEventListener('click', () => window.advanced.lock_pointer(), { once: true }));
  await page.locator('canvas').click();
  await expect.poll(() => page.evaluate(() => Array.from(window.advanced.controls_state())[3])).toBe(1);
  await page.evaluate(() => window.advanced.unlock_pointer());
  await expect.poll(() => page.evaluate(() => Array.from(window.advanced.controls_state())[3])).toBe(0);
  await page.evaluate(() => window.advanced.dispose_controls());
  expect(errors).toEqual([]);
});

test('composer adds bloom outside geometry and outlines selected objects', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
  const result = await page.evaluate(async url => Array.from((await import(url)).render_effects()), moduleUrl);
  expect(result[0]).toBe(0);
  expect(result[1]).toBeGreaterThan(0);
  expect(result[2]).toBeGreaterThan(0);
  expect(result[3]).toBe(3);
  expect(errors).toEqual([]);
});

test('partial buffer updates change already uploaded geometry', async ({ page }) => {
  const result = await page.evaluate(async url => Array.from((await import(url)).render_dynamic()), moduleUrl);
  expect(result).toEqual([255, 0]);
});

test('GLB and glTF exports round-trip animation, metadata and visibility', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const result = await page.evaluate(async url => Array.from(await (await import(url)).export_roundtrip()), moduleUrl);
  expect(result.slice(0, 4)).toEqual([103, 108, 84, 70]);
  expect(result.slice(4)).toEqual([1, 1, 1, 1, 1, 1]);
  expect(errors).toEqual([]);
});
