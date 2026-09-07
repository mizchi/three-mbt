import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const parametricGeometry = (surface, slices, stacks) => new ParametricGeometry(surface, slices, stacks);
export const convexGeometry = points => new ConvexGeometry(points);
export const roundedBoxGeometry = (width, height, depth, segments, radius) => new RoundedBoxGeometry(width, height, depth, segments, radius);

import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
import { EdgeSplitModifier } from 'three/addons/modifiers/EdgeSplitModifier.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
export const tessellateModifier = (maxEdgeLength, maxIterations) => new TessellateModifier(maxEdgeLength, maxIterations);
export const simplifyModifier = () => new SimplifyModifier();
export const edgeSplitModifier = () => new EdgeSplitModifier();
export const oBJExporter = () => new OBJExporter();
export const sTLExporter = () => new STLExporter();
export const oBJLoader = () => new OBJLoader();
export const sTLLoader = () => new STLLoader();
