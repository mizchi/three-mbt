import {m,p,rw,expr,upcast,cls} from './helpers.mjs';
const addon=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'asset-formats'}});
const load=returns=>({...expr('load','url : String',returns,'self.loadAsync(url)'),throws:'LoadError',async:true,upstream:'loadAsync'});
export const assetFormats=[
 addon('ThreeMFLoader','',[upcast('loader','Loader'),load('Group'),{...expr('parse','data : Bytes','Group','self.parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength))'),throws:'LoadError'}]),
 addon('USDLoader','',[upcast('loader','Loader'),load('Group'),
  {...expr('parse','data : Bytes, path : String','Group','new Promise((resolve,reject)=>self.parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),path,resolve,reject))'),throws:'LoadError',async:true},
  {...expr('parse_ascii','text : String, path : String','Group','new Promise((resolve,reject)=>self.parse(text,path,resolve,reject))'),throws:'LoadError',async:true,upstream:'parse'},
 ]),
 addon('USDZExportOptions','',[
  ...rw('only_visible','Bool','onlyVisible'),...rw('quick_look_compatible','Bool','quickLookCompatible'),...rw('max_texture_size','Int','maxTextureSize'),...rw('include_anchoring_properties','Bool','includeAnchoringProperties'),...rw('animation_frame_rate','Double','animationFrameRate'),
  expr('set_animations','clips : FixedArray[AnimationClip]','Unit','{ self.animations = clips.slice(); }'),
 ]),
 addon('USDZExporter','',[{...expr('export_usdz','root : Object3D, options : USDZExportOptions','Bytes','self.parseAsync(root,{...options,animations:options.animations.slice()})'),throws:'ExportError',async:true,upstream:'parseAsync'}]),
 addon('DRACOExportOptions','',[
  ...rw('encode_speed','Int','encodeSpeed'),...rw('decode_speed','Int','decodeSpeed'),...rw('encoding_method','DracoEncodingMethod','encoderMethod'),
  ...rw('export_uvs','Bool','exportUvs'),...rw('export_normals','Bool','exportNormals'),...rw('export_color','Bool','exportColor'),
  expr('set_quantization','position : Int, normal : Int, color : Int, uv : Int, generic : Int','Unit','{ self.quantization = [position,normal,color,uv,generic]; }'),
 ]),
 addon('DRACOExporter','',[
  {...expr('load_encoder','url : String','Unit','self.loadEncoder(url)'),throws:'LoadError',async:true},
  ...[['mesh','Mesh'],['points','Points']].map(([name,type])=>({...expr(`export_${name}`,`object : ${type}, options : DRACOExportOptions`,'Bytes','self.parseAsync(object,{...options,quantization:options.quantization.slice()}).then(data=>new Uint8Array(data.buffer,data.byteOffset,data.byteLength).slice())'),throws:'ExportError',async:true,upstream:'parseAsync'})),
 ]),
];
