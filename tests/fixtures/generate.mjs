import { writeGLB } from './glb.mjs';
// Original deterministic glTF 2.0 fixture: one red triangle, camera, and translation animation.
import { writeFileSync } from 'node:fs';

const floats = new Float32Array([-1,-1,0, 1,-1,0, 0,1,0, 0,1, 0,0,0, 2,0,0]);
const binary = Buffer.from(floats.buffer);
const model = {
  asset: { version: '2.0', generator: 'three-mbt test fixture' },
  scene: 0, scenes: [{ nodes: [0, 1] }],
  nodes: [{ name: 'Triangle', mesh: 0 }, { camera: 0, translation: [0, 0, 5] }],
  cameras: [{ type: 'perspective', perspective: { yfov: 1, znear: 0.1, zfar: 100 } }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
  materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1], metallicFactor: 0, roughnessFactor: 1 } }],
  buffers: [{ byteLength: binary.length }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 8 }, { buffer: 0, byteOffset: 44, byteLength: 24 }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1,-1,0], max: [1,1,0] },
    { bufferView: 1, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] },
    { bufferView: 2, componentType: 5126, count: 2, type: 'VEC3' },
  ],
  animations: [{ name: 'Move', channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }], samplers: [{ input: 1, output: 2, interpolation: 'LINEAR' }] }],
};
const json = Buffer.from(JSON.stringify(model));
const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
json.copy(padded);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + padded.length + 8 + binary.length, 8);
const chunk = (data, type) => { const head = Buffer.alloc(8); head.writeUInt32LE(data.length, 0); head.writeUInt32LE(type, 4); return Buffer.concat([head, data]); };
writeFileSync(new URL('triangle.glb', import.meta.url), Buffer.concat([header, chunk(padded, 0x4e4f534a), chunk(binary, 0x004e4942)]));
model.buffers[0].uri = 'triangle.bin';
writeFileSync(new URL('triangle.gltf', import.meta.url), JSON.stringify(model, null, 2) + '\n');
writeFileSync(new URL('triangle.bin', import.meta.url), binary);
model.images = [{ uri: 'pixel.png' }];
model.textures = [{ source: 0 }];
model.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0 };
writeFileSync(new URL('textured.gltf', import.meta.url), JSON.stringify(model, null, 2) + '\n');


const morphBinary = Buffer.from(new Float32Array([-1,-1,0, 1,-1,0, 0,1,0, 2,0,0, 0,0,0, 0,0,0]).buffer);
writeGLB('morph.glb', {
  asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, extras: { category: 'face', selectable: false, priority: 0, metadata: { author: 'three-mbt' } } }],
  meshes: [{ weights: [0.25], extras: { targetNames: ['Smile'] }, primitives: [{ attributes: { POSITION: 0 }, targets: [{ POSITION: 1 }] }] }],
  buffers: [{ byteLength: morphBinary.length }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 36 }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1,-1,0], max: [1,1,0] },
    { bufferView: 1, componentType: 5126, count: 3, type: 'VEC3', min: [0,0,0], max: [2,0,0] },
  ],
}, morphBinary);

// Radiance RGBE, 64x32, constant warm environment. Each scanline is RLE encoded.
const hdrHeader = Buffer.from('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 32 +X 64\n');
const hdrRow = Buffer.from([2,2,0,64, 192,128, 192,64, 192,32, 192,129]);
writeFileSync(new URL('studio.hdr', import.meta.url), Buffer.concat([hdrHeader, ...Array(32).fill(hdrRow)]));

