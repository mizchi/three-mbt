import { m, p, rw, expr, nullable, optional, upcast, material, cls } from './helpers.mjs';
const camel = n => n.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const map = (name, js=camel(name)) => [nullable(name,'','Texture',`self.${js}`),optional(name,'Texture',js)];
export const materialPipeline = [
  cls('MeshToonMaterial','color : Int',[...material(),p('color','Color'), ...map('map'),...map('gradient_map'),...map('normal_map'),p('normal_scale','Vector2','normalScale'),p('emissive','Color')]),
  cls('MeshMatcapMaterial','color : Int',[...material(),p('color','Color'),...map('map'),...map('matcap'),...map('normal_map'),p('normal_scale','Vector2','normalScale')]),
  cls('MeshDepthMaterial','',[...material(),...rw('depth_packing','DepthPacking','depthPacking'),...map('map'),...map('alpha_map'),...rw('wireframe','Bool')]),
  cls('MeshDistanceMaterial','',[...material(),...map('map'),...map('alpha_map')]),
  cls('ShadowMaterial','',[...material(),p('color','Color')]),
  cls('RawShaderMaterial','',[...material(),upcast('shader_material','ShaderMaterial')],{factory:{name:'RawShaderMaterial',args:'vertex : String, fragment : String, uniforms : Uniforms',js:'rawShaderMaterial',module:'materials'}}),
];
export function extendMaterialPipeline(bindings) {
  const add = (type, methods) => bindings.find(b=>b.type===type).methods.push(...methods);
  add('Material',[
    ...rw('blending','Blending'), p('blend_color','Color','blendColor'), ...rw('blend_alpha','Double','blendAlpha'), ...rw('blend_equation','BlendEquation','blendEquation'),
    ...['blend_src','blend_dst'].flatMap(n=>rw(n,'BlendFactor',camel(n))),
    ...['blend_src_alpha','blend_dst_alpha'].flatMap(n=>[nullable(n,'','BlendFactor',`self.${camel(n)}`),optional(n,'BlendFactor',camel(n))]),
    nullable('blend_equation_alpha','','BlendEquation','self.blendEquationAlpha'),optional('blend_equation_alpha','BlendEquation','blendEquationAlpha'),
    ...rw('depth_func','DepthFunction','depthFunc'),...rw('stencil_func','StencilFunction','stencilFunc'),
    ...['stencil_fail','stencil_zfail','stencil_zpass'].flatMap(n=>rw(n,'StencilOperation',({stencil_fail:'stencilFail',stencil_zfail:'stencilZFail',stencil_zpass:'stencilZPass'})[n])),
    ...['stencil_ref','stencil_func_mask','stencil_write_mask'].flatMap(n=>rw(n,'Int',camel(n))),
    ...['stencil_write','color_write','vertex_colors','alpha_hash','alpha_to_coverage','premultiplied_alpha','dithering','tone_mapped','polygon_offset','clip_intersection','clip_shadows'].flatMap(n=>rw(n,'Bool',camel(n))),
    ...['polygon_offset_factor','polygon_offset_units'].flatMap(n=>rw(n,'Double',camel(n))),
    expr('clipping_planes','','FixedArray[Plane]','self.clippingPlanes?.slice() ?? []'),expr('set_clipping_planes','planes : FixedArray[Plane]','Unit','{ self.clippingPlanes = planes.length ? planes.slice() : null; }'),
  ]);
  add('LightShadow',[...rw('auto_update','Bool','autoUpdate'),p('needs_update','Bool','needsUpdate'),expr('mark_needs_update','','Unit','{ self.needsUpdate = true; }'),...rw('blur_samples','Int','blurSamples')]);
  add('Camera',[
    nullable('as_perspective_camera','','PerspectiveCamera','self.isPerspectiveCamera ? self : null'),
    nullable('as_orthographic_camera','','OrthographicCamera','self.isOrthographicCamera ? self : null'),
  ]);
}
