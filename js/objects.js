import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
export const lineGeometry = () => new LineGeometry();
export const lineMaterial = (color,linewidth) => new LineMaterial({color,linewidth});
export const line2 = (geometry,material) => new Line2(geometry,material);
export const initAreaLights = () => RectAreaLightUniformsLib.init();
