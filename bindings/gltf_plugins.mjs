import {m,p,expr,nullable,upcast,cls} from './helpers.mjs';
const addon=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'gltf-plugins'}});
const hook=(name,args,js)=>expr('set_'+name,`callback : (${args}) -> Unit`,'Unit',`{ self.${js}=callback; }`);
export const gltfPlugins=[
 addon('GLTFLoaderPlugin','name : String',[
  p('name','String'),hook('before_root','','beforeRoot'),hook('after_root','GLTF','afterRoot'),
  expr('set_before_root_async','callback : () -> @js_async.Promise[Unit]','Unit','{ self.beforeRoot=callback; }'),
  expr('set_after_root_async','callback : (GLTF) -> @js_async.Promise[Unit]','Unit','{ self.afterRoot=callback; }'),
  ...[['node','Object3D','loadNode'],['mesh','Object3D','loadMesh'],['material','Material','loadMaterial'],['texture','Texture','loadTexture'],['attachment','Object3D','createNodeAttachment'],['buffer_view','Bytes','loadBufferView']].map(([name,type,js])=>
   expr('set_load_'+name,`matches : (Int) -> Bool, callback : (Int) -> @js_async.Promise[${type}]`,'Unit',
    `{ self.${js}=index=>matches(index)?callback(index)${type==='Bytes'?'.then(data=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength))':''}:null; }`)),
 ]),
 cls('GLTFParser','',[
  {...expr('json','','Json','JSON.stringify(self.json)'),throws:'SerializationError',jsonResult:true},
  ...[['node','nodes'],['mesh','meshes'],['material','materials'],['texture','textures']].map(([name,key])=>nullable(name+'_definition','index : Int','GLTFDefinition',`self.json.${key}?.[index]`)),
  ...[['node','Object3D'],['mesh','Object3D'],['material','Material'],['texture','Texture'],['accessor','BufferAttribute']].map(([name,type])=>
   ({...expr('get_'+name,'index : Int',type,`self.getDependency("${name}",index)`),throws:'LoadError',async:true,upstream:'getDependency'})),
  {...expr('get_buffer_view','index : Int','Bytes','self.getDependency("bufferView",index).then(data=>new Uint8Array(data).slice())'),throws:'LoadError',async:true,upstream:'getDependency'},
 ],{factory:null}),
 cls('GLTFDefinition','',[
  upcast('user_data','UserData'),
  nullable('extensions','','UserData','self.extensions'),
  {...expr('set_extension','name : String, value : Json','Unit','{ if(!self.extensions)self.extensions={};Object.defineProperty(self.extensions,name,{value:JSON.parse(value),enumerable:true,writable:true,configurable:true}); }'),throws:'SerializationError',jsonArgs:['value']},
  {...expr('json','','Json','JSON.stringify(self)'),throws:'SerializationError',jsonResult:true},
 ],{factory:null}),
 addon('GLTFExporterPlugin','',[
  hook('write_node','Object3D, GLTFDefinition','writeNode'),hook('write_mesh','Mesh, GLTFDefinition','writeMesh'),
  hook('write_texture','Texture, GLTFDefinition','writeTexture'),
  hook('write_material','Material, GLTFDefinition','writeMaterialAsync'),
  expr('set_write_material_async','callback : (Material, GLTFDefinition) -> @js_async.Promise[Unit]','Unit','{ self.writeMaterialAsync=callback; }'),
  ...[['before_parse','beforeParse'],['after_parse','afterParse']].map(([name,js])=>expr('set_'+name,'callback : (FixedArray[Object3D]) -> Unit','Unit',`{ self.${js}=input=>callback(Array.isArray(input)?input.slice():[input]); }`)),
 ]),
 cls('GLTFWriter','',[
  expr('mark_extension','name : String, required : Bool','Unit','{ Object.defineProperty(self.extensionsUsed,name,{value:true,enumerable:true,configurable:true});if(required)Object.defineProperty(self.extensionsRequired,name,{value:true,enumerable:true,configurable:true}); }'),
  {...m('process_texture','texture : Texture','Int','processTextureAsync'),throws:'ExportError',async:true},
 ],{factory:null}),
 ...['GLTFLoaderRegistration','GLTFExporterRegistration'].map(type=>cls(type,'',[
  p('active','Bool'),expr('unregister','','Unit','{ if(self.active){self.owner.unregister(self.callback);self.active=false;} }'),
 ],{factory:null})),
];
export function extendGLTFPlugins(bindings) {
 for(const [type,context,plugin] of [['GLTFLoader','GLTFParser','GLTFLoaderPlugin'],['GLTFExporter','GLTFWriter','GLTFExporterPlugin']]) {
  const registration=type+'Registration';
  bindings.find(b=>b.type===type).methods.push(
   expr('register',`factory : (${context}) -> ${plugin}`,registration,'{ const callback=context=>factory(context);self.register(callback);return {owner:self,callback,active:true}; }'),
   {...expr('unregister',`registration : ${registration}`,'Unit','{ if(registration.owner!==self)throw new TypeError("Registration belongs to a different owner");if(registration.active){self.unregister(registration.callback);registration.active=false;} }'),throws:type==='GLTFLoader'?'LoadError':'ExportError'},
  );
 }
}
