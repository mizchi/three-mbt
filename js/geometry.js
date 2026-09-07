import { Uint8BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute, Int32BufferAttribute, InstancedBufferAttribute, InterleavedBuffer } from 'three';
export const uint8Attribute = (values, itemSize, normalized) => new Uint8BufferAttribute(values, itemSize, normalized);
export const uint16Attribute = (values, itemSize, normalized) => new Uint16BufferAttribute(values, itemSize, normalized);
export const uint32Attribute = (values, itemSize, normalized) => new Uint32BufferAttribute(values, itemSize, normalized);
export const int32Attribute = (values, itemSize, normalized) => new Int32BufferAttribute(values, itemSize, normalized);
export const instancedBufferAttribute = (values, itemSize, normalized, meshPerAttribute) => new InstancedBufferAttribute(new Float32Array(values), itemSize, normalized, meshPerAttribute);
export const interleavedBuffer = (values, stride) => new InterleavedBuffer(new Float32Array(values), stride);

import { CatmullRomCurve3, CurvePath } from 'three';
export const catmullRomCurve3 = (points, closed, type, tension) => new CatmullRomCurve3(points.slice(), closed, ['centripetal', 'chordal', 'catmullrom'][type], tension);
export const curvePath2 = () => new CurvePath();
export const curvePath3 = () => new CurvePath();
export const extrudeOptions = () => ({ depth: 1, steps: 1, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.1, bevelOffset: 0, bevelSegments: 3, curveSegments: 12 });

import { InstancedInterleavedBuffer, Float16BufferAttribute, DataUtils } from 'three';
export const instancedInterleavedBuffer = (values, stride, meshPerAttribute) => new InstancedInterleavedBuffer(new Float32Array(values), stride, meshPerAttribute);
export const float16AttributeFromFloats = (values, itemSize) => new Float16BufferAttribute(values.map(value => DataUtils.toHalfFloat(value)), itemSize);
