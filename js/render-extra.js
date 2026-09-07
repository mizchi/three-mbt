import {Uniform,DataTexture,RGBAFormat,FloatType} from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
export const uniform=value=>new Uniform(value);
export const shaderPass=(material,textureID)=>new ShaderPass(material,textureID);
export const gTAOPass=(scene,camera,width,height)=>new GTAOPass(scene,camera,width,height);
export const sMAAPass=()=>new SMAAPass();
export const bokehPass=(scene,camera,focus,aperture,maxblur)=>new BokehPass(scene,camera,{focus,aperture,maxblur});
export const gTAOSettings=()=>({});
export const denoiseSettings=()=>({});
export const dataTextureFloat=(values,width,height)=>{
 if(width<=0||height<=0||values.length!==width*height*4)throw new RangeError('RGBA float dimensions must match data length');
 return new DataTexture(Float32Array.from(values),width,height,RGBAFormat,FloatType);
};
