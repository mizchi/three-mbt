import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as model from 'mbt:mizchi/three-viewer/cat_viewer';

const viewport = document.querySelector('#viewport');
const canvas = viewport.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e6e1');
const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
camera.position.set(3.7, 2.7, 6);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.update();
controls.saveState();

model.mount(scene);
const cat = scene.getObjectByName('cat');
const key = scene.getObjectByName('key-light');
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.1, far: 20 });
key.shadow.camera.updateProjectionMatrix();
key.shadow.normalBias = 0.025;
let triangles = 0;
cat.traverse(object => {
  if (object.isMesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
});
document.querySelector('#triangle-count').textContent = triangles.toLocaleString();
const observer = new ResizeObserver(() => {
  const { width, height } = viewport.getBoundingClientRect();
  if (width <= 0 || height <= 0) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
observer.observe(viewport);
renderer.setAnimationLoop(time => {
  model.tick(time / 1000);
  controls.update();
  renderer.render(scene, camera);
});

const abort = new AbortController();
const listen = (id, event, handler) => document.getElementById(id).addEventListener(event, handler, { signal: abort.signal });
const coatNames = ['茶トラ', 'グレー', 'クリーム'];
for (const button of document.querySelectorAll('[data-palette]')) {
  button.addEventListener('click', () => {
    const palette = Number(button.dataset.palette);
    model.set_palette(palette);
    document.querySelector('#coat-name').textContent = coatNames[palette];
    for (const swatch of document.querySelectorAll('[data-palette]')) swatch.setAttribute('aria-pressed', String(swatch === button));
  }, { signal: abort.signal });
}
listen('head-tilt', 'input', event => {
  const value = Number(event.target.value);
  model.set_head_tilt(value);
  document.querySelector('#head-value').value = `${value}°`;
});
listen('tail-angle', 'input', event => {
  const value = Number(event.target.value);
  model.set_tail_angle(value);
  document.querySelector('#tail-value').value = `${value}°`;
});
let motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
function updateMotion() {
  model.set_motion(motion);
  const button = document.querySelector('#motion');
  button.setAttribute('aria-pressed', String(motion));
  button.textContent = motion ? '動きを止める' : '動かす';
}
updateMotion();
listen('motion', 'click', () => { motion = !motion; updateMotion(); });
listen('wireframe', 'click', event => {
  const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
  event.currentTarget.setAttribute('aria-pressed', String(enabled));
  cat.traverse(object => { if (object.isMesh) object.material.wireframe = enabled; });
});
listen('reset-view', 'click', () => controls.reset());

async function exportCat() {
  const snapshot = cat.clone(true);
  const geometries = new Map(), materials = new Map();
  try {
    snapshot.traverse(object => {
      if (!object.isMesh) return;
      const originalGeometry = object.geometry;
      if (!geometries.has(originalGeometry)) {
        // glTF has no flatShading flag; split vertices and bake face normals.
        const geometry = originalGeometry.index ? originalGeometry.toNonIndexed() : originalGeometry.clone();
        geometries.set(originalGeometry, geometry);
        geometry.computeVertexNormals();
      }
      object.geometry = geometries.get(originalGeometry);
      const originalMaterial = object.material;
      if (!materials.has(originalMaterial)) materials.set(originalMaterial, originalMaterial.clone());
      object.material = materials.get(originalMaterial);
      object.material.wireframe = false;
    });
    return await new GLTFExporter().parseAsync(snapshot, { binary: true, trs: true });
  } finally {
    for (const geometry of geometries.values()) geometry.dispose();
    for (const material of materials.values()) material.dispose();
  }
}

listen('export', 'click', async () => {
  const button = document.querySelector('#export');
  const status = document.querySelector('#export-status');
  button.disabled = true;
  status.textContent = '猫を、お持ち帰りの準備中…';
  try {
    // Snapshot the current pose; the studio and its lights stay out of the file.
    const bytes = await exportCat();
    const url = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'low-poly-cat.glb';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'low-poly-cat.glb を保存しました。';
  } catch (error) {
    status.textContent = `保存できませんでした: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});

let disposed = false;
function dispose() {
  if (disposed) return;
  disposed = true;
  abort.abort();
  observer.disconnect();
  renderer.setAnimationLoop(null);
  model.unmount();
  controls.dispose();
  renderer.dispose();
}
if (import.meta.env.DEV) window.catViewer = { scene, model, renderer, camera, controls, dispose };
window.addEventListener('pagehide', dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
