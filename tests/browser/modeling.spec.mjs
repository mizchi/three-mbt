import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

let moduleUrl;
test.beforeAll(async () => {
  const {outputFiles} = await build({entryPoints: [resolve('_build/js/release/build/examples/modeling/modeling.js')], bundle: true, platform: 'browser', format: 'esm', write: false});
  moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
});

for (const instanced of [false,true]) {
  test(`baked ${instanced ? 'instanced' : 'ordinary'} Flow matches the curved GPU surface with object transforms`, async ({page}) => {
    const bytes = await page.evaluate(async ({url,instanced}) => Array.from(await (await import(url)).bake_comparison(instanced)),{url:moduleUrl,instanced});
    const size=96*96*4, gpu=bytes.slice(0,size), cpu=bytes.slice(size);
    expect(gpu.filter((v,i)=>i%4===1 && v>0).length).toBeGreaterThan(30);
    expect(cpu.length).toBe(size);
    const different=gpu.filter((v,i)=>v!==cpu[i]).length;
    expect(different).toBeLessThanOrEqual(8);
  });
}

test('OrbitControls remaps keyboard and left drag to panning and removes key listeners', async ({page}) => {
  await page.evaluate(async url => { window.api=await import(url); window.orbit=window.api.orbit_editing_demo(); },moduleUrl);
  const target=()=>page.evaluate(()=>Array.from(window.api.orbit_editing_target(window.orbit)));
  const before=await target();
  await page.keyboard.press('d');
  const keyed=await target();
  expect(keyed[0]).toBeGreaterThan(before[0]);
  await page.mouse.move(60,60); await page.mouse.down(); await page.mouse.move(100,60); await page.mouse.up();
  expect((await target())[0]).not.toBe(keyed[0]);
  await page.evaluate(()=>window.api.stop_editing_keys(window.orbit));
  const stopped=await target();
  await page.keyboard.press('d');
  expect(await target()).toEqual(stopped);
  await page.evaluate(()=>window.orbit.dispose());
});

test('SVG even-odd contours retain holes when extruded and strokes have width', async ({page}) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 0 H10 V10 H0 Z M2 2 H8 V8 H2 Z"/></svg>';
  const values = await page.evaluate(async ({url, svg}) => (await import(url)).svg_profile(svg), {url: moduleUrl, svg});
  expect(values).toEqual([1, 1, 100, 36, 2, 1]);
  await expect(page.evaluate(async url => (await import(url)).svg_profile('<svg><path></svg>'), moduleUrl)).rejects.toThrow();
});

test('modeling loaders fetch SVG, font, MTL and PLY and propagate network failures', async ({page}) => {
  const font = {glyphs: {A: {ha: 1000, o: 'm 0 0 l 1000 0 l 0 1000 l 0 0'}}, resolution: 1000, boundingBox: {yMin: 0, yMax: 1000}, underlineThickness: 0};
  const assets = [
    '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L1 0 L0 1 Z"/></svg>',
    JSON.stringify(font),
    'newmtl Red\nKd 1 0 0\n',
    'ply\nformat ascii 1.0\nelement vertex 3\nproperty float x\nproperty float y\nproperty float z\nelement face 1\nproperty list uchar int vertex_indices\nend_header\n0 0 0\n1 0 0\n0 1 0\n3 0 1 2\n',
  ];
  await page.route('http://modeling.test/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/') return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>Modeling</title>'});
    if (path === '/bad-svg') return route.fulfill({body: '<svg><path></svg>'});
    const data = assets[Number(path.slice(1))];
    return data === undefined ? route.fulfill({status: 404}) : route.fulfill({body: data});
  });
  await page.goto('http://modeling.test/');
  const values = await page.evaluate(async url => {
    const api = await import(url);
    return Promise.all([0,1,2,3].map(kind => api.load_modeling_asset(kind, '/' + kind)));
  }, moduleUrl);
  expect(values).toEqual([1,1,1,3]);
  for (const kind of [0,1,2,3]) {
    await expect(page.evaluate(async ({url,kind}) => (await import(url)).load_modeling_asset(kind,'/missing'), {url: moduleUrl,kind})).rejects.toThrow('LoadError');
  }
  await expect(page.evaluate(async url => (await import(url)).load_modeling_asset(0,'/bad-svg'), moduleUrl)).rejects.toThrow('LoadError');
});

test('a beveled extrusion renders a solid rim and an open through-hole', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const pixels = await page.evaluate(async url => Array.from((await import(url)).render_part()), moduleUrl);
  expect(pixels).toEqual([0, 0, 0, 255, 0, 255, 0, 255]);
  expect(errors).toEqual([]);
});

test('Flow deforms a mesh in the WebGL vertex shader and moves it along the curve', async ({page}) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const pixels = await page.evaluate(async url => Array.from(await (await import(url)).render_flow()), moduleUrl);
  expect(pixels).toEqual([255,0,0,255, 0,0,0,255, 255,0,0,255]);
  expect(errors).toEqual([]);
});

test('SelectionHelper follows pointer drags and disposal removes the rectangle and listeners', async ({page}) => {
  await page.evaluate(async url => { window.modeling = await import(url); window.selection = window.modeling.selection_demo(); }, moduleUrl);
  await page.mouse.move(20,20);
  await page.mouse.down();
  await page.mouse.move(100,90);
  const rectangle = page.locator('.model-selection');
  await expect(rectangle).toBeVisible();
  await expect(rectangle).toHaveCSS('width','80px');
  await expect(rectangle).toHaveCSS('height','70px');
  await page.mouse.up();
  await expect(rectangle).toHaveCount(0);
  await page.evaluate(() => {
    const canvas = window.selection.renderer.domElement;
    window.modeling.close_selection(window.selection);
    // A detached canvas still receives synthetic events if listeners leaked.
    canvas.dispatchEvent(new PointerEvent('pointerdown', {clientX: 20, clientY: 20}));
  });
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.selection.isDown)).toBe(false);
});

test('the modeling example exports a closed consistently wound STL mesh', async ({page}) => {
  const data = await page.evaluate(async url => Array.from(await (await import(url)).export_part()), moduleUrl);
  const bytes = Uint8Array.from(data);
  const geometry = new STLLoader().parse(bytes.buffer);
  const position = geometry.getAttribute('position');
  expect(position.count).toBeGreaterThan(36);
  expect(bytes.byteLength).toBe(84 + (position.count / 3) * 50);
  const edges = new Map();
  const vertex = index => [position.getX(index), position.getY(index), position.getZ(index)];
  const key = vertex => vertex.map(n => Math.round(n * 1e6)).join(',');
  let volume = 0;
  for (let i = 0; i < position.count; i += 3) {
    const [a, b, c] = [vertex(i), vertex(i + 1), vertex(i + 2)];
    volume += (a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    for (const [start, end] of [[a, b], [b, c], [c, a]]) {
      const u = key(start), v = key(end);
      expect(u).not.toBe(v);
      const name = [u, v].sort().join('|');
      const edge = edges.get(name) ?? {count: 0, orientation: 0};
      edge.count++;
      edge.orientation += u < v ? 1 : -1;
      edges.set(name, edge);
    }
  }
  expect([...edges.values()].every(edge => edge.count === 2 && edge.orientation === 0)).toBe(true);
  expect(volume).toBeGreaterThan(1);
  expect(volume).toBeLessThan(2);
  geometry.dispose();
});