// OpenEXR v2: a 2x1, uncompressed scanline with float channels A/B/G/R.
const i32 = value => { const b = Buffer.alloc(4); b.writeInt32LE(value); return b; };
const f32 = value => { const b = Buffer.alloc(4); b.writeFloatLE(value); return b; };
const zstr = value => Buffer.from(value + '\0');
const attribute = (name, type, data) => Buffer.concat([zstr(name), zstr(type), i32(data.length), data]);
const channelList = Buffer.concat([...['A','B','G','R'].map(name => Buffer.concat([zstr(name), i32(2), Buffer.alloc(4), i32(1), i32(1)])), Buffer.from([0])]);
const window = Buffer.concat([i32(0), i32(0), i32(1), i32(0)]);
const exrHeader = Buffer.concat([
  i32(20000630), i32(2), attribute('channels', 'chlist', channelList), attribute('compression', 'compression', Buffer.from([0])),
  attribute('dataWindow', 'box2i', window), attribute('displayWindow', 'box2i', window),
  attribute('lineOrder', 'lineOrder', Buffer.from([0])), attribute('pixelAspectRatio', 'float', f32(1)),
  attribute('screenWindowCenter', 'v2f', Buffer.concat([f32(0), f32(0)])), attribute('screenWindowWidth', 'float', f32(1)), Buffer.from([0]),
]);
const scanline = Buffer.concat([i32(0), i32(32), ...[1,0.25,0.5,1].flatMap(value => [f32(value), f32(value)])]);
const offset = Buffer.alloc(8); offset.writeBigUInt64LE(BigInt(exrHeader.length + 8));
writeFileSync(new URL('studio.exr', import.meta.url), Buffer.concat([exrHeader, offset, scanline]));

// A skinned triangle and a single animated bone, all below one scene root.
const skinPositions = Buffer.from(new Float32Array([-1,-1,0, 1,-1,0, 0,1,0]).buffer);
const skinJoints = Buffer.alloc(24);
const skinWeights = Buffer.from(new Float32Array([1,0,0,0, 1,0,0,0, 1,0,0,0]).buffer);
const skinAnimation = Buffer.from(new Float32Array([0,1, 0,0,0, 2,0,0]).buffer);
const skinBinary = Buffer.concat([skinPositions, skinJoints, skinWeights, skinAnimation]);
writeGLB('skinned.glb', {
  asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0, 1] }],
  nodes: [{ name: 'Joint' }, { name: 'Character', mesh: 0, skin: 0 }],
  skins: [{ joints: [0] }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }] }],
  buffers: [{ byteLength: skinBinary.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 24 },
    { buffer: 0, byteOffset: 60, byteLength: 48 }, { buffer: 0, byteOffset: 108, byteLength: 8 },
    { buffer: 0, byteOffset: 116, byteLength: 24 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1,-1,0], max: [1,1,0] },
    { bufferView: 1, componentType: 5123, count: 3, type: 'VEC4' },
    { bufferView: 2, componentType: 5126, count: 3, type: 'VEC4' },
    { bufferView: 3, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] },
    { bufferView: 4, componentType: 5126, count: 2, type: 'VEC3' },
  ],
  animations: [{ name: 'MoveJoint', channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }], samplers: [{ input: 3, output: 4 }] }],
}, skinBinary);

const physicalExtensions = {
  KHR_materials_clearcoat: { clearcoatFactor: 0.8, clearcoatRoughnessFactor: 0.2 },
  KHR_materials_transmission: { transmissionFactor: 0.9 },
  KHR_materials_volume: { thicknessFactor: 0.5, attenuationDistance: 2, attenuationColor: [0.8, 0.9, 1] },
  KHR_materials_ior: { ior: 1.4 },
  KHR_materials_iridescence: { iridescenceFactor: 0.3, iridescenceIor: 1.2, iridescenceThicknessMinimum: 120, iridescenceThicknessMaximum: 350 },
  KHR_materials_sheen: { sheenColorFactor: [0.4, 0.2, 0.1], sheenRoughnessFactor: 0.6 },
  KHR_materials_specular: { specularFactor: 0.7, specularColorFactor: [1, 0.8, 0.6] },
  KHR_materials_anisotropy: { anisotropyStrength: 0.4, anisotropyRotation: 0.5 },
  KHR_materials_dispersion: { dispersion: 0.25 },
};
writeGLB('physical.glb', {
  asset: { version: '2.0' }, extensionsUsed: Object.keys(physicalExtensions),
  scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
  materials: [{ pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.3 }, extensions: physicalExtensions }],
  buffers: [{ byteLength: skinPositions.length }], bufferViews: [{ buffer: 0, byteLength: skinPositions.length }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1,-1,0], max: [1,1,0] }],
}, skinPositions);

await import("./compressed.mjs");
await import('./images.mjs');
