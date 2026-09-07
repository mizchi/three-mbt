import { m, p, rw, expr, nullable, optional, upcast, cls } from './helpers.mjs';
export const renderingAdvanced = [
  cls('DepthTexture', 'width : Int, height : Int', [upcast('texture', 'Texture')]),
  cls('CubeTexture', '', [upcast('texture', 'Texture')]),
  cls('WebGLCubeRenderTarget', 'size : Int', [upcast('render_target', 'WebGLRenderTarget'), p('texture', 'CubeTexture'), m('from_equirectangular_texture', 'renderer : WebGLRenderer, texture : Texture', 'WebGLCubeRenderTarget', 'fromEquirectangularTexture'), m('dispose')]),
  cls('RendererInfo', '', [
    ...['calls', 'triangles', 'points', 'lines', 'frame'].map(n => expr(n, '', 'Int', `self.render.${n}`)),
    ...['geometries', 'textures'].map(n => expr(n, '', 'Int', `self.memory.${n}`)),
    expr('program_count', '', 'Int', 'self.programs?.length ?? 0'), ...rw('auto_reset', 'Bool', 'autoReset'), m('reset'),
  ], { factory: null }),
  cls('RendererCapabilities', '', [
    ...['max_textures', 'max_texture_size', 'max_cubemap_size', 'max_attributes', 'max_samples'].map(n => p(n, 'Int', n.replace(/_([a-z])/g, (_, c) => c.toUpperCase()))),
    m('get_max_anisotropy', '', 'Int', 'getMaxAnisotropy'), p('precision', 'String'),
  ], { factory: null }),
];
export function extendRendering(bindings) {
  const add = (type, methods) => bindings.find(b => b.type === type).methods.push(...methods);
  add('WebGLRenderer', [
    m('set_viewport', 'x : Int, y : Int, width : Int, height : Int', 'Unit', 'setViewport'),
    m('get_viewport', 'target : Vector4', 'Vector4', 'getViewport'),
    m('set_scissor', 'x : Int, y : Int, width : Int, height : Int', 'Unit', 'setScissor'),
    m('get_scissor', 'target : Vector4', 'Vector4', 'getScissor'),
    m('set_scissor_test', 'enabled : Bool', 'Unit', 'setScissorTest'), m('get_scissor_test', '', 'Bool', 'getScissorTest'),
    m('get_drawing_buffer_size', 'target : Vector2', 'Vector2', 'getDrawingBufferSize'),
    p('info', 'RendererInfo'), p('capabilities', 'RendererCapabilities'),
    ...rw('local_clipping_enabled', 'Bool', 'localClippingEnabled'),
    expr('set_clipping_planes', 'planes : FixedArray[Plane]', 'Unit', '{ self.clippingPlanes = planes.slice(); }'),
    expr('set_shadow_map_type', 'value : ShadowMapType', 'Unit', '{ self.shadowMap.type = value; }'),
    m('compile', 'scene : Scene, camera : Camera', 'Unit'),
    expr('set_cube_render_target', 'target : WebGLCubeRenderTarget, face : Int, mip_level : Int', 'Unit', 'self.setRenderTarget(target, face, mip_level)'),
  ]);
  add('WebGLRenderTarget', [
    ...rw('samples', 'Int'), ...rw('depth_buffer', 'Bool', 'depthBuffer'), ...rw('stencil_buffer', 'Bool', 'stencilBuffer'),
    expr('textures', '', 'FixedArray[Texture]', 'self.textures.slice()'),
    nullable('depth_texture', '', 'DepthTexture', 'self.depthTexture'), optional('depth_texture', 'DepthTexture', 'depthTexture'),
  ]);
}
