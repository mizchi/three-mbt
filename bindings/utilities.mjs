import { m, cls } from './helpers.mjs';
const snake = name => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
const call = (js, args = '', returns = 'Double') => ({...m(snake(js), args, returns, js), static: true});
const utility = (type, methods) => cls(type, '', methods, {factory: null});
export const utilities = [
  utility('MathUtils', [
    call('generateUUID', '', 'String'), call('clamp', 'value : Double, min : Double, max : Double'), call('euclideanModulo', 'n : Double, m : Double'),
    call('mapLinear', 'x : Double, a1 : Double, a2 : Double, b1 : Double, b2 : Double'),
    ...['inverseLerp', 'lerp'].map(js => call(js, 'x : Double, y : Double, t : Double')),
    call('damp', 'x : Double, y : Double, lambda : Double, dt : Double'), call('pingpong', 'x : Double, length : Double'),
    ...['smoothstep', 'smootherstep'].map(js => call(js, 'x : Double, min : Double, max : Double')),
    call('randInt', 'low : Int, high : Int', 'Int'), call('randFloat', 'low : Double, high : Double'), call('randFloatSpread', 'range : Double'),
    call('seededRandom', 'seed : Int'), {...call('seededRandom'), name: 'next_seeded_random'},
    call('degToRad', 'degrees : Double'), call('radToDeg', 'radians : Double'), call('isPowerOfTwo', 'value : Int', 'Bool'),
    ...['ceilPowerOfTwo', 'floorPowerOfTwo'].map(js => call(js, 'value : Double')),
  ]),
  utility('DataUtils', [call('toHalfFloat', 'value : Double', 'Int'), call('fromHalfFloat', 'value : Int')]),
  utility('ShapeUtils', [call('area', 'contour : FixedArray[Vector2]'), call('isClockWise', 'points : FixedArray[Vector2]', 'Bool'),
    call('triangulateShape', 'contour : FixedArray[Vector2], holes : FixedArray[FixedArray[Vector2]]', 'FixedArray[FixedArray[Int]]')]),
  utility('AnimationUtils', [call('subclip', 'source : AnimationClip, name : String, start_frame : Double, end_frame : Double, fps : Double', 'AnimationClip'),
    call('makeClipAdditive', 'target : AnimationClip, reference_frame : Double, reference_clip : AnimationClip, fps : Double', 'AnimationClip')]),
];
export function extendStaticMath(bindings) {
  const add = (type, methods) => bindings.find(b => b.type === type).methods.push(...methods);
  add('SphericalHarmonics3', [call('getBasisAt', 'normal : Vector3, target : FixedArray[Double]', 'Unit')]);
  add('Quaternion', [call('slerpFlat', 'target : FixedArray[Double], target_offset : Int, a : FixedArray[Double], a_offset : Int, b : FixedArray[Double], b_offset : Int, t : Double', 'Unit'),
    call('multiplyQuaternionsFlat', 'target : FixedArray[Double], target_offset : Int, a : FixedArray[Double], a_offset : Int, b : FixedArray[Double], b_offset : Int', 'FixedArray[Double]')]);
  add('Triangle', [
    {...call('getNormal', 'a : Vector3, b : Vector3, c : Vector3, target : Vector3', 'Vector3'), name: 'normal_from_points'},
    {...call('getBarycoord', 'point : Vector3, a : Vector3, b : Vector3, c : Vector3, target : Vector3', 'Vector3'), name: 'barycoord_from_points', nullable: true},
    {...call('containsPoint', 'point : Vector3, a : Vector3, b : Vector3, c : Vector3', 'Bool'), name: 'contains_point_in_triangle'},
    {...call('isFrontFacing', 'a : Vector3, b : Vector3, c : Vector3, direction : Vector3', 'Bool'), name: 'front_facing_from_points'},
  ]);
}
