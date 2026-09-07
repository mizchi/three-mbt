import {HalfFloatType} from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {ColladaLoader} from 'three/addons/loaders/ColladaLoader.js';
import {Rhino3dmLoader} from 'three/addons/loaders/3DMLoader.js';
import {BVHLoader} from 'three/addons/loaders/BVHLoader.js';
import {EXRExporter} from 'three/addons/exporters/EXRExporter.js';
import {KTX2Exporter} from 'three/addons/exporters/KTX2Exporter.js';
import {decompress} from 'three/addons/utils/WebGLTextureUtils.js';
export const fBXLoader=()=>new FBXLoader();
export const colladaLoader=()=>new ColladaLoader();
export const rhino3dmLoader=()=>new Rhino3dmLoader();
export const bVHLoader=()=>new BVHLoader();
export const eXRExporter=()=>new EXRExporter();
export const kTX2Exporter=()=>new KTX2Exporter();
// The pinned native ZIP paths corrupt short blocks and expanded compressed data.
// Use lossless uncompressed scanlines until upstream fixes those cases.
export const eXRExportOptions=()=>({compression:0,type:HalfFloatType});
export const webGLTextureUtils=()=>({decompress:(texture,maxSize)=>decompress(texture,maxSize)});
