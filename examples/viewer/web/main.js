import * as viewerApi from './models.js';

// This host handles the DOM and browser lifecycle. All 3D work lives in MoonBit.
const canvas = document.querySelector('#mouse-canvas');
const viewport = document.querySelector('#viewport');
const status = document.querySelector('#status');
const wireframe = document.querySelector('#wireframe');
const reset = document.querySelector('#reset');
const download = document.querySelector('#download');
const modelButtons = [...document.querySelectorAll('[data-model]')];
const characters = {
  purple: {
    title: 'Purple pal', label: 'Interactive purple mascot model', number: '03 / PAL', study: '003',
    description: 'Big ears. A bigger smile.\nA soft, sculpted friend from your illustration.',
    shape: 'Drooping ears, a rounded belly, and little feet flow into one smooth body.',
    detailTitle: 'A smile with dimension', detail: 'Bright eyes and a wide grin follow the curve of the face.',
    filename: 'purple-mascot.glb', saved: 'Purple mascot saved as GLB', source: 'purple',
  },
  rabbit: {
    title: 'Moon rabbit', label: 'Interactive low-poly MoonBit rabbit model', number: '02 / MOON', study: '002',
    description: 'The MoonBit character, in a new dimension.\nA low-poly model, built entirely in MoonBit.',
    shape: 'Faceted solids and folded ears give the MoonBit rabbit its silhouette.',
    detailTitle: 'Write it in geometry', detail: 'The white visor and 01 <> symbols are meshes, with no textures or fonts.',
    filename: 'moonbit-rabbit.glb', saved: 'Rabbit saved as GLB', source: 'rabbit',
  },
  mouse: {
    title: 'Little mouse', label: 'Interactive low-poly mouse model', number: '01 / MUS', study: '001',
    description: 'A few simple shapes. A little personality.\nA low-poly character, built entirely in MoonBit.',
    shape: 'Scaled icosahedrons form the body, ears, eyes, and tiny paws.',
    detailTitle: 'Follow the curve', detail: 'A tapered, six-sided loft gives the tail its gentle curl.',
    filename: 'low-poly-mouse.glb', saved: 'Mouse saved as GLB', source: 'mouse',
  },
};
const requested = new URLSearchParams(location.search).get('model');
let selected = Object.hasOwn(characters, requested) ? requested : 'rabbit';
let viewer;
let animation;
let observer;
let stopped = false;

function reportError(error) {
  console.error(error);
  status.dataset.error = '';
  status.textContent = 'Could not load the preview. Please check that WebGL is available.';
}

function stop() {
  if (stopped) return;
  stopped = true;
  cancelAnimationFrame(animation);
  observer?.disconnect();
  if (viewer) viewerApi.dispose(viewer);
}

function updateCharacter() {
  const character = characters[selected];
  document.documentElement.dataset.model = selected;
  document.title = `${character.title} — three.mbt`;
  document.querySelector('#title').replaceChildren(
    document.createTextNode(character.title),
    Object.assign(document.createElement('span'), { textContent: '.' }),
  );
  document.querySelector('#description').textContent = character.description;
  document.querySelector('#shape-description').textContent = character.shape;
  document.querySelector('#surface-description').textContent = selected === 'purple' ? 'Soft curves, a seamless silhouette.' : 'Flat faces, soft silhouette.';
  document.querySelector('#detail-title').textContent = character.detailTitle;
  document.querySelector('#detail-description').textContent = character.detail;
  document.querySelector('.model-number').textContent = character.number;
  document.querySelector('#study-number').textContent = `MODELING STUDY / ${character.study}`;
  document.querySelector('.source-link').href = `https://github.com/mizchi/three-mbt/tree/main/examples/viewer/src/${character.source}`;
  canvas.setAttribute('aria-label', character.label);
  for (const button of modelButtons) button.setAttribute('aria-pressed', String(button.dataset.model === selected));
  document.querySelector('#triangles').replaceChildren(
    document.createTextNode(viewerApi.triangle_count(viewer).toLocaleString() + ' '),
    Object.assign(document.createElement('small'), { textContent: 'triangles' }),
  );
}

try {
  viewer = await viewerApi.create_viewer(canvas);
  if (selected !== 'rabbit') await viewerApi.select_model(viewer, selected);
  observer = new ResizeObserver(() => {
    viewerApi.resize(viewer, viewport.clientWidth, viewport.clientHeight, devicePixelRatio);
  });
  observer.observe(viewport);
  viewerApi.resize(viewer, viewport.clientWidth, viewport.clientHeight, devicePixelRatio);
  function frame() {
    if (stopped) return;
    viewerApi.render(viewer);
    animation = requestAnimationFrame(frame);
  }
  frame();
  updateCharacter();
  for (const button of [wireframe, reset, download, ...modelButtons]) button.disabled = false;
  status.textContent = 'Ready to explore';
  for (const button of modelButtons) button.addEventListener('click', async () => {
    if (button.dataset.model === selected) return;
    for (const control of [...modelButtons, download]) control.disabled = true;
    try {
      await viewerApi.select_model(viewer, button.dataset.model);
      selected = button.dataset.model;
      const url = new URL(location.href);
      url.searchParams.set('model', selected);
      history.replaceState(null, '', url);
      updateCharacter();
      delete status.dataset.error;
      status.textContent = 'Ready to explore';
    } catch (error) {
      console.error(error);
      status.dataset.error = '';
      status.textContent = 'Could not switch characters. Please try again.';
    } finally {
      for (const control of [...modelButtons, download]) control.disabled = false;
    }
  });
  wireframe.addEventListener('click', () => {
    const enabled = wireframe.getAttribute('aria-pressed') !== 'true';
    viewerApi.set_wireframe(viewer, enabled);
    wireframe.setAttribute('aria-pressed', String(enabled));
  });
  reset.addEventListener('click', () => viewerApi.reset_view(viewer));
  canvas.addEventListener('keydown', event => {
    if (viewerApi.navigate(viewer, event.key)) event.preventDefault();
  });
  download.addEventListener('click', async () => {
    for (const control of [...modelButtons, download]) control.disabled = true;
    delete status.dataset.error;
    status.textContent = 'Preparing GLB…';
    try {
      const bytes = await viewerApi.export_model(viewer);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: characters[selected].filename });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = characters[selected].saved;
    } catch (error) {
      console.error(error);
      status.dataset.error = '';
      status.textContent = 'Export failed. Please try again.';
    } finally {
      for (const control of [...modelButtons, download]) control.disabled = false;
    }
  });
} catch (error) {
  stop();
  reportError(error);
}

addEventListener('pagehide', stop);
// A restored back-forward-cache page needs a new WebGL context after disposal.
addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', stop);
  import.meta.hot.dispose(stop);
}
