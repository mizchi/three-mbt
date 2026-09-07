import {Source} from 'three';
export const shaderDefines=()=>Object.create(null);
export function textureMipLevel(data,width,height) {
 if(width<=0 || height<=0 || data.length!==width*height*4)throw new RangeError('RGBA8 dimensions must match the byte length');
 return {data:data.slice(),width,height};
}
export const sourceRGBA=(data,width,height)=>new Source(textureMipLevel(data,width,height));
export const sourceCanvas=canvas=>new Source(canvas);
