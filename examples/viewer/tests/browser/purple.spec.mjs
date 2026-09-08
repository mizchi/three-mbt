import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('purple mascot loads by URL, orbits, and exports its solid body and smile', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/?model=purple');
  await expect(page.locator('#status')).toHaveText('Ready to explore');
  await expect(page.getByRole('heading', { name: 'Purple pal.' })).toBeVisible();
  const canvas = page.locator('canvas');
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Wireframe' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GLB' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('purple-mascot.glb');
  await download.saveAs(testInfo.outputPath('purple-mascot.glb'));
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString()).toBe('glTF');
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  expect(gltf.nodes.map(node => node.name)).toEqual(expect.arrayContaining([
    'purple-body', 'smile-patch', 'smile-mouth', 'eye-left', 'eye-right', 'nose',
  ]));
  expect(gltf.nodes.map(node => node.name)).not.toContain('studio-floor');
  expect(gltf.meshes.every(mesh => mesh.primitives.every(p => (p.mode ?? 4) === 4))).toBe(true);
  // Parse the actual exported body and check that every edge joins two triangles.
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const asset = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const geometry = asset.scene.getObjectByName('purple-body').geometry;
  const edges = new Map();
  const indices = geometry.index.array;
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  expect([...edges.values()].filter(count => count !== 2)).toHaveLength(0);
  await page.getByRole('button', { name: 'Moon rabbit', exact: true }).click();
  await page.getByRole('button', { name: 'Purple pal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Purple pal.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('purple character picker fits on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4175/?model=purple');
  await expect(page.locator('#status')).toHaveText('Ready to explore');
  await expect(page.getByRole('button', { name: 'Purple pal', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Download GLB' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
