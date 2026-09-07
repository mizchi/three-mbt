import { SelectionBox } from 'three/addons/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/addons/interactive/SelectionHelper.js';
import { NURBSCurve } from 'three/addons/curves/NURBSCurve.js';
import { NURBSSurface } from 'three/addons/curves/NURBSSurface.js';
import { Flow, InstancedFlow } from 'three/addons/modifiers/CurveModifier.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { VertexTangentsHelper } from 'three/addons/helpers/VertexTangentsHelper.js';
export const selectionBox = (camera, scene, depth) => new SelectionBox(camera, scene, depth);
export const selectionHelper = (renderer, cssClass) => new SelectionHelper(renderer, cssClass);
export const nURBSCurve = (degree, knots, points) => new NURBSCurve(degree, knots.slice(), points);
export const nURBSSurface = (u, v, knotsU, knotsV, points) => new NURBSSurface(u, v, knotsU.slice(), knotsV.slice(), points);
export const flow = (mesh, count) => new Flow(mesh, count);
export const instancedFlow = (count, curveCount, geometry, material) => new InstancedFlow(count, curveCount, geometry, material);
export const decalGeometry = (mesh, position, orientation, size) => new DecalGeometry(mesh, position, orientation, size);
export const vertexNormalsHelper = (object, size, color) => new VertexNormalsHelper(object, size, color);
export const vertexTangentsHelper = (object, size, color) => new VertexTangentsHelper(object, size, color);
export const uVGenerator = (top, side) => ({
  generateTopUV: (geometry, vertices, a, b, c) => {
    const result = top(geometry, vertices, a, b, c);
    if (result.length !== 3) throw new TypeError('Top UV callback must return three Vector2 values');
    return result;
  },
  generateSideWallUV: (geometry, vertices, a, b, c, d) => {
    const result = side(geometry, vertices, a, b, c, d);
    if (result.length !== 4) throw new TypeError('Side UV callback must return four Vector2 values');
    return result;
  },
});
