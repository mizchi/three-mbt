import {m,p,rw,expr,upcast,cls} from './helpers.mjs';
const addon=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'asset-extra'}});
const load=type=>({...m('load','url : String',type,'loadAsync'),throws:'LoadError',async:true});
const bytes='data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)';
export const assetExtra=[
 addon('FBXLoader','',[upcast('loader','Loader'),load('Group'),
  {...expr('parse','data : Bytes, path : String','Group',`self.parse(${bytes},path)`),throws:'LoadError'},
  {...expr('parse_ascii','text : String, path : String','Group','self.parse(new TextEncoder().encode(text).buffer,path)'),throws:'LoadError',upstream:'parse'},
 ]),
 addon('ColladaLoader','',[upcast('loader','Loader'),
  {...expr('load','url : String','ColladaResult','self.loadAsync(url).then(result=>{if(!result)throw new Error("Invalid Collada document");return result;})'),throws:'LoadError',async:true},
  {...expr('parse','text : String, path : String','ColladaResult','{ const result=self.parse(text,path);if(!result)throw new Error("Invalid Collada document");return result; }'),throws:'LoadError'},
 ]),
 cls('ColladaResult','',[p('scene','Object3D'),expr('animations','','FixedArray[AnimationClip]','self.scene.animations.slice()')],{factory:null}),
 addon('Rhino3dmLoader','',[upcast('loader','Loader'),load('Object3D'),
  {...expr('parse','data : Bytes','Object3D',`new Promise((resolve,reject)=>self.parse(${bytes},resolve,reject))`),throws:'LoadError',async:true},
  m('set_library_path','path : String','Rhino3dmLoader','setLibraryPath'),m('set_worker_limit','count : Int','Rhino3dmLoader','setWorkerLimit'),m('dispose','','Rhino3dmLoader'),
 ]),
 addon('BVHLoader','',[upcast('loader','Loader'),load('BVHResult'),
  {...m('parse','text : String','BVHResult'),throws:'LoadError'},
  ...rw('animate_bone_positions','Bool','animateBonePositions'),...rw('animate_bone_rotations','Bool','animateBoneRotations'),
 ]),
 cls('BVHResult','',[p('skeleton','Skeleton'),p('clip','AnimationClip')],{factory:null}),
 addon('EXRExportOptions','',[...rw('data_type','HDRDataType','type')]),
 addon('EXRExporter','',[
  {...m('export_texture','texture : DataTexture, options : EXRExportOptions','Bytes','parse'),throws:'ExportError',async:true},
  {...m('export_target','renderer : WebGLRenderer, target : WebGLRenderTarget, options : EXRExportOptions','Bytes','parse'),throws:'ExportError',async:true},
 ]),
 addon('KTX2Exporter','',[
  ...[['texture','DataTexture'],['volume','Data3DTexture']].map(([name,type])=>({...m('export_'+name,`texture : ${type}`,'Bytes','parse'),throws:'ExportError',async:true})),
  {...m('export_target','renderer : WebGLRenderer, target : WebGLRenderTarget','Bytes','parse'),throws:'ExportError',async:true},
 ]),
 addon('WebGLTextureUtils','',[{...m('decompress','texture : Texture, max_size : Int','Texture'),throws:'ExportError'}]),
];
