import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
let moduleSource;
const moduleUrl = 'http://assets.test/bundle.js';
test.beforeAll(async () => {
  const { outputFiles } = await build({ entryPoints: [resolve('_build/js/release/build/examples/assets/assets.js')], bundle: true, platform: 'browser', format: 'esm', write: false });
  moduleSource = outputFiles[0].text;
});
async function serve(page) {
  const requests = [];
  await page.route('http://assets.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    const headers = { 'access-control-allow-origin': '*' };
    if(path === '/') return route.fulfill({ body: '<!doctype html><body></body>', contentType:'text/html' });
    if(path === '/bundle.js') return route.fulfill({body: moduleSource, contentType: 'text/javascript', headers});
    let file;
    if(['/draco.glb','/meshopt.glb','/basis.glb','/2d_uastc.ktx2','/red.png','/blue.png','/colors.webm'].includes(path)) file = resolve('tests/fixtures'+path);
    if(['/draco/draco_wasm_wrapper.js','/draco/draco_decoder.wasm','/basis/basis_transcoder.js','/basis/basis_transcoder.wasm'].includes(path)) file = resolve('node_modules/three/examples/jsm/libs'+path);
    if(!file) return route.fulfill({ status:404, body:'not found', headers });
    if(path.endsWith('.webm')) {
      const video = await readFile(file);
      const range = route.request().headers()['range'];
      if(range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(range);
        const start = Number(match[1]);
        const end = Math.min(match[2] ? Number(match[2]) : video.length - 1, video.length - 1);
        return route.fulfill({ status:206, body:video.subarray(start,end+1), contentType:'video/webm', headers:{...headers,'accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${video.length}`} });
      }
      return route.fulfill({body:video,contentType:'video/webm',headers:{...headers,'accept-ranges':'bytes'}});
    }
    return route.fulfill({ body: await readFile(file), headers, contentType: path.endsWith('.wasm') ? 'application/wasm' : path.endsWith('.js') ? 'text/javascript' : path.endsWith('.webm') ? 'video/webm' : path.endsWith('.png') ? 'image/png' : 'application/octet-stream' });
  });
  await page.goto('http://assets.test/');
  return requests;
}
for(const kind of ['draco', 'meshopt', 'basis']) {
  test(`${kind} compressed GLB decodes and renders`, async ({page}) => {
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const requests=await serve(page);
    const result=await page.evaluate(async ({url,kind})=>Array.from(await (await import(url)).load_compressed(`http://assets.test/${kind}.glb`, 'http://assets.test/')), {url:moduleUrl,kind});
    expect(result[0]).toBe(3);
    expect(result[4]).toBe(255);
    expect(result[5]).toBeGreaterThan(0);
    if(kind !== 'basis') expect(result.slice(1,4)).toEqual([255,0,0]);
    if(kind === 'draco') expect(requests).toContain('/draco/draco_decoder.wasm');
    if(kind === 'basis') expect(requests).toContain('/basis/basis_transcoder.wasm');
    expect(errors).toEqual([]);
  });
}

test('cube, volume, array and video textures sample real pixels', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
  await serve(page);
  const result=await page.evaluate(async url=>Array.from(await (await import(url)).sample_textures('http://assets.test/')),moduleUrl);
  for(const channel of result) expect(channel, JSON.stringify({result,errors})).toBeGreaterThan(200);
  expect(result).toHaveLength(5);
  expect(errors).toEqual([]);
});

test('stencil masks and clipping planes control fragment visibility', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await serve(page);
  const result=await page.evaluate(async url=>Array.from((await import(url)).render_stencil()),moduleUrl);
  expect(result.slice(0,2)).toEqual([255,0]);
  expect(result.slice(2)).toEqual([0,255]);
  expect(errors).toEqual([]);
});

test('batched instances, wide lines and area lights render through the bindings', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  await serve(page);
  const result=await page.evaluate(async url=>Array.from((await import(url)).render_objects()),moduleUrl);
  expect(result.slice(0,3)).toEqual([255,255,0]);
  expect(result[3]).toBeGreaterThan(0);
  expect(result[4]).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test('missing decoders and invalid media reject with typed errors', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await serve(page);
  const result=await page.evaluate(async url=>Array.from(await (await import(url)).reject_invalid_assets('http://assets.test/')),moduleUrl);
  expect(result).toEqual([1,1,1,1,1]);
  expect(errors).toEqual([]);
});
