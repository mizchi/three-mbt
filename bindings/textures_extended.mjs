import { m, p, rw, expr, nullable, s, upcast, cls } from './helpers.mjs';
export const texturesExtended = [
  cls('CubeTextureLoader', '', [m('set_path', 'path : String', 'CubeTextureLoader', 'setPath'), m('set_cross_origin', 'origin : String', 'CubeTextureLoader', 'setCrossOrigin')]),
  ...['Data3DTexture', 'DataArrayTexture'].map(type => cls(type, 'bytes : Bytes, width : Int, height : Int, depth : Int', [
    upcast('texture', 'Texture'), ...['width','height','depth'].map(n => expr(n, '', 'Int', `self.image.${n}`)),
    ...rw('wrap_r', 'Wrapping', 'wrapR'), expr('bytes', '', 'Bytes', 'self.image.data.slice()'),
    expr('set_bytes', 'bytes : Bytes', 'Unit', '{ self.image.data = bytes; self.needsUpdate = true; }'),
    ...(type === 'DataArrayTexture' ? [m('add_layer_update', 'layer : Int', 'Unit', 'addLayerUpdate'), m('clear_layer_updates', '', 'Unit', 'clearLayerUpdates'), expr('layer_updates', '', 'FixedArray[Int]', 'Array.from(self.layerUpdates)')] : []),
  ])),
  cls('Video', '', [...rw('muted', 'Bool'), ...rw('looping', 'Bool', 'loop'), ...rw('volume', 'Double'), p('paused', 'Bool'), p('current_time', 'Double', 'currentTime'), p('duration', 'Double'), p('width', 'Int', 'videoWidth'), p('height', 'Int', 'videoHeight'), m('pause')], {factory: {name:'Video', args:'url : String', js:'video', module:'textures'}}),
  cls('VideoTexture', 'video : Video', [upcast('texture', 'Texture'), m('update')]),
];
export function extendTextures(bindings) {
  bindings.find(b=>b.type==='ShaderMaterial').methods.push(
    nullable('glsl_version', '', 'GLSLVersion', 'self.glslVersion === "300 es" ? 300 : self.glslVersion === "100" ? 100 : null'),
    {name:'set_glsl_version', option:'GLSLVersion', expression:'{ self.glslVersion = value == null ? null : value === 300 ? "300 es" : "100"; }'},
  );
  bindings.find(b=>b.type==='Texture').methods.push(nullable('format', '', 'TextureFormat', '[1023,1028,1030].includes(self.format) ? self.format : null'), s('format', 'TextureFormat'), ...rw('generate_mipmaps','Bool','generateMipmaps'), ...rw('unpack_alignment','Int','unpackAlignment'));
}
