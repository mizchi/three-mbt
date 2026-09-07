// Original triangle fixtures; only the embedded UASTC texture is third-party (see README.md).
import draco from 'draco3d';
import { MeshoptEncoder } from 'meshoptimizer';
import { readFileSync } from 'node:fs';
import { writeGLB } from './glb.mjs';
const positions = new Float32Array([-1,-1,0, 1,-1,0, 0,1,0]);
const base = () => ({
  asset: { version: '2.0', generator: 'three-mbt compressed fixture' },
  scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
  materials: [{ extensions: { KHR_materials_unlit: {} }, pbrMetallicRoughness: { baseColorFactor: [1,0,0,1] } }],
  extensionsUsed: ['KHR_materials_unlit'],
  accessors: [{ componentType: 5126, count: 3, type: 'VEC3', min: [-1,-1,0], max: [1,1,0] }],
});
const encoderModule = await draco.createEncoderModule({});
const builder = new encoderModule.MeshBuilder();
const mesh = new encoderModule.Mesh();
const encoder = new encoderModule.Encoder();
const encoded = new encoderModule.DracoInt8Array();
builder.AddFacesToMesh(mesh, 1, new Uint32Array([0,1,2]));
const attribute = builder.AddFloatAttributeToMesh(mesh, encoderModule.POSITION, 3, 3, positions);
encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);
const length = encoder.EncodeMeshToDracoBuffer(mesh, encoded);
if(length <= 0) throw new Error('Draco fixture encoding failed');
const dracoBytes = Buffer.from(Array.from({length}, (_, i) => encoded.GetValue(i) & 255));
const dracoModel = base();
dracoModel.extensionsUsed.push('KHR_draco_mesh_compression');
dracoModel.extensionsRequired = ['KHR_draco_mesh_compression'];
dracoModel.buffers = [{ byteLength: dracoBytes.length }];
dracoModel.bufferViews = [{ buffer: 0, byteLength: dracoBytes.length }];
dracoModel.meshes[0].primitives[0].extensions = { KHR_draco_mesh_compression: { bufferView: 0, attributes: { POSITION: attribute } } };
writeGLB('draco.glb', dracoModel, dracoBytes);
for (const value of [encoded, encoder, mesh, builder]) encoderModule.destroy(value);

await MeshoptEncoder.ready;
const meshoptBytes = Buffer.from(MeshoptEncoder.encodeGltfBuffer(new Uint8Array(positions.buffer), 3, 12, 'ATTRIBUTES'));
const meshoptModel = base();
meshoptModel.extensionsUsed.push('EXT_meshopt_compression');
meshoptModel.extensionsRequired = ['EXT_meshopt_compression'];
meshoptModel.buffers = [{ byteLength: meshoptBytes.length }, { byteLength: 36, extensions: { EXT_meshopt_compression: { fallback: true } } }];
meshoptModel.bufferViews = [{ buffer: 1, byteLength: 36, byteStride: 12, extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: 0, byteLength: meshoptBytes.length, byteStride: 12, count: 3, mode: 'ATTRIBUTES', filter: 'NONE' } } }];
meshoptModel.accessors[0].bufferView = 0;
writeGLB('meshopt.glb', meshoptModel, meshoptBytes);

const texture = readFileSync(new URL('2d_uastc.ktx2', import.meta.url));
const uv = Buffer.from(new Float32Array([0,0, 1,0, 0.5,1]).buffer);
const basisBytes = Buffer.concat([Buffer.from(positions.buffer), uv, texture]);
const basisModel = base();
basisModel.extensionsUsed.push('KHR_texture_basisu');
basisModel.extensionsRequired = ['KHR_texture_basisu'];
basisModel.buffers = [{ byteLength: basisBytes.length }];
basisModel.bufferViews = [{ buffer: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 24 }, { buffer: 0, byteOffset: 60, byteLength: texture.length }];
basisModel.accessors[0].bufferView = 0;
basisModel.accessors.push({ bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' });
basisModel.meshes[0].primitives[0].attributes.TEXCOORD_0 = 1;
basisModel.materials[0].pbrMetallicRoughness = { baseColorTexture: { index: 0 } };
basisModel.images = [{ bufferView: 2, mimeType: 'image/ktx2' }];
basisModel.textures = [{ extensions: { KHR_texture_basisu: { source: 0 } } }];
writeGLB('basis.glb', basisModel, basisBytes);
