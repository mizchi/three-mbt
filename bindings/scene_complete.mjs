import { m, p, rw, expr, nullable, optional, upcast, node, cls } from './helpers.mjs';
const snake = name => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
const call = (js, args = '', returns = 'Unit') => m(snake(js), args, returns, js);

export const sceneComplete = [
  cls('ArrayCamera', 'cameras : FixedArray[PerspectiveCamera]', [
    ...node(), upcast('camera', 'Camera'), upcast('perspective_camera', 'PerspectiveCamera'),
    expr('cameras', '', 'FixedArray[PerspectiveCamera]', 'self.cameras.slice()'),
    expr('set_cameras', 'cameras : FixedArray[PerspectiveCamera]', 'Unit', '{ self.cameras = cameras.slice(); }'),
    p('is_array_camera', 'Bool', 'isArrayCamera'), p('is_multi_view_camera', 'Bool', 'isMultiViewCamera'),
  ]),
  cls('StereoCamera', '', [p('kind', 'String', 'type'), ...rw('aspect', 'Double'), ...rw('eye_sep', 'Double', 'eyeSep'),
    p('camera_l', 'PerspectiveCamera', 'cameraL'), p('camera_r', 'PerspectiveCamera', 'cameraR'), m('update', 'camera : PerspectiveCamera')]),
  cls('LOD', '', [...node(), ...rw('auto_update', 'Bool', 'autoUpdate'),
    expr('levels', '', 'FixedArray[LODLevel]', 'self.levels.map(level => ({ ...level }))'),
    call('addLevel', 'object : Object3D, distance : Double, hysteresis : Double', 'LOD'), call('removeLevel', 'distance : Double', 'Bool'),
    call('getCurrentLevel', '', 'Int'), nullable('get_object_for_distance', 'distance : Double', 'Object3D', 'self.getObjectForDistance(distance)'),
    m('update', 'camera : Camera')]),
  cls('LODLevel', '', [p('object', 'Object3D'), p('distance', 'Double'), p('hysteresis', 'Double')], {factory: null}),
  cls('CameraView', '', [p('enabled', 'Bool'), ...['fullWidth', 'fullHeight', 'offsetX', 'offsetY', 'width', 'height'].map(js => p(snake(js), 'Double', js))], {factory: null}),
  cls('LightProbe', 'sh : SphericalHarmonics3, intensity : Double', [...node(), upcast('light', 'Light'), ...rw('sh', 'SphericalHarmonics3'), m('copy', 'other : LightProbe', 'LightProbe')]),
  ...[['ColorKeyframeTrack', 'Double'], ['BooleanKeyframeTrack', 'Bool'], ['StringKeyframeTrack', 'String']].map(([type, value]) =>
    cls(type, `name : String, times : FixedArray[Double], values : FixedArray[${value}]`, [upcast('keyframe_track', 'KeyframeTrack'), expr('values', '', `FixedArray[${value}]`, 'Array.from(self.values)')])),
  cls('AnimationObjectGroup', '', [p('uuid', 'String'),
    ...['add', 'remove', 'uncache'].flatMap(js => [m(js, 'object : Object3D'), expr(`${js}_all`, 'objects : FixedArray[Object3D]', 'Unit', `{ self.${js}(...objects); }`)])]),
  cls('AnimationMixerStats', '', [
    ...['actions', 'bindings', 'controlInterpolants'].flatMap(js => [expr(`${snake(js)}_total`, '', 'Int', `self.${js}.total`), expr(`${snake(js)}_in_use`, '', 'Int', `self.${js}.inUse`)]),
  ], {factory: null}),
];

