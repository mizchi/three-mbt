import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { PLYExporter } from 'three/addons/exporters/PLYExporter.js';
export const sVGLoader = () => new SVGLoader();
export const strokeStyle = (width, color, join, cap, limit) => SVGLoader.getStrokeStyle(width, color, ['miter', 'round', 'bevel'][join], ['butt', 'round', 'square'][cap], limit);
export const fontLoader = () => new FontLoader();
export const textGeometryOptions = (font, size, depth) => ({font, size, depth, steps: 1, curveSegments: 12, bevelEnabled: false, bevelThickness: 10, bevelSize: 8, bevelOffset: 0, bevelSegments: 3});
// TextGeometry fills defaults into its options. Keep the caller's object intact.
export const textGeometry = (text, options) => new TextGeometry(text, {...options});
export const mTLLoader = () => new MTLLoader();
export const mTLMaterialOptions = () => ({side: 0, wrap: 1000, normalizeRGB: false, ignoreZeroRGBs: false, invertTrProperty: false});
export const pLYLoader = () => new PLYLoader();
export const pLYExporter = () => new PLYExporter();
export const pLYPropertyNames = () => Object.create(null);
export const pLYCustomProperties = () => Object.create(null);
export const pLYExportOptions = () => ({littleEndian: false, excludeAttributes: [], customPropertyMapping: Object.create(null)});
