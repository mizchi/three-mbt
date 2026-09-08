import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const entry = resolve('_build/js/release/build/mizchi/three-viewer/react_three_fiber/react_three_fiber.js');

test('MoonBit components use R3F hooks, events, Suspense assets, and React cleanup', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { outputFiles } = await build({
    stdin: { contents: `import * as api from ${JSON.stringify(entry)};
      import { createRoot } from 'react-dom/client';
      window.api = api;
      window.mount = url => {
        window.root = createRoot(document.querySelector('#root'));
        window.root.render(api.app(url));
      };`, resolveDir: process.cwd() },
    bundle: true, platform: 'browser', format: 'esm', write: false,
  });
  const glb = await readFile('tests/fixtures/triangle.glb');
  const asset = `data:model/gltf-binary;base64,${glb.toString('base64')}`;
  await page.setContent('<div id="root" style="width:400px;height:400px"></div>');
  await page.addScriptTag({ type: 'module', content: outputFiles[0].text });
  await page.waitForFunction(() => window.mount);
  await page.evaluate(url => window.mount(url), asset);
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => window.api.frame_count() > 2);
  await page.waitForFunction(() => window.api.state().scene.getObjectByName('loaded-asset'));
  expect(await page.evaluate(() => {
    const state = window.api.state();
    const mesh = state.scene.getObjectByName('fiber-box');
    window.mesh = mesh;
    window.loaded = state.scene.getObjectByName('loaded-asset');
    window.disposals = 0;
    window.assetDisposals = 0;
    window.loaded.traverse(object => {
      if (object.isMesh) {
        object.geometry.addEventListener('dispose', () => window.assetDisposals++);
        for (const material of [object.material].flat()) {
          material.addEventListener('dispose', () => window.assetDisposals++);
        }
      }
    });
    mesh.geometry.addEventListener('dispose', () => window.disposals++);
    mesh.material.addEventListener('dispose', () => window.disposals++);
    return { type: mesh.type, width: state.size.width, rotated: mesh.rotation.y > 0,
      triangles: state.gl.info.render.triangles, color: mesh.material.color.getHex() };
  })).toMatchObject({ type: 'Mesh', width: 400, rotated: true, color: 0xad207b });
  await page.locator('canvas').click({ position: { x: 200, y: 200 } });
  await expect.poll(() => page.evaluate(() => window.mesh.material.color.getHex())).toBe(0x33aa66);
  await page.locator('canvas').click({ position: { x: 200, y: 200 } });
  await expect.poll(() => page.evaluate(() => window.mesh.material.color.getHex())).toBe(0xad207b);
  await page.evaluate(() => { document.querySelector('#root').style.width = '250px'; });
  await expect.poll(() => page.evaluate(() => window.mesh.scale.x)).toBe(0.8);
  const before = await page.evaluate(() => window.api.frame_count());
  await expect.poll(() => page.evaluate(() => window.api.frame_count())).toBeGreaterThan(before);
  await page.evaluate(() => window.root.unmount());
  await expect.poll(() => page.evaluate(() => window.api.cleanup_count())).toBe(1);
  await expect.poll(() => page.evaluate(() => window.disposals)).toBe(2);
  expect(await page.evaluate(() => window.mesh.parent)).toBeNull();
  expect(await page.evaluate(() => window.assetDisposals)).toBe(0);
  // Cached useLoader assets / primitive objects remain caller-owned.
  await page.evaluate(url => {
    window.loaded.traverse(object => {
      if (object.isMesh) {
        object.geometry.dispose();
        for (const material of [object.material].flat()) material.dispose();
      }
    });
    window.api.clear_asset_cache(url);
  }, asset);
  expect(errors).toEqual([]);
});

test('manual roots preserve generic hook values and explicit render priority', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { outputFiles } = await build({ entryPoints: [entry], bundle: true,
    platform: 'browser', format: 'esm', write: false });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
  await page.setContent('<canvas width="200" height="200" style="width:200px;height:200px"></canvas>');
  await page.evaluate(async url => {
    window.api = await import(url);
    window.fiber = await window.api.mount_manual(document.querySelector('canvas'));
  }, moduleUrl);
  await page.waitForFunction(() => window.api.state().scene.children.length === 1);
  const initial = await page.evaluate(() => {
    const state = window.api.state();
    state.advance(1, true);
    return { mode: state.frameloop, name: state.scene.children[0].name,
      triangles: state.gl.info.render.triangles, frames: window.api.frame_count() };
  });
  expect(initial).toEqual({ mode: 'never', name: 'value-1-memo-2-ref-0', triangles: 12, frames: 1 });
  await page.locator('canvas').click({ position: { x: 100, y: 100 } });
  await expect.poll(() => page.evaluate(() => window.api.state().scene.children[0].name)).toBe('value-7-memo-14-ref-1');
  await page.evaluate(() => window.api.state().advance(2, true));
  expect(await page.evaluate(() => window.api.frame_count())).toBe(2);
  await page.evaluate(() => window.fiber.unmount());
  await expect.poll(() => page.evaluate(() => window.api.state().scene.children.length)).toBe(0);
  expect(errors).toEqual([]);
});
