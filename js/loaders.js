import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const gLTFLoader = () => new GLTFLoader();
export const hDRLoader = () => new HDRLoader();
export const eXRLoader = () => new EXRLoader();
export const gltfLoaderWithManager = manager => new GLTFLoader(manager);
export const dRACOLoader = () => new DRACOLoader();
export const kTX2Loader = () => new KTX2Loader();
export const orbitControls = (camera, canvas) => new OrbitControls(camera, canvas);
export const enableMeshopt = loader => loader.setMeshoptDecoder(MeshoptDecoder);

export const textureDictionary = () => Object.create(null);
export const requestHeaders = () => Object.create(null);
