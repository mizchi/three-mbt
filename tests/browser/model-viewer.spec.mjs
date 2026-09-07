import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const entry = resolve('_build/js/release/build/examples/model_viewer/model_viewer.js');
let moduleUrl;
test.beforeAll(async () => {
  const { outputFiles } = await build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'esm', write: false });
  moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
});

async function assets(page) {
  const requested = [];
  await page.route('http://three.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    requested.push(path);
    const headers = { 'access-control-allow-origin': '*' };
    if (path === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Binding integration</title>', headers });
    if (path === '/models/missing.glb') return route.fulfill({ status: 404, body: 'not found', headers });
    if (path === '/models/invalid.glb') return route.fulfill({ body: 'invalid glb', headers });
    const name = path.split('/').at(-1);
    if (!['triangle.glb', 'triangle.gltf', 'textured.gltf', 'triangle.bin', 'pixel.png'].includes(name)) return route.fulfill({ status: 404, body: 'not found', headers });
    if (name === 'pixel.png') return route.fulfill({ headers, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=', 'base64') });
    const body = await readFile(new URL(`../fixtures/${name}`, import.meta.url));
    return route.fulfill({ headers, contentType: name.endsWith('gltf') ? 'model/gltf+json' : 'application/octet-stream', body });
  });
  await page.goto('http://three.test/');
  return requested;
}

test('GLB loads via URL and plays its animation in Chromium', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await assets(page);
  const stats = await page.evaluate(async url => {
    const module = await import(url);
    return Array.from(await module.load_model('http://three.test/models/triangle.glb'));
  }, moduleUrl);
  expect(stats).toEqual([1, 1, 1, 3, 1]);
  expect(errors).toEqual([]);
});

test('glTF resolves its external binary relative to the model URL', async ({ page }) => {
  const requested = await assets(page);
  const stats = await page.evaluate(async url => {
    const module = await import(url);
    return Array.from(await module.load_model('http://three.test/models/triangle.gltf'));
  }, moduleUrl);
  expect(stats).toEqual([1, 1, 1, 3, 1]);
  expect(requested).toContain('/models/triangle.bin');
});

test('HTTP and parse failures reject without unhandled browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await assets(page);
  const failures = await page.evaluate(async url => {
    const module = await import(url);
    const results = [];
    for (const name of ['missing.glb', 'invalid.glb']) {
      try { await module.load_model(`http://three.test/models/${name}`); results.push(false); }
      catch { results.push(true); }
    }
    return results;
  }, moduleUrl);
  expect(failures).toEqual([true, true]);
  expect(errors).toEqual([]);
});

test('WebGL renderer produces a red pixel through MoonBit bindings', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const pixel = await page.evaluate(async url => {
    const module = await import(url);
    return Array.from(module.render_triangle());
  }, moduleUrl);
  expect(pixel).toEqual([255, 0, 0, 255]);
  expect(errors).toEqual([]);
});

test('TextureLoader decodes a real PNG in the browser', async ({ page }) => {
  await assets(page);
  expect(await page.evaluate(async url => {
    const module = await import(url);
    return module.load_texture('http://three.test/models/pixel.png');
  }, moduleUrl)).toBe(true);
});

test('ESM loading entry is importable in Node without browser globals', async () => {
  const module = await import(pathToFileURL(entry).href);
  expect(typeof module.load_model).toBe('function');
});

for (const model of ['triangle.glb', 'textured.gltf']) {
  test(`loaded ${model} renders through the full model pipeline`, async ({ page }) => {
    const requested = await assets(page);
    const pixel = await page.evaluate(async ({ url, model }) => {
      const module = await import(url);
      return Array.from(await module.render_model(`http://three.test/models/${model}`));
    }, { url: moduleUrl, model });
    expect(pixel[0]).toBeGreaterThan(100);
    expect(pixel.slice(1)).toEqual([0, 0, 255]);
    if (model === 'textured.gltf') expect(requested).toContain('/models/pixel.png');
  });
}
