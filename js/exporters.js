import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
export const gLTFExporter = () => new GLTFExporter();
export const gLTFExportOptions = () => ({ trs: false, onlyVisible: true, maxTextureSize: Infinity, animations: [], includeCustomExtensions: false });
// Snapshot options before starting asynchronous work. Format is fixed by the typed entry point.
export const exportGLB = (exporter, root, options) => {
  const snapshot = { ...options, animations: options.animations.slice(), binary: true };
  return exporter.parseAsync(root, snapshot).then(buffer => new Uint8Array(buffer));
};
export const exportGLTF = (exporter, root, options) => {
  const snapshot = { ...options, animations: options.animations.slice(), binary: false };
  return exporter.parseAsync(root, snapshot).then(json => JSON.stringify(json));
};
