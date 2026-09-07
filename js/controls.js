import { MapControls } from 'three/addons/controls/MapControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
export const mapControls = (camera, canvas) => new MapControls(camera, canvas);
export const transformControls = (camera, canvas) => new TransformControls(camera, canvas);
export const pointerLockControls = (camera, canvas) => new PointerLockControls(camera, canvas);
