import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

test.beforeEach(async ({ page }) => {
  await page.routeWebSocket(url => url.port === '4175', () => {});
});

test('declarative low-poly cat renders, poses, exports and releases shared resources', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/cat.html');
  await expect(page.getByRole('heading', { name: 'ひなたの、ねこ。' })).toBeVisible();
  await page.waitForFunction(() => window.catViewer?.renderer.info.render.triangles > 0);
  await page.getByRole('button', { name: '動きを止める' }).click();
  const initial = await page.evaluate(() => {
    const { scene, model } = window.catViewer;
    window.catBody = scene.getObjectByName('cat-body');
    window.catHead = scene.getObjectByName('cat-head');
    window.catMaterial = window.catBody.material;
    const cat = scene.getObjectByName('cat');
    let triangles = 0, finite = true, flat = true;
    const geometries = new Set(), materials = new Set();
    cat.traverse(object => {
      if (!object.isMesh) return;
      triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      finite &&= [...object.geometry.attributes.position.array, ...object.position, ...object.scale].every(Number.isFinite);
      flat &&= object.material.flatShading;
      geometries.add(object.geometry);
      materials.add(object.material);
    });
    window.disposals = 0;
    for (const resource of [...geometries, ...materials]) resource.addEventListener('dispose', () => window.disposals++);
    return { triangles, finite, flat, resources: geometries.size + materials.size, error: model.error() };
  });
  expect(initial.triangles).toBeGreaterThan(500);
  expect(initial.triangles).toBeLessThan(2000);
  expect(initial).toMatchObject({ finite: true, flat: true, error: '' });
  await page.getByRole('button', { name: 'グレーの毛色' }).click();
  await page.getByLabel('首をかしげる').fill('12');
  await page.getByLabel('しっぽの角度').fill('25');
  expect(await page.evaluate(() => ({
    same: window.catViewer.scene.getObjectByName('cat-body') === window.catBody && window.catBody.material === window.catMaterial,
    color: window.catBody.material.color.getHex(), tilt: window.catHead.rotation.z, disposed: window.disposals,
  }))).toMatchObject({ same: true, color: 0x687682, disposed: 0 });
  expect(await page.evaluate(() => window.catHead.rotation.z)).toBeCloseTo(12 * Math.PI / 180);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'GLB を保存' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('low-poly-cat.glb');
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString()).toBe('glTF');
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  expect(gltf.nodes.map(node => node.name)).toEqual(expect.arrayContaining(['cat', 'cat-head', 'ear-left', 'ear-right', 'cat-tail', 'tail-tip']));
  expect(gltf.nodes.map(node => node.name)).not.toContain('studio-plinth');
  const exported = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  expect(exported.scene.getObjectByName('cat-body').material.color.getHex()).toBe(0x687682);
  expect(exported.scene.getObjectByName('cat-head').rotation.z).toBeCloseTo(12 * Math.PI / 180);
  // GLTF has no flatShading material flag: the file itself must carry face normals.
  let flatNormals = true, exportedTriangles = 0;
  exported.scene.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry;
    const count = geometry.index?.count ?? geometry.attributes.position.count;
    exportedTriangles += count / 3;
    const normal = geometry.attributes.normal;
    for (let i = 0; i < count; i += 3) {
      const indices = [0, 1, 2].map(offset => geometry.index ? geometry.index.getX(i + offset) : i + offset);
      for (const axis of ['getX', 'getY', 'getZ']) {
        flatNormals &&= Math.abs(normal[axis](indices[0]) - normal[axis](indices[1])) < 1e-6;
        flatNormals &&= Math.abs(normal[axis](indices[0]) - normal[axis](indices[2])) < 1e-6;
      }
    }
  });
  expect(exportedTriangles).toBe(initial.triangles);
  expect(flatNormals).toBe(true);
  await page.evaluate(() => window.catViewer.dispose());
  expect(await page.evaluate(() => window.disposals)).toBe(initial.resources);
  expect(await page.evaluate(() => window.catViewer.scene.children.length)).toBe(0);
  expect(errors).toEqual([]);
});

test('cat viewer fits a phone and the model remains visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4175/cat.html');
  await expect(page.getByRole('heading', { name: 'ひなたの、ねこ。' })).toBeVisible();
  await page.waitForFunction(() => window.catViewer?.renderer.info.render.triangles > 0);
  await expect(page.locator('canvas')).toBeInViewport();
  await page.getByRole('button', { name: 'GLB を保存' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'GLB を保存' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
