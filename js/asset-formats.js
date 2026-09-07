import {ThreeMFLoader} from 'three/addons/loaders/3MFLoader.js';
import {USDLoader} from 'three/addons/loaders/USDLoader.js';
import {USDZExporter} from 'three/addons/exporters/USDZExporter.js';
import {DRACOExporter} from 'three/addons/exporters/DRACOExporter.js';
import {BufferGeometry,Float32BufferAttribute} from 'three';
export const threeMFLoader=()=>new ThreeMFLoader();
export const uSDLoader=()=>new USDLoader();
export const uSDZExporter=()=>new USDZExporter();
export const uSDZExportOptions=()=>({onlyVisible:true,quickLookCompatible:false,maxTextureSize:1024,includeAnchoringProperties:true,animationFrameRate:30,animations:[]});
export const dRACOExportOptions=()=>({encodeSpeed:5,decodeSpeed:5,encoderMethod:1,quantization:[16,8,8,8,8],exportUvs:true,exportNormals:true,exportColor:false});
const scripts=new Map();
function loadEncoder(url) {
 if(scripts.has(url))return scripts.get(url);
 const job=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=url;
  script.onload=()=>{ if(typeof globalThis.DracoEncoderModule==='function')resolve();else reject(new Error('Script did not install DracoEncoderModule')); };
  script.onerror=()=>reject(new Error(`Unable to load Draco encoder: ${url}`));
  document.head.appendChild(script);
 }).catch(error=>{scripts.delete(url);throw error;});
 scripts.set(url,job);return job;
}
async function parseDraco(object,options={}) {
 const settings={...dRACOExportOptions(),...options};
 for(const speed of [settings.encodeSpeed,settings.decodeSpeed]) {
  if(!Number.isInteger(speed)||speed<0||speed>10)throw new RangeError('Draco speeds must be between 0 and 10');
 }
 if(![0,1].includes(settings.encoderMethod)||!settings.quantization.every(bits=>Number.isInteger(bits)&&bits>=0&&bits<=30))throw new RangeError('Invalid Draco encoding method or quantization');
 if(!object.isMesh&&!object.isPoints)throw new TypeError('Mesh or Points required');
 const source=object.geometry,position=source.getAttribute('position');
 if(!position||position.itemSize!==3||position.count===0)throw new TypeError('Nonempty three-component positions required');
 const geometry=new BufferGeometry();
 try {
  const attributes=[['position',3]];
  if(object.isMesh&&settings.exportNormals&&source.hasAttribute('normal'))attributes.push(['normal',3]);
  if(object.isMesh&&settings.exportUvs&&source.hasAttribute('uv'))attributes.push(['uv',2]);
  if(settings.exportColor&&source.hasAttribute('color'))attributes.push(['color',source.getAttribute('color').itemSize]);
  for(const [name,size] of attributes) {
   const input=source.getAttribute(name);
   if(input.count!==position.count||input.itemSize!==size||(name==='color'&&![3,4].includes(size)))throw new TypeError('Incompatible Draco attribute layout');
   const output=new Float32BufferAttribute(input.count*size,size);
   for(let i=0;i<input.count;i++)for(let j=0;j<size;j++) {
    const value=input[['getX','getY','getZ','getW'][j]](i);
    if(!Number.isFinite(value))throw new TypeError('Finite Draco attributes required');
    output.setComponent(i,j,value);
   }
   geometry.setAttribute(name,output);
  }
  if(object.isMesh) {
   const count=source.index?.count??position.count;
   if(count%3!==0)throw new RangeError('Complete triangles required');
   const indices=Array.from({length:count},(_,i)=>source.index?source.index.getX(i):i);
   if(indices.some(index=>!Number.isInteger(index)||index<0||index>=position.count))throw new RangeError('Draco index out of bounds');
   // The pinned native nonindexed branch passes vertex count as face count.
   geometry.setIndex(indices);
  }
  return await DRACOExporter.prototype.parseAsync.call(this,{isMesh:object.isMesh,isPoints:object.isPoints,geometry},settings);
 } finally {geometry.dispose();}
}
export const dRACOExporter=()=>Object.assign(new DRACOExporter(),{loadEncoder,parseAsync:parseDraco});
