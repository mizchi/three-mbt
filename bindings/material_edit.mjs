import {m,p,rw,expr,nullable,cls} from './helpers.mjs';
const custom=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'material-edit'}});
export const materialEdit=[
 custom('ShaderDefines','',[
  ...[['int','Int','Number.isInteger(value) && value >= -2147483648 && value <= 2147483647'],['float','Double','typeof value === "number"'],['bool','Bool','typeof value === "boolean"'],['string','String','typeof value === "string"']].flatMap(([name,type,check])=>[
   expr(`set_${name}`,`name : String, value : ${type}`,'Unit','{ self[name] = value; }'),
   nullable(`get_${name}`,'name : String',type,`{ const value = self[name]; return Object.hasOwn(self,name) && ${check} ? value : null; }`),
  ]),expr('remove','name : String','Unit','{ delete self[name]; }'),expr('keys','','FixedArray[String]','Object.keys(self)'),
 ]),
 cls('ShaderProgram','',[...rw('vertex_shader','String','vertexShader'),...rw('fragment_shader','String','fragmentShader'),p('uniforms','Uniforms')],{factory:null}),
 cls('RenderContext','',[p('renderer','WebGLRenderer'),p('scene','Scene'),p('camera','Camera'),p('geometry','BufferGeometry'),p('object','Object3D'),p('material','Material'),nullable('group','','GeometryGroup','self.group')],{factory:null}),
 {...cls('Source','',[p('uuid','String'),p('version','Int'),...rw('data_ready','Bool','dataReady'),m('get_size','target : Vector3','Vector3','getSize'),
   expr('mark_needs_update','','Unit','{ self.needsUpdate = true; }'),nullable('rgba_bytes','','Bytes','self.data?.data instanceof Uint8Array ? self.data.data.slice() : null'),
  ]),factories:[{name:'from_rgba',args:'data : Bytes, width : Int, height : Int',js:'sourceRGBA',module:'material-edit'},{name:'from_canvas',args:'canvas : Canvas',js:'sourceCanvas',module:'material-edit'}]},
 custom('TextureMipLevel','data : Bytes, width : Int, height : Int',[p('width','Int'),p('height','Int'),expr('bytes','','Bytes','self.data.slice()')]),
];
export function extendMaterialEdit(bindings) {
 const add=(type,methods)=>bindings.find(b=>b.type===type).methods.push(...methods);
 add('Material',[
  nullable('defines','','ShaderDefines','self.defines'),expr('set_defines','defines : ShaderDefines','Unit','{ self.defines = {...defines}; self.needsUpdate = true; }'),
  expr('set_on_before_compile','callback : (ShaderProgram, WebGLRenderer) -> Unit, cache_key : String','Unit','{ self.onBeforeCompile = callback; self.customProgramCacheKey = () => cache_key; self.needsUpdate = true; }'),
  expr('clear_on_before_compile','','Unit','{ self.onBeforeCompile = () => {}; self.customProgramCacheKey = () => ""; self.needsUpdate = true; }'),
  expr('set_on_before_render','callback : (RenderContext) -> Unit','Unit','{ self.onBeforeRender = (renderer,scene,camera,geometry,object,group) => callback({renderer,scene,camera,geometry,object,group,material:self}); }'),
  expr('clear_on_before_render','','Unit','{ self.onBeforeRender = () => {}; }'),
 ]);
 for(const when of ['Before','After']) add('Object3D',[
  expr(`set_on_${when.toLowerCase()}_render`,'callback : (RenderContext) -> Unit','Unit',`{ self.on${when}Render = (renderer,scene,camera,geometry,material,group) => callback({renderer,scene,camera,geometry,material,group,object:self}); }`),
  expr(`clear_on_${when.toLowerCase()}_render`,'','Unit',`{ self.on${when}Render = () => {}; }`),
 ]);
 add('Texture',[
  p('source','Source'),expr('set_source','source : Source','Unit','{ self.source = source; self.needsUpdate = true; }'),
  m('add_update_range','start : Int, count : Int','Unit','addUpdateRange'),m('clear_update_ranges','','Unit','clearUpdateRanges'),
  expr('update_ranges','','FixedArray[BufferUpdateRange]','self.updateRanges.map(range=>({...range}))'),
  {...expr('write_rgba','start : Int, data : Bytes','Unit','{ const target = self.source.data?.data; if (!(target instanceof Uint8Array) || self.format !== 1023 || self.type !== 1009 || start < 0 || start + data.length > target.length) throw new RangeError("RGBA8 texture update is out of bounds or has incompatible storage"); target.set(data,start); self.addUpdateRange(start,data.length); self.needsUpdate = true; }'),throws:'ModelingError'},
  {...expr('set_rgba_mipmaps','levels : FixedArray[TextureMipLevel]','Unit','{ if (self.format !== 1023 || self.type !== 1009) throw new TypeError("RGBA8 texture required"); self.mipmaps = levels.map(level=>({data:level.data.slice(),width:level.width,height:level.height})); self.generateMipmaps = false; self.needsUpdate = true; }'),throws:'ModelingError'},
  expr('rgba_mipmaps','','FixedArray[TextureMipLevel]','self.mipmaps.filter(m=>m.data instanceof Uint8Array).map(m=>({data:m.data.slice(),width:m.width,height:m.height}))'),
 ]);
}
