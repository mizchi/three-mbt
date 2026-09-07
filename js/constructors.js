// #module imports callable exports. ES classes need an explicit `new`.
import { Vector2, Vector3, Euler, Quaternion, Matrix4, Color, Object3D, Group, Scene } from 'three';
import { WebGLRenderer, WebGLRenderTarget, ShaderMaterial } from 'three';
import { DataUtils, HalfFloatType } from 'three';
export * from './core-factories.js';

export const vector2 = (x, y) => new Vector2(x, y);
export const vector3 = (x, y, z) => new Vector3(x, y, z);
export const euler = (x, y, z, order) => new Euler(x, y, z, order);
export const quaternion = (x, y, z, w) => new Quaternion(x, y, z, w);
export const matrix4 = () => new Matrix4();
export const colorHex = (hex) => new Color(hex);
export const colorRGB = (r, g, b) => new Color(r, g, b);
export const object3D = () => new Object3D();
export const group = () => new Group();
export const scene = () => new Scene();
export const webGLRenderer = (antialias, alpha) => new WebGLRenderer({ antialias, alpha });
export const webGLRendererWithCanvas = (canvas, antialias, alpha) => new WebGLRenderer({ canvas, antialias, alpha });
export const shaderMaterial = (vertexShader, fragmentShader, uniforms) => new ShaderMaterial({ vertexShader, fragmentShader, uniforms });
export const dataTextureValues = texture => texture.type === HalfFloatType
  ? Array.from(texture.image.data, value => DataUtils.fromHalfFloat(value))
  : Array.from(texture.image.data);

export const renderTargetWithAttachments = (width, height, count) => new WebGLRenderTarget(width, height, { count });

export const colorHSL = (h, s, l) => ({ h, s, l });
