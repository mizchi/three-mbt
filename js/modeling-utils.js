import {
  mergeAttributes, interleaveAttributes, deinterleaveAttribute, deepCloneAttribute,
  computeMorphedAttributes, computeMikkTSpaceTangents,
} from 'three/addons/utils/BufferGeometryUtils.js';
import * as MikkTSpace from 'three/addons/libs/mikktspace.module.js';

// These native utilities lose Float16BufferAttribute's decoded accessors when
// constructing the result. Reject that case rather than returning corrupt data.
export function mergePackedAttributes(attributes) {
  if (!attributes.length || attributes.some(a => a.isFloat16BufferAttribute)) return null;
  const first = attributes[0];
  if (attributes.some(a => a.array.constructor !== first.array.constructor || a.itemSize !== first.itemSize || a.normalized !== first.normalized || a.gpuType !== first.gpuType)) return null;
  return mergeAttributes(attributes);
}
export function interleavePackedAttributes(attributes) {
  if (!attributes.length || attributes.some(a => a.isFloat16BufferAttribute || a.itemSize < 1 || a.itemSize > 4)) return null;
  const first = attributes[0];
  if (attributes.some(a => a.array.constructor !== first.array.constructor || a.count !== first.count)) return null;
  return interleaveAttributes(attributes);
}
export { deinterleaveAttribute };
export const cloneAttribute = attribute => attribute.isFloat16BufferAttribute ? attribute.clone() : deepCloneAttribute(attribute);
export function morphedAttributes(object) {
  try { return {ok: true, value: computeMorphedAttributes(object)}; }
  catch (error) { return {ok: false, error: String(error)}; }
}
export async function mikkTangents(geometry, negateSign) {
  for (const name of ['position', 'normal', 'uv']) {
    const attribute = geometry.getAttribute(name);
    if (!attribute) throw new TypeError(`MikkTSpace requires ${name}`);
    if (attribute.isFloat16BufferAttribute) throw new TypeError('Convert half-float attributes to Float32 before generating tangents');
  }
  await MikkTSpace.ready;
  return computeMikkTSpaceTangents(geometry, MikkTSpace, negateSign);
}
