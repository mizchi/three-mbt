import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const origin = 'http://127.0.0.1:4175';

// Subpixel page scrolling and GPU rounding can change a few antialiased pixels.
async function pixelDifference(page, first, second) {
  return page.evaluate(async images => {
    const pixels = await Promise.all(images.map(async image => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${image}`)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    }));
    let difference = 0;
    for (let i = 0; i < pixels[0].length; i++) difference += Math.abs(pixels[0][i] - pixels[1][i]);
    return difference / pixels[0].length;
  }, [first.toString('base64'), second.toString('base64')]);
}

test.beforeEach(async ({ page }) => {
  await page.goto(`${origin}/?model=mouse`);
  await expect(page.locator('#status')).toHaveText('Ready to explore');
});

test('MoonBit builds a finite, low-poly character with distinct anatomical parts', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { create_mouse } = await import('/models.js');
    const mouse = await create_mouse();
    const names = [], materials = new Set();
    let triangles = 0, finite = true;
    mouse.traverse(part => {
      if (!part.isMesh) return;
      names.push(part.name);
      const { geometry, material } = part;
      triangles += (geometry.index?.count ?? geometry.attributes.position.count) / 3;
      finite &&= [...geometry.attributes.position.array].every(Number.isFinite);
      finite &&= [...part.position, ...part.scale].every(Number.isFinite);
      materials.add(material);
      geometry.dispose();
    });
    materials.forEach(material => material.dispose());
    return { names, triangles, finite };
  });
  expect(result.finite).toBe(true);
  expect(result.triangles).toBeGreaterThan(300);
  expect(result.triangles).toBeLessThan(2000);
  expect(result.names).toEqual(expect.arrayContaining([
    'body', 'head', 'snout', 'nose', 'ear-left', 'ear-right',
    'inner-ear-left', 'inner-ear-right', 'eye-left', 'eye-right',
    'paw-front-left', 'paw-front-right', 'paw-back-left', 'paw-back-right', 'tail',
  ]));
});

test('viewer renders, orbits, resets, and switches to wireframe without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const canvas = page.getByRole('img', { name: 'Interactive low-poly mouse model' });
  const initial = await canvas.screenshot();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => pixelDifference(page, initial, await canvas.screenshot())).toBeGreaterThan(0.3);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect.poll(async () => pixelDifference(page, initial, await canvas.screenshot())).toBeLessThan(0.1);
  await canvas.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => pixelDifference(page, initial, await canvas.screenshot())).toBeGreaterThan(0.3);
  await page.keyboard.press('r');
  await expect.poll(async () => pixelDifference(page, initial, await canvas.screenshot())).toBeLessThan(0.1);
  await page.keyboard.press('+');
  await expect.poll(async () => pixelDifference(page, initial, await canvas.screenshot())).toBeGreaterThan(0.3);
  await page.keyboard.press('r');
  await page.getByRole('button', { name: 'Wireframe' }).click();
  await expect(page.getByRole('button', { name: 'Wireframe' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => pixelDifference(page, initial, await canvas.screenshot())).toBeGreaterThan(0.3);
  expect(errors).toEqual([]);
});

test('downloads a GLB containing the mouse, without the studio floor or lights', async ({ page }) => {
  await page.getByRole('button', { name: 'Wireframe' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GLB' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('low-poly-mouse.glb');
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString()).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const names = gltf.nodes.map(node => node.name);
  expect(names).toContain('tail');
  expect(names).toContain('body');
  expect(names).not.toContain('studio-floor');
  expect(gltf.extensionsUsed ?? []).not.toContain('KHR_lights_punctual');
  expect(gltf.meshes.every(mesh => mesh.primitives.every(p => (p.mode ?? 4) === 4))).toBe(true);
  await expect(page.locator('#status')).toHaveText('Mouse saved as GLB');
});

test('mobile viewport keeps the model and controls accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Download GLB' })).toBeInViewport();
  const box = await page.locator('canvas').boundingBox();
  expect(box.width).toBeGreaterThan(250);
  expect(box.height).toBeGreaterThan(280);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
