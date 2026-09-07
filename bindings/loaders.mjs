import { m, p, rw, expr, nullable, cls } from './helpers.mjs';

const loader = (type) => [
  m('set_path', 'path : String', type, 'setPath'), m('set_resource_path', 'path : String', type, 'setResourcePath'),
  m('set_with_credentials', 'enabled : Bool', type, 'setWithCredentials'),
];
const addon = (type, args, methods) => {
  const result = cls(type, args, methods);
  result.factory.module = 'loaders';
  return result;
};
export const loaders = [
  ...['HDRLoader', 'EXRLoader'].map(type => addon(type, '', [
    ...loader(type), m('set_data_type', 'data_type : HDRDataType', type, 'setDataType'),
  ])),
  addon('GLTFLoader', '', [...loader('GLTFLoader'),
    m('set_draco_loader', 'loader : DRACOLoader', 'GLTFLoader', 'setDRACOLoader'),
    m('set_ktx2_loader', 'loader : KTX2Loader', 'GLTFLoader', 'setKTX2Loader'),
  ]),
  cls('GLTF', '', [p('user_data', 'UserData', 'userData'), p('asset', 'UserData'), nullable('scene', '', 'Group', 'self.scene'), expr('scenes', '', 'FixedArray[Group]', 'self.scenes.slice()'), expr('animations', '', 'FixedArray[AnimationClip]', 'self.animations.slice()'), expr('cameras', '', 'FixedArray[Camera]', 'self.cameras.slice()')], { factory: null }),
  addon('DRACOLoader', '', [m('set_decoder_path', 'path : String', 'DRACOLoader', 'setDecoderPath'), m('set_worker_limit', 'limit : Int', 'DRACOLoader', 'setWorkerLimit'), m('preload', '', 'DRACOLoader'), m('dispose', '', 'DRACOLoader')]),
  addon('KTX2Loader', '', [...loader('KTX2Loader'), m('set_transcoder_path', 'path : String', 'KTX2Loader', 'setTranscoderPath'), m('detect_support', 'renderer : WebGLRenderer', 'KTX2Loader', 'detectSupport'), m('dispose')]),
  cls('TextureLoader', '', loader('TextureLoader')),
  cls('LoadingManager', '', [
    expr('set_on_load', 'callback : () -> Unit', 'Unit', '{ self.onLoad = callback; }'),
    expr('set_on_progress', 'callback : (String, Int, Int) -> Unit', 'Unit', '{ self.onProgress = callback; }'),
    expr('set_on_error', 'callback : (String) -> Unit', 'Unit', '{ self.onError = callback; }'),
    m('set_url_modifier', 'callback : (String) -> String', 'LoadingManager', 'setURLModifier'),
  ]),
  addon('OrbitControls', 'camera : Camera, canvas : Canvas', [
    p('target', 'Vector3'), ...rw('enabled', 'Bool'), ...rw('enable_damping', 'Bool', 'enableDamping'),
    ...rw('damping_factor', 'Double', 'dampingFactor'), ...rw('auto_rotate', 'Bool', 'autoRotate'),
    ...rw('min_distance', 'Double', 'minDistance'), ...rw('max_distance', 'Double', 'maxDistance'),
    m('update', 'delta_seconds : Double', 'Bool'), m('reset'), m('save_state', '', 'Unit', 'saveState'), m('dispose'),
  ]),
];
