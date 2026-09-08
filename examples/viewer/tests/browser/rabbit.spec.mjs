import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Vite serves the MoonBit rabbit and switches characters without losing controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175');
  await expect(page.locator('#status')).toHaveText('Ready to explore');
  await expect(page.getByRole('heading', { name: 'Moon rabbit.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Moon rabbit', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => [...document.scripts].some(script => script.src.includes('/@vite/client')))).toBe(true);
  await page.getByRole('button', { name: 'Wireframe' }).click();
  await page.getByRole('button', { name: 'Little mouse', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Little mouse.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wireframe' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Moon rabbit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Moon rabbit.' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GLB' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('moonbit-rabbit.glb');
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString()).toBe('glTF');
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const names = gltf.nodes.map(node => node.name);
  expect(names).toEqual(expect.arrayContaining(['rabbit-head', 'rabbit-ear-left', 'rabbit-ear-right', 'visor', 'glyph-zero', 'glyph-one', 'glyph-code-left', 'glyph-code-right']));
  expect(names).not.toContain('studio-floor');
  expect(gltf.meshes.every(mesh => mesh.primitives.every(p => (p.mode ?? 4) === 4))).toBe(true);
  expect(errors).toEqual([]);
});

test('rabbit viewer remains usable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4175');
  await expect(page.locator('#status')).toHaveText('Ready to explore');
  await expect(page.getByRole('button', { name: 'Download GLB' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Little mouse', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