export function extendScene(bindings) {
  const add = (type, methods) => bindings.find(b => b.type === type).methods.push(...methods);
  add('Object3D', [
    p('model_view_matrix', 'Matrix4', 'modelViewMatrix'), p('normal_matrix', 'Matrix3', 'normalMatrix'),
    ...['matrixAutoUpdate', 'matrixWorldAutoUpdate', 'matrixWorldNeedsUpdate', 'static'].flatMap(js => rw(js === 'static' ? 'is_static' : snake(js), 'Bool', js)),
    expr('animations', '', 'FixedArray[AnimationClip]', 'self.animations.slice()'), expr('set_animations', 'clips : FixedArray[AnimationClip]', 'Unit', '{ self.animations = clips.slice(); }'),
    nullable('pivot', '', 'Vector3', 'self.pivot'), optional('pivot', 'Vector3'),
    ...['customDepthMaterial', 'customDistanceMaterial'].flatMap(js => [nullable(snake(js), '', 'Material', `self.${js}`), optional(snake(js), 'Material', js)]),
    call('setRotationFromAxisAngle', 'axis : Vector3, angle : Double'), call('setRotationFromEuler', 'euler : Euler'), call('setRotationFromMatrix', 'matrix : Matrix4'), call('setRotationFromQuaternion', 'quaternion : Quaternion'),
    ...['rotateOnAxis', 'rotateOnWorldAxis'].map(js => call(js, 'axis : Vector3, angle : Double', 'Object3D')),
    call('translateOnAxis', 'axis : Vector3, distance : Double', 'Object3D'),
    nullable('get_object_by_id', 'id : Int', 'Object3D', 'self.getObjectById(id)'),
    ...[['string', 'String'], ['number', 'Double'], ['bool', 'Bool']].flatMap(([suffix, type]) => [
      nullable(`get_object_by_${suffix}_property`, `name : String, value : ${type}`, 'Object3D', 'self.getObjectByProperty(name, value)'),
      m(`get_objects_by_${suffix}_property`, `name : String, value : ${type}`, 'FixedArray[Object3D]', 'getObjectsByProperty'),
    ]),
    call('traverseAncestors', 'callback : (Object3D) -> Unit'), m('copy', 'other : Object3D, recursive : Bool', 'Object3D'),
  ]);
  add('Camera', [p('matrix_world_inverse', 'Matrix4', 'matrixWorldInverse'), ...rw('coordinate_system', 'CoordinateSystem', 'coordinateSystem'),
    nullable('viewport', '', 'Vector4', 'self.viewport'), optional('viewport', 'Vector4'), p('reversed_depth', 'Bool', 'reversedDepth'),
    m('clone', '', 'Camera'), m('copy', 'other : Camera, recursive : Bool', 'Camera')]);
  for (const type of ['PerspectiveCamera', 'OrthographicCamera']) add(type, [
    nullable('view', '', 'CameraView', 'self.view'), m('copy', `other : ${type}, recursive : Bool`, type),
    call('setViewOffset', 'full_width : Double, full_height : Double, x : Double, y : Double, width : Double, height : Double'), call('clearViewOffset'),
  ]);
  add('PerspectiveCamera', [...['focus', 'filmGauge', 'filmOffset'].flatMap(js => rw(snake(js), 'Double', js)),
    ...['getEffectiveFOV', 'getFilmWidth', 'getFilmHeight'].map(js => call(js, '', 'Double')),
    call('getViewBounds', 'distance : Double, min_target : Vector2, max_target : Vector2'), call('getViewSize', 'distance : Double, target : Vector2', 'Vector2')]);
  add('AnimationAction', [
    ...rw('blend_mode', 'AnimationBlendMode', 'blendMode'), p('loop_mode', 'LoopMode', 'loop'),
    ...['timeScale', 'weight', 'repetitions'].flatMap(js => rw(snake(js), 'Double', js)),
    ...['zeroSlopeAtStart', 'zeroSlopeAtEnd'].flatMap(js => rw(snake(js), 'Bool', js)),
    call('isScheduled', '', 'Bool'), call('startAt', 'time : Double', 'AnimationAction'), call('crossFadeTo', 'action : AnimationAction, duration : Double, warp : Bool', 'AnimationAction'),
    ...['stopFading', 'stopWarping'].map(js => call(js, '', 'AnimationAction')), call('getEffectiveTimeScale', '', 'Double'),
    call('setDuration', 'duration : Double', 'AnimationAction'), call('syncWith', 'action : AnimationAction', 'AnimationAction'), m('halt', 'duration : Double', 'AnimationAction'),
    m('warp', 'start_time_scale : Double, end_time_scale : Double, duration : Double', 'AnimationAction'),
    call('getMixer', '', 'AnimationMixer'), call('getClip', '', 'AnimationClip'), call('getRoot', '', 'Object3D'),
  ]);
  add('AnimationClip', [...rw('blend_mode', 'AnimationBlendMode', 'blendMode'), p('uuid', 'String'), p('user_data', 'UserData', 'userData'), m('trim', '', 'AnimationClip')]);
  add('AnimationMixer', [p('stats', 'AnimationMixerStats'),
    nullable('existing_action', 'clip : AnimationClip', 'AnimationAction', 'self.existingAction(clip)'),
    nullable('existing_action_for_root', 'clip : AnimationClip, root : Object3D', 'AnimationAction', 'self.existingAction(clip, root)'),
    call('getRoot', '', 'Object3D'), call('uncacheAction', 'clip : AnimationClip'),
    m('clip_action_for_root', 'clip : AnimationClip, root : Object3D, blend_mode : AnimationBlendMode', 'AnimationAction', 'clipAction'),
    m('uncache_action_for_root', 'clip : AnimationClip, root : Object3D', 'Unit', 'uncacheAction'),
  ]);
  add('KeyframeTrack', [expr('times', '', 'FixedArray[Double]', 'Array.from(self.times)'),
    // Boolean/String tracks share the base class. Do not cast their values to numbers.
    nullable('number_values', '', 'FixedArray[Double]', '{ const values = Array.from(self.values); return values.every(value => typeof value === "number") ? values : null; }'),
    call('setInterpolation', 'interpolation : InterpolationMode', 'KeyframeTrack'), call('getInterpolation', '', 'InterpolationMode'), call('getValueSize', '', 'Int'),
    m('trim', 'start_time : Double, end_time : Double', 'KeyframeTrack'), m('validate', '', 'Bool'), m('optimize', '', 'KeyframeTrack'), m('clone', '', 'KeyframeTrack'),
    p('value_type_name', 'String', 'ValueTypeName'), p('default_interpolation', 'InterpolationMode', 'DefaultInterpolation'),
  ]);
}
