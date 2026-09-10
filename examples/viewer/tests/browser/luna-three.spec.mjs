import { test, expect } from '@playwright/test';

test('Luna signals update a real WebGL scene and release owned resources', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Keep the renderer lifecycle independent of the watcher's initial full reload.
  // The separate hmr.spec.mjs tests MoonBit/Vite reloading.
  await page.routeWebSocket(url => url.port === '4175', () => {});
  await page.goto('http://127.0.0.1:4175/luna-three.html');
  await expect(page.getByRole('heading', { name: 'Form in motion.' })).toBeVisible();
  await page.waitForFunction(() => window.lunaThree?.renderer.info.render.triangles > 0);
  const initial = await page.evaluate(() => {
    const { scene, model } = window.lunaThree;
    window.ring = scene.getObjectByName('ring-0');
    window.geometry = window.ring.geometry;
    window.material = window.ring.material;
    window.disposals = 0;
    window.geometry.addEventListener('dispose', () => window.disposals++);
    window.material.addEventListener('dispose', () => window.disposals++);
    return { color: window.material.color.getHex(), error: model.error() };
  });
  expect(initial).toEqual({ color: 0x49c6bb, error: '' });
  await page.getByRole('button', { name: 'Change palette' }).click();
  expect(await page.evaluate(() => ({ same: window.ring.material === window.material,
    color: window.material.color.getHex(), disposed: window.disposals })))
    .toEqual({ same: true, color: 0xffb86b, disposed: 0 });
  await page.locator('#radius').fill('1.5');
  expect(await page.evaluate(() => ({ radius: window.ring.geometry.parameters.radius,
    disposed: window.disposals }))).toEqual({ radius: 1.5, disposed: 1 });
  await page.locator('#rings').fill('7');
  expect(await page.evaluate(() => ({ same: window.lunaThree.scene.getObjectByName('ring-0') === window.ring,
    count: window.lunaThree.scene.getObjectByName('sculpture').children.length })))
    .toEqual({ same: true, count: 9 });
  await page.getByRole('button', { name: 'Hide sculpture' }).click();
  expect(await page.evaluate(() => ({ removed: !window.lunaThree.scene.getObjectByName('sculpture'),
    disposed: window.disposals }))).toEqual({ removed: true, disposed: 2 });
  await expect.poll(() => page.evaluate(() => window.lunaThree.renderer.info.memory.geometries)).toBe(0);
  await page.getByRole('button', { name: 'Show sculpture' }).click();
  await expect.poll(() => page.evaluate(() => window.lunaThree.renderer.info.render.triangles)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 640, height: 800 });
  await expect.poll(() => page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return Math.abs(window.lunaThree.camera.aspect - canvas.clientWidth / canvas.clientHeight);
  })).toBeLessThan(0.01);
  await page.evaluate(() => window.lunaThree.dispose());
  expect(await page.evaluate(() => window.lunaThree.scene.children.length)).toBe(0);
  expect(errors).toEqual([]);
});
