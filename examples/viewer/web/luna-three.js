import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as model from 'mbt:mizchi/three-viewer/luna_three';

const viewport = document.querySelector('#viewport');
const canvas = viewport.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101721');
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(4, 2.7, 5);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 12;

model.mount(scene);
const observer = new ResizeObserver(() => {
  const { width, height } = viewport.getBoundingClientRect();
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
observer.observe(viewport);
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

const abort = new AbortController();
const listen = (id, event, handler) => document.getElementById(id).addEventListener(event, handler, { signal: abort.signal });
listen('rings', 'input', event => {
  const value = Number(event.target.value);
  document.querySelector('#rings-value').value = value;
  model.set_ring_count(value);
});
listen('radius', 'input', event => {
  const value = Number(event.target.value);
  document.querySelector('#radius-value').value = value.toFixed(2);
  model.set_radius(value);
});
listen('palette', 'click', () => model.toggle_palette());
listen('visibility', 'click', event => {
  model.toggle_visible();
  const hidden = event.target.getAttribute('aria-pressed') !== 'true';
  event.target.setAttribute('aria-pressed', String(hidden));
  event.target.textContent = hidden ? 'Show sculpture' : 'Hide sculpture';
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

// Local integration-test surface, with real three.js objects.
if (import.meta.env.DEV) window.lunaThree = { model, scene, renderer, camera, dispose };
window.addEventListener('pagehide', dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
