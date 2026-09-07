import {m,p,s,rw,expr,nullable,upcast,cls} from './helpers.mjs';
const addon=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'render-extra'}});
const snake=name=>name.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
export const renderExtra=[
 {...addon('Uniform','value : Double',[
  m('clone','','Uniform'),nullable('float_value','','Double','typeof self.value==="number"?self.value:null'),
  expr('set_float','value : Double','Unit','{ self.value=value; }'),
  ...['Vector2','Vector3','Vector4','Color','Matrix3','Matrix4'].flatMap(type=>[
   nullable(type.toLowerCase()+'_value','',type,`self.value?.is${type}?self.value:null`),
   expr('set_'+type.toLowerCase(),`value : ${type}`,'Unit','{ self.value=value; }'),
  ]),
 ]),factories:['Vector2','Vector3','Vector4','Color','Matrix3','Matrix4'].map(type=>({name:'from_'+type.toLowerCase(),args:`value : ${type}`,js:'uniform',module:'render-extra'}))},
 cls('UniformsGroup','',[
  m('add','uniform : Uniform','UniformsGroup'),m('remove','uniform : Uniform','UniformsGroup'),
  m('set_name','name : String','UniformsGroup','setName'),p('name','String'),
  m('set_usage','usage : BufferUsage','UniformsGroup','setUsage'),p('usage','BufferUsage'),
  expr('uniforms','','FixedArray[Uniform]','self.uniforms.flat().slice()'),
  m('clone','','UniformsGroup'),m('copy','source : UniformsGroup','UniformsGroup'),m('dispose'),
 ]),
 cls('ShadowRenderContext','',[
  p('renderer','WebGLRenderer'),p('object','Object3D'),p('camera','Camera'),p('shadow_camera','Camera','shadowCamera'),
  p('geometry','BufferGeometry'),p('depth_material','Material','depthMaterial'),nullable('group','','GeometryGroup','self.group'),
 ],{factory:null}),
 addon('ShaderPass','material : ShaderMaterial, texture_id : String',[
  upcast('pass','Pass'),p('material','ShaderMaterial'),p('uniforms','Uniforms'),...rw('texture_id','String','textureID'),
 ]),
 addon('GTAOSettings','',[
  ...['radius','distanceExponent','thickness','distanceFallOff','scale'].map(name=>s(snake(name),'Double',name)),
  s('samples','Int'),s('screen_space_radius','Bool','screenSpaceRadius'),
 ]),
 addon('DenoiseSettings','',[
  ...['lumaPhi','depthPhi','normalPhi','radius','radiusExponent','rings'].map(name=>s(snake(name),'Double',name)),s('samples','Int'),
 ]),
 addon('GTAOPass','scene : Scene, camera : Camera, width : Int, height : Int',[
  upcast('pass','Pass'),expr('output','','GTAOOutput','self.output===-1?7:self.output'),
  expr('set_output','value : GTAOOutput','Unit','{ self.output=value===7?-1:value; }'),...rw('blend_intensity','Double','blendIntensity'),
  p('gtao_map','Texture','gtaoMap'),m('set_scene_clip_box','box : Box3','Unit','setSceneClipBox'),
  m('update_gtao','settings : GTAOSettings','Unit','updateGtaoMaterial'),m('update_denoise','settings : DenoiseSettings','Unit','updatePdMaterial'),
  m('set_gbuffer','depth : DepthTexture, normal : Texture','Unit','setGBuffer'),expr('clear_gbuffer','','Unit','self.setGBuffer()'),
 ]),
 addon('SMAAPass','',[upcast('pass','Pass')]),
 addon('BokehPass','scene : Scene, camera : PerspectiveCamera, focus : Double, aperture : Double, max_blur : Double',[
  upcast('pass','Pass'),p('uniforms','Uniforms'),
  ...['focus','aperture','maxblur'].flatMap(name=>[
   expr(name==='maxblur'?'max_blur':name,'','Double',`self.uniforms.${name}.value`),
   expr('set_'+(name==='maxblur'?'max_blur':name),'value : Double','Unit',`{ self.uniforms.${name}.value=value; }`),
  ]),
 ]),
 cls('FramebufferTexture','width : Int, height : Int',[upcast('texture','Texture')]),
 ...[['WebGL3DRenderTarget','Data3DTexture'],['WebGLArrayRenderTarget','DataArrayTexture']].map(([type,texture])=>
  cls(type,'width : Int, height : Int, depth : Int',[upcast('render_target','WebGLRenderTarget'),p('texture',texture),p('depth','Int'),
   m('set_size','width : Int, height : Int, depth : Int','Unit','setSize')])
 ),
];
export function extendRenderExtra(bindings) {
 const add=(type,methods)=>bindings.find(b=>b.type===type).methods.push(...methods);
 add('ShaderMaterial',[
  expr('uniforms_groups','','FixedArray[UniformsGroup]','self.uniformsGroups.slice()'),
  expr('set_uniforms_groups','groups : FixedArray[UniformsGroup]','Unit','{ self.uniformsGroups=groups.slice();self.needsUpdate=true; }'),
 ]);
 for(const when of ['Before','After'])add('Object3D',[
  expr('set_on_'+when.toLowerCase()+'_shadow','callback : (ShadowRenderContext) -> Unit','Unit',`{ self.on${when}Shadow=(renderer,object,camera,shadowCamera,geometry,depthMaterial,group)=>callback({renderer,object,camera,shadowCamera,geometry,depthMaterial,group}); }`),
  expr('clear_on_'+when.toLowerCase()+'_shadow','','Unit',`{ self.on${when}Shadow=()=>{}; }`),
 ]);
 add('WebGLRenderer',[
  m('copy_framebuffer_to_texture','texture : Texture, position : Vector2, level : Int','Unit','copyFramebufferToTexture'),
  ...[['2d','Box2','Vector2'],['3d','Box3','Vector3']].map(([name,region,position])=>
   m('copy_texture_'+name,`source : Texture, target : Texture, region : ${region}, position : ${position}, source_level : Int, target_level : Int`,'Unit','copyTextureToTexture')),
  expr('copy_texture','source : Texture, target : Texture','Unit','self.copyTextureToTexture(source,target)'),
  m('init_render_target','target : WebGLRenderTarget','Unit','initRenderTarget'),m('init_texture','texture : Texture','Unit','initTexture'),
  m('reset_state','','Unit','resetState'),
  nullable('render_target','','WebGLRenderTarget','self.getRenderTarget()'),
  m('active_mipmap_level','','Int','getActiveMipmapLevel'),m('active_cube_face','','Int','getActiveCubeFace'),
  ...['3d','array'].map(kind=>m('set_'+kind+'_render_target',`target : WebGL${kind==='3d'?'3D':'Array'}RenderTarget, layer : Int, mip_level : Int`,'Unit','setRenderTarget')),
 ]);
 const data=bindings.find(b=>b.type==='DataTexture');
 data.factories=[...(data.factories??[]),{name:'from_rgba_float',args:'values : FixedArray[Double], width : Int, height : Int',js:'dataTextureFloat',module:'render-extra'}];
}
