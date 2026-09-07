import { m, p, expr, nullable, upcast, identity, cls } from './helpers.mjs';

const load = (type, returns, expression = 'self.loadAsync(url)') => ({name: 'load', args: 'url : String', returns, expression, async: true, throws: 'LoadError', upstream: 'loadAsync'});
const parse = (returns, async = false) => [
  {name: 'parse_json', args: 'json : Json', returns, expression: `self.${async ? 'parseAsync' : 'parse'}(JSON.parse(json))`, jsonArgs: ['json'], async, throws: 'LoadError', upstream: async ? 'parseAsync' : 'parse'},
  {name: 'parse_json_string', args: 'text : String', returns, expression: `self.${async ? 'parseAsync' : 'parse'}(JSON.parse(text))`, async, throws: 'LoadError', upstream: async ? 'parseAsync' : 'parse'},
];
const dictionary = (type, value, factory) => cls(type, '', [
  expr('set', `key : String, value : ${value}`, 'Unit', '{ Object.defineProperty(self, key, { value, enumerable: true, writable: true, configurable: true }); }'),
  nullable('get', 'key : String', value, 'Object.hasOwn(self, key) ? self[key] : null'),
  expr('keys', '', 'FixedArray[String]', 'Object.keys(self)'),
  expr('remove', 'key : String', 'Unit', '{ delete self[key]; }'),
], {factory: {name: type, args: '', js: factory, module: 'loaders'}});

export const jsonLoaders = [
  cls('Loader', '', [identity('Loader'), p('path', 'String'), p('resource_path', 'String', 'resourcePath'), p('cross_origin', 'String', 'crossOrigin'),
    p('with_credentials', 'Bool', 'withCredentials'), p('manager', 'LoadingManager'),
    expr('set_manager', 'manager : LoadingManager', 'Unit', '{ self.manager = manager; }'),
    p('request_header', 'RequestHeaders', 'requestHeader'),
    m('set_request_header', 'headers : RequestHeaders', 'Loader', 'setRequestHeader'),
    m('set_path', 'path : String', 'Loader', 'setPath'), m('set_resource_path', 'path : String', 'Loader', 'setResourcePath'),
    m('set_cross_origin', 'origin : String', 'Loader', 'setCrossOrigin'), m('set_with_credentials', 'enabled : Bool', 'Loader', 'setWithCredentials'),
  ], {factory: null}),
  cls('ObjectLoader', '', [upcast('loader', 'Loader'), load('ObjectLoader', 'Object3D'), ...parse('Object3D', true)]),
  cls('BufferGeometryLoader', '', [upcast('loader', 'Loader'), load('BufferGeometryLoader', 'BufferGeometry'), ...parse('BufferGeometry')]),
  cls('MaterialLoader', '', [upcast('loader', 'Loader'), load('MaterialLoader', 'Material'), ...parse('Material'),
    p('textures', 'TextureDictionary'), m('set_textures', 'textures : TextureDictionary', 'MaterialLoader', 'setTextures'),
    {...m('create_material_from_type', 'name : String', 'Material', 'createMaterialFromType'), throws: 'LoadError'},
  ]),
  cls('AnimationLoader', '', [upcast('loader', 'Loader'), load('AnimationLoader', 'FixedArray[AnimationClip]'), ...parse('FixedArray[AnimationClip]')]),
  cls('FileLoader', '', [upcast('loader', 'Loader'), m('set_mime_type', 'mime_type : String', 'FileLoader', 'setMimeType'),
    nullable('mime_type', '', 'String', 'self.mimeType'), nullable('response_type', '', 'String', 'self.responseType'),
    {name: 'load_text', args: 'url : String', returns: 'String', expression: '{ self.setResponseType("text"); return self.loadAsync(url).then(value => { if (typeof value !== "string") throw new TypeError("FileLoader received a non-text cached/shared response"); return value; }); }', async: true, throws: 'LoadError', upstream: ['loadAsync', 'setResponseType']},
    {name: 'load_bytes', args: 'url : String', returns: 'Bytes', expression: '{ self.setResponseType("arraybuffer"); return self.loadAsync(url).then(value => { if (!(value instanceof ArrayBuffer)) throw new TypeError("FileLoader received a non-binary cached/shared response"); return new Uint8Array(value); }); }', async: true, throws: 'LoadError', upstream: ['loadAsync', 'setResponseType']},
    {name: 'load_json', args: 'url : String', returns: 'Json', expression: '{ self.setResponseType("text"); return self.loadAsync(url).then(value => { if (typeof value !== "string") throw new TypeError("FileLoader received a non-text cached/shared response"); return value; }); }', async: true, throws: 'LoadError', jsonResult: true, upstream: 'loadAsync'},
    m('abort', '', 'FileLoader'),
  ]),
  dictionary('TextureDictionary', 'Texture', 'textureDictionary'), dictionary('RequestHeaders', 'String', 'requestHeaders'),
  cls('LoadingHandler', '', [expr('remove', '', 'Unit', '{ self.manager.removeHandler(self.pattern); }')], {factory: null}),
];

export function extendJsonLoaders(bindings) {
  const add = (type, methods) => bindings.find(b => b.type === type).methods.push(...methods);
  for (const type of ['GLTFLoader', 'TextureLoader', 'CubeTextureLoader', 'HDRLoader', 'EXRLoader', 'DRACOLoader', 'KTX2Loader']) add(type, [upcast('loader', 'Loader')]);
  add('Texture', [p('uuid', 'String')]);
  add('LoadingManager', [
    expr('set_on_start', 'callback : (String, Int, Int) -> Unit', 'Unit', '{ self.onStart = callback; }'),
    m('item_start', 'url : String', 'Unit', 'itemStart'), m('item_end', 'url : String', 'Unit', 'itemEnd'), m('item_error', 'url : String', 'Unit', 'itemError'),
    m('resolve_url', 'url : String', 'String', 'resolveURL'), m('abort', '', 'LoadingManager'),
    nullable('get_handler', 'file : String', 'Loader', 'self.getHandler(file)'),
    {name: 'add_handler', args: 'pattern : String, flags : String, loader : Loader', returns: 'LoadingHandler', expression: '{ const regex = new RegExp(pattern, flags); self.addHandler(regex, loader); return { manager: self, pattern: regex }; }', throws: 'LoadError', upstream: 'addHandler'},
    expr('clear_url_modifier', '', 'LoadingManager', 'self.setURLModifier(undefined)'),
  ]);
  for (const type of ['Object3D', 'BufferGeometry', 'Material', 'Texture', 'AnimationClip', 'KeyframeTrack', 'Box3', 'Sphere', 'Quaternion', 'Color', 'Fog', 'FogExp2', 'LightShadow', 'Skeleton', 'PackedBufferAttribute']) {
    const expression = type === 'KeyframeTrack' ? 'JSON.stringify(self.constructor.toJSON(self))' : 'JSON.stringify(self.toJSON())';
    add(type, [
      {name: 'to_json', args: '', returns: 'Json', expression, throws: 'SerializationError', jsonResult: true, upstream: type === 'KeyframeTrack' ? 'static toJSON' : 'toJSON'},
      {name: 'to_json_string', args: '', returns: 'String', expression, throws: 'SerializationError', upstream: type === 'KeyframeTrack' ? 'static toJSON' : 'toJSON'},
    ]);
  }
}
