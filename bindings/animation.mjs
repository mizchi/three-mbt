import { m, p, rw, expr, upcast, cls } from './helpers.mjs';

export const animation = [
  cls('KeyframeTrack', '', [p('name', 'String'), m('shift', 'offset : Double', 'KeyframeTrack'), m('scale', 'scale : Double', 'KeyframeTrack')], { factory: null }),
  ...['NumberKeyframeTrack', 'VectorKeyframeTrack', 'QuaternionKeyframeTrack'].map(type => cls(type, 'name : String, times : FixedArray[Double], values : FixedArray[Double]', [upcast('keyframe_track', 'KeyframeTrack')])),
  cls('AnimationClip', 'name : String, duration : Double, tracks : FixedArray[KeyframeTrack]', [
    p('name', 'String'), p('duration', 'Double'), expr('tracks', '', 'FixedArray[KeyframeTrack]', 'self.tracks.slice()'),
    m('clone', '', 'AnimationClip'), m('optimize', '', 'AnimationClip'), m('validate', '', 'Bool'), m('reset_duration', '', 'AnimationClip', 'resetDuration'),
  ]),
  cls('AnimationMixer', 'root : Object3D', [
    ...rw('time_scale', 'Double', 'timeScale'), p('time', 'Double'),
    m('clip_action', 'clip : AnimationClip', 'AnimationAction', 'clipAction'),
    m('update', 'delta_seconds : Double', 'AnimationMixer'), m('set_time', 'time : Double', 'AnimationMixer', 'setTime'),
    m('stop_all_action', '', 'AnimationMixer', 'stopAllAction'),
    m('uncache_root', 'root : Object3D', 'Unit', 'uncacheRoot'), m('uncache_clip', 'clip : AnimationClip', 'Unit', 'uncacheClip'),
  ]),
  cls('AnimationAction', '', [
    ...['play', 'stop', 'reset'].map(n => m(n, '', 'AnimationAction')), m('is_running', '', 'Bool', 'isRunning'),
    ...rw('paused', 'Bool'), ...rw('enabled', 'Bool'), ...rw('time', 'Double'), ...rw('clamp_when_finished', 'Bool', 'clampWhenFinished'),
    m('set_loop', 'mode : LoopMode, repetitions : Double', 'AnimationAction', 'setLoop'),
    m('set_effective_weight', 'weight : Double', 'AnimationAction', 'setEffectiveWeight'), m('get_effective_weight', '', 'Double', 'getEffectiveWeight'),
    m('set_effective_time_scale', 'scale : Double', 'AnimationAction', 'setEffectiveTimeScale'),
    m('fade_in', 'duration : Double', 'AnimationAction', 'fadeIn'), m('fade_out', 'duration : Double', 'AnimationAction', 'fadeOut'),
    m('cross_fade_from', 'action : AnimationAction, duration : Double, warp : Bool', 'AnimationAction', 'crossFadeFrom'),
  ], { factory: null }),
];
