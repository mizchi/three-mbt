import { RawShaderMaterial } from 'three';
export const rawShaderMaterial = (vertexShader, fragmentShader, uniforms) => new RawShaderMaterial({vertexShader,fragmentShader,uniforms});
