import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import * as THREE from 'three';

let moduleUrl;
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0xffffff}));
const model = mesh.toJSON();
model.materials[0].map = 'texture';
model.textures = [{uuid: 'texture', image: 'image', colorSpace: 'srgb'}];
model.images = [{uuid: 'image', url: 'pixel.png'}];
const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)).toJSON();
const material = new THREE.MeshBasicMaterial({color: 0x123456}).toJSON();
const animation = [new THREE.AnimationClip('move', 1, [new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [0, 2])]).toJSON()];

test.beforeAll(async () => {
  const {outputFiles} = await build({entryPoints: [resolve('_build/js/release/build/mizchi/three-viewer/loading/loading.js')], bundle: true, platform: 'browser', format: 'esm', write: false});
  moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
});
async function setup(page) {
  const requests = [];
  await page.route('http://loading.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    requests.push({path, headers: route.request().headers()});
    if (path === '/') return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>JSON loading</title>'});
    if (path === '/text.txt') return route.fulfill({contentType: 'text/plain', body: 'hello MoonBit'});
    if (path === '/bytes.bin') return route.fulfill({body: Buffer.from([0, 127, 128, 255])});
    if (path === '/value.json') return route.fulfill({contentType: 'application/json', body: '{"value":42}'});
    if (path === '/invalid.json') return route.fulfill({body: '{invalid'});
    if (path === '/models/scene.json') return route.fulfill({json: model});
    if (path === '/models/bad-image.json') return route.fulfill({json: {...model, images: [{uuid: 'image', url: 'missing.png'}]}});
    if (path === '/models/pixel.png') return route.fulfill({contentType: 'image/png', path: resolve('tests/fixtures/red.png')});
    if (path === '/geometry.json') return route.fulfill({json: geometry});
    if (path === '/material.json') return route.fulfill({json: material});
    if (path === '/animation.json') return route.fulfill({json: animation});
    return route.fulfill({status: 404, body: 'not found'});
  });
  await page.goto('http://loading.test/');
  await page.evaluate(async url => { globalThis.bindings = await import(url); }, moduleUrl);
  return requests;
}

test('FileLoader reads typed text, bytes and JSON with configured headers', async ({page}) => {
  const requests = await setup(page);
  const values = await page.evaluate(async () => {
    const m = globalThis.bindings, loader = m.create_file_loader();
    return [await m.load_file_text(loader, '/text.txt'), Array.from(await m.load_file_bytes(loader, '/bytes.bin')), JSON.parse(await m.load_file_json(loader, '/value.json'))];
  });
  expect(values).toEqual(['hello MoonBit', [0, 127, 128, 255], {value: 42}]);
  expect(requests.filter(r => r.path !== '/').every(r => r.headers['x-asset-version'] === 'test')).toBe(true);
});

test('JSON loaders fetch geometry, material, animation and an image-backed object', async ({page}) => {
  const requests = await setup(page);
  const values = await page.evaluate(async () => {
    const m = globalThis.bindings;
    return [await m.load_geometry('/geometry.json'), await m.load_material('/material.json'), await m.load_animation('/animation.json'), Array.from(await m.render_object('/models/scene.json'))];
  });
  expect(values).toEqual([3, 0x123456, 'move', [255, 0, 0, 255]]);
  expect(requests.some(r => r.path === '/models/pixel.png')).toBe(true);
});

test('Malformed JSON, HTTP errors and failed images reject through LoadError', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  const results = await page.evaluate(async () => {
    const m = globalThis.bindings;
    const jobs = [m.load_file_json(m.create_file_loader(), '/invalid.json'), m.load_file_text(m.create_file_loader(), '/missing'), m.load_geometry('/invalid.json'), m.load_material('/invalid.json'), m.load_animation('/invalid.json'), m.parse_object('{invalid'), m.render_object('/models/bad-image.json')];
    return (await Promise.allSettled(jobs)).map(r => ({status: r.status, error: String(r.reason)}));
  });
  expect(results.every(r => r.status === 'rejected' && r.error.includes('LoadError'))).toBe(true);
  expect(errors).toEqual([]);
});

test('FileLoader abort rejects a pending request and permits subsequent loads', async ({page}) => {
  await setup(page);
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  await page.route('http://loading.test/slow.txt', route => { requested(route); });
  await page.evaluate(() => {
    const m = globalThis.bindings;
    globalThis.loader = m.create_file_loader();
    globalThis.pending = m.load_file_text(globalThis.loader, '/slow.txt').then(() => 'unexpected success', error => String(error));
  });
  const route = await started;
  const result = await page.evaluate(async () => {
    globalThis.bindings.abort_file(globalThis.loader);
    return await globalThis.pending;
  });
  expect(result).toContain('LoadError');
  await route.abort().catch(() => {});
  expect(await page.evaluate(() => globalThis.bindings.load_file_text(globalThis.loader, '/text.txt'))).toBe('hello MoonBit');
});

test('mixed response types for a coalesced URL reject instead of crossing FFI types', async ({page}) => {
  await setup(page);
  const results = await page.evaluate(async () => {
    const m = globalThis.bindings;
    const jobs = [m.load_file_text(m.create_file_loader(), '/text.txt'), m.load_file_bytes(m.create_file_loader(), '/text.txt')];
    return (await Promise.allSettled(jobs)).map(r => ({status: r.status, value: r.value, error: String(r.reason)}));
  });
  expect(results[0].status).toBe('fulfilled');
  expect(results[0].value).toBe('hello MoonBit');
  expect(results[1].status).toBe('rejected');
  expect(results[1].error).toContain('LoadError');
  // String(MoonBit suberror) exposes its type name, not its payload.
});
