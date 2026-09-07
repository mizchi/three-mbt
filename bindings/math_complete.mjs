import { m, p, rw, expr, nullable, cls } from './helpers.mjs';

const snake = name => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
const call = (js, args = '', returns = 'Unit') => m(snake(js), args, returns, js);
const copy = type => [m('clone', '', type), m('copy', `other : ${type}`, type), m('equals', `other : ${type}`, 'Bool')];
const arrays = type => [
  call('fromArray', 'values : FixedArray[Double], offset : Int', type),
  call('toArray', '', 'FixedArray[Double]'),
  m('to_array_into', 'values : FixedArray[Double], offset : Int', 'FixedArray[Double]', 'toArray'),
];
const bounds = (type, vector) => [
  ...copy(type), m('set', `min : ${vector}, max : ${vector}`, type),
  call('setFromPoints', `points : FixedArray[${vector}]`, type),
  call('setFromCenterAndSize', `center : ${vector}, size : ${vector}`, type),
  call('makeEmpty', '', type), call('isEmpty', '', 'Bool'),
  ...['getCenter', 'getSize'].map(js => call(js, `target : ${vector}`, vector)),
  call('expandByPoint', `point : ${vector}`, type), call('expandByVector', `vector : ${vector}`, type), call('expandByScalar', 'scalar : Double', type),
  call('containsPoint', `point : ${vector}`, 'Bool'), call('containsBox', `box : ${type}`, 'Bool'), call('intersectsBox', `box : ${type}`, 'Bool'),
  ...['getParameter', 'clampPoint'].map(js => call(js, `point : ${vector}, target : ${vector}`, vector)),
  call('distanceToPoint', `point : ${vector}`, 'Double'),
  ...['intersect', 'union'].map(js => call(js, `box : ${type}`, type)), call('translate', `offset : ${vector}`, type),
];

export const mathComplete = [
  cls('ColorHSL', 'h : Double, s : Double, l : Double', ['h', 's', 'l'].flatMap(n => rw(n, 'Double')), {factory: {name: 'ColorHSL', args: 'h : Double, s : Double, l : Double', js: 'colorHSL', module: 'constructors'}}),
  cls('Box2', '', [...rw('min', 'Vector2'), ...rw('max', 'Vector2'), ...bounds('Box2', 'Vector2')]),
  cls('Line3', 'start : Vector3, end : Vector3', [
    ...rw('start', 'Vector3'), ...rw('end', 'Vector3'), ...copy('Line3'),
    m('set', 'start : Vector3, end : Vector3', 'Line3'),
    call('getCenter', 'target : Vector3', 'Vector3'), m('delta', 'target : Vector3', 'Vector3'),
    m('distance_squared', '', 'Double', 'distanceSq'), m('distance', '', 'Double'),
    m('at', 't : Double, target : Vector3', 'Vector3'),
    call('closestPointToPointParameter', 'point : Vector3, clamp_to_line : Bool', 'Double'),
    call('closestPointToPoint', 'point : Vector3, clamp_to_line : Bool, target : Vector3', 'Vector3'),
    m('distance_squared_to_line3', 'line : Line3, target_on_self : Vector3, target_on_line : Vector3', 'Double', 'distanceSqToLine3'),
    call('applyMatrix4', 'matrix : Matrix4', 'Line3'),
  ]),
  cls('Triangle', 'a : Vector3, b : Vector3, c : Vector3', [
    ...['a', 'b', 'c'].flatMap(n => rw(n, 'Vector3')), ...copy('Triangle'),
    m('set', 'a : Vector3, b : Vector3, c : Vector3', 'Triangle'),
    call('setFromPointsAndIndices', 'points : FixedArray[Vector3], a : Int, b : Int, c : Int', 'Triangle'),
    call('setFromAttributeAndIndices', 'attribute : BufferAttribute, a : Int, b : Int, c : Int', 'Triangle'),
    call('getArea', '', 'Double'), ...['getMidpoint', 'getNormal'].map(js => call(js, 'target : Vector3', 'Vector3')),
    call('getPlane', 'target : Plane', 'Plane'),
    nullable('get_barycoord', 'point : Vector3, target : Vector3', 'Vector3', 'self.getBarycoord(point, target)'),
    ...[2, 3, 4].map(n => nullable(`get_interpolation${n}`, `point : Vector3, a : Vector${n}, b : Vector${n}, c : Vector${n}, target : Vector${n}`, `Vector${n}`, 'self.getInterpolation(point, a, b, c, target)')),
    call('containsPoint', 'point : Vector3', 'Bool'), call('intersectsBox', 'box : Box3', 'Bool'), call('isFrontFacing', 'direction : Vector3', 'Bool'),
    call('closestPointToPoint', 'point : Vector3, target : Vector3', 'Vector3'),
  ]),
  cls('Cylindrical', 'radius : Double, theta : Double, y : Double', [
    ...['radius', 'theta', 'y'].flatMap(n => rw(n, 'Double')),
    m('clone', '', 'Cylindrical'), m('copy', 'other : Cylindrical', 'Cylindrical'),
    m('set', 'radius : Double, theta : Double, y : Double', 'Cylindrical'),
    call('setFromVector3', 'vector : Vector3', 'Cylindrical'), call('setFromCartesianCoords', 'x : Double, y : Double, z : Double', 'Cylindrical'),
  ]),
  cls('SphericalHarmonics3', '', [
    expr('coefficients', '', 'FixedArray[Vector3]', 'self.coefficients.slice()'),
    m('set', 'coefficients : FixedArray[Vector3]', 'SphericalHarmonics3'), ...copy('SphericalHarmonics3'),
    m('zero', '', 'SphericalHarmonics3'), m('add', 'other : SphericalHarmonics3', 'SphericalHarmonics3'),
    call('addScaledSH', 'other : SphericalHarmonics3, scale : Double', 'SphericalHarmonics3'),
    m('scale', 'scale : Double', 'SphericalHarmonics3'), m('lerp', 'other : SphericalHarmonics3, alpha : Double', 'SphericalHarmonics3'),
    ...arrays('SphericalHarmonics3'), ...['getAt', 'getIrradianceAt'].map(js => call(js, 'normal : Vector3, target : Vector3', 'Vector3')),
  ]),
  cls('Matrix2', '', [p('is_matrix2', 'Bool', 'isMatrix2'), expr('elements', '', 'FixedArray[Double]', 'self.elements.slice()'),
    m('identity', '', 'Matrix2'), m('set', 'n11 : Double, n12 : Double, n21 : Double, n22 : Double', 'Matrix2'),
    call('fromArray', 'values : FixedArray[Double], offset : Int', 'Matrix2'),
  ]),
];

export function extendMath(bindings) {
  // Keep the contract explicit; only repeated forwarding shapes are shared.
  const add = (type, methods) => {
    const binding = bindings.find(b => b.type === type);
    for (const method of methods) if (!binding.methods.some(m => m.name === method.name)) binding.methods.push(method);
  };
  for (const [type, dimensions] of [['Vector2', 2], ['Vector3', 3], ['Vector4', 4]]) {
    add(type, [
      ...arrays(type), p(`is_vector${dimensions}`, 'Bool', `isVector${dimensions}`),
      ...'xyzw'.slice(0, dimensions).split('').map(n => m(`set_${n}`, 'value : Double', type, `set${n.toUpperCase()}`)),
      call('setComponent', 'index : Int, value : Double', type), call('getComponent', 'index : Int', 'Double'),
      ...['setScalar', 'addScalar', 'subScalar', 'divideScalar', 'setLength'].map(js => call(js, 'value : Double', type)),
      ...['addVectors', 'subVectors'].map(js => call(js, `a : ${type}, b : ${type}`, type)),
      call('addScaledVector', `other : ${type}, scale : Double`, type),
      ...['multiply', 'divide', 'min', 'max'].map(js => call(js, `other : ${type}`, type)),
      m('clamp', `min : ${type}, max : ${type}`, type), call('clampScalar', 'min : Double, max : Double', type),
      ...['floor', 'ceil', 'round', 'roundToZero', 'negate', 'random'].map(js => call(js, '', type)),
      m('length_squared', '', 'Double', 'lengthSq'), call('manhattanLength', '', 'Double'),
      m('lerp', `other : ${type}, alpha : Double`, type), call('lerpVectors', `a : ${type}, b : ${type}, alpha : Double`, type),
      m('equals', `other : ${type}`, 'Bool'),
      call('fromBufferAttribute', 'attribute : BufferAttribute, index : Int', type),
    ]);
    if (dimensions < 4) add(type, [
      call('clampLength', 'min : Double, max : Double', type), call('angleTo', `other : ${type}`, 'Double'),
      call('distanceToSquared', `other : ${type}`, 'Double'), call('manhattanDistanceTo', `other : ${type}`, 'Double'),
    ]);
    if (dimensions !== 3) add(type, [...rw('width', 'Double'), ...rw('height', 'Double')]);
  }
  add('Vector2', [m('cross', 'other : Vector2', 'Double'), m('angle', '', 'Double'),
    call('rotateAround', 'center : Vector2, angle : Double', 'Vector2'), call('applyMatrix3', 'matrix : Matrix3', 'Vector2')]);
  add('Vector3', [
    ...['multiplyVectors', 'crossVectors'].map(js => call(js, 'a : Vector3, b : Vector3', 'Vector3')),
    call('applyEuler', 'euler : Euler', 'Vector3'), call('applyAxisAngle', 'axis : Vector3, angle : Double', 'Vector3'),
    call('applyNormalMatrix', 'matrix : Matrix3', 'Vector3'),
    ...['projectOnVector', 'projectOnPlane', 'reflect'].map(js => call(js, 'vector : Vector3', 'Vector3')),
    call('setFromSphericalCoords', 'radius : Double, phi : Double, theta : Double', 'Vector3'),
    call('setFromCylindrical', 'cylindrical : Cylindrical', 'Vector3'), call('setFromCylindricalCoords', 'radius : Double, theta : Double, y : Double', 'Vector3'),
    ...['setFromMatrixPosition', 'setFromMatrixScale'].map(js => call(js, 'matrix : Matrix4', 'Vector3')),
    call('setFromMatrixColumn', 'matrix : Matrix4, index : Int', 'Vector3'), call('setFromMatrix3Column', 'matrix : Matrix3, index : Int', 'Vector3'),
    call('setFromEuler', 'euler : Euler', 'Vector3'), call('setFromColor', 'color : Color', 'Vector3'), call('randomDirection', '', 'Vector3'),
  ]);
  add('Vector4', [call('setAxisAngleFromQuaternion', 'quaternion : Quaternion', 'Vector4'),
    call('setAxisAngleFromRotationMatrix', 'matrix : Matrix4', 'Vector4'), call('setFromMatrixPosition', 'matrix : Matrix4', 'Vector4')]);
  add('Quaternion', [...arrays('Quaternion'),
    call('setFromUnitVectors', 'from : Vector3, to : Vector3', 'Quaternion'), call('rotateTowards', 'other : Quaternion, step : Double', 'Quaternion'),
    m('length_squared', '', 'Double', 'lengthSq'), call('multiplyQuaternions', 'a : Quaternion, b : Quaternion', 'Quaternion'),
    call('slerpQuaternions', 'a : Quaternion, b : Quaternion, t : Double', 'Quaternion'), call('random', '', 'Quaternion'),
    call('fromBufferAttribute', 'attribute : BufferAttribute, index : Int', 'Quaternion'),
  ]);
  for (const size of [3, 4]) {
    const type = `Matrix${size}`;
    const args = Array.from({length: size}, (_, r) => Array.from({length: size}, (_, c) => `n${r+1}${c+1} : Double`)).flat().join(', ');
    add(type, [...arrays(type), m('set', args, type), call('extractBasis', 'x_axis : Vector3, y_axis : Vector3, z_axis : Vector3', type),
      call('multiplyMatrices', `a : ${type}, b : ${type}`, type), call('multiplyScalar', 'scale : Double', type), m('equals', `other : ${type}`, 'Bool')]);
  }
  add('Matrix3', [call('transposeIntoArray', 'values : FixedArray[Double]', 'Matrix3'),
    call('setUvTransform', 'tx : Double, ty : Double, sx : Double, sy : Double, rotation : Double, cx : Double, cy : Double', 'Matrix3'),
    m('scale', 'sx : Double, sy : Double', 'Matrix3'), m('rotate', 'angle : Double', 'Matrix3'), m('translate', 'tx : Double, ty : Double', 'Matrix3'),
    call('makeTranslation', 'x : Double, y : Double', 'Matrix3'), call('makeRotation', 'angle : Double', 'Matrix3'), call('makeScale', 'x : Double, y : Double', 'Matrix3')]);
  add('Matrix4', [
    ...['copyPosition', 'extractRotation'].map(js => call(js, 'matrix : Matrix4', 'Matrix4')), call('setFromMatrix3', 'matrix : Matrix3', 'Matrix4'),
    call('makeBasis', 'x_axis : Vector3, y_axis : Vector3, z_axis : Vector3', 'Matrix4'), call('makeRotationFromEuler', 'euler : Euler', 'Matrix4'),
    call('lookAt', 'eye : Vector3, target : Vector3, up : Vector3', 'Matrix4'), call('determinantAffine', '', 'Double'),
    call('setPosition', 'position : Vector3', 'Matrix4'), m('scale', 'scale : Vector3', 'Matrix4'), call('getMaxScaleOnAxis', '', 'Double'),
    call('makeRotationAxis', 'axis : Vector3, angle : Double', 'Matrix4'), call('makeShear', 'xy : Double, xz : Double, yx : Double, yz : Double, zx : Double, zy : Double', 'Matrix4'),
    ...['makePerspective', 'makeOrthographic'].map(js => call(js, 'left : Double, right : Double, top : Double, bottom : Double, near : Double, far : Double', 'Matrix4')),
  ]);
  add('Box3', [...bounds('Box3', 'Vector3'),
    call('setFromArray', 'values : FixedArray[Double]', 'Box3'), call('setFromBufferAttribute', 'attribute : BufferAttribute', 'Box3'),
    call('expandByObject', 'object : Object3D, precise : Bool', 'Box3'),
    ...['Sphere', 'Plane', 'Triangle'].map(type => call(`intersects${type}`, `other : ${type}`, 'Bool')),
    call('getBoundingSphere', 'target : Sphere', 'Sphere'), call('applyMatrix4', 'matrix : Matrix4', 'Box3')]);
  add('Sphere', [...copy('Sphere'), m('set', 'center : Vector3, radius : Double', 'Sphere'),
    call('setFromPoints', 'points : FixedArray[Vector3]', 'Sphere'), m('set_from_points_with_center', 'points : FixedArray[Vector3], center : Vector3', 'Sphere', 'setFromPoints'),
    call('expandByPoint', 'point : Vector3', 'Sphere'), call('isEmpty', '', 'Bool'), call('makeEmpty', '', 'Sphere'), call('distanceToPoint', 'point : Vector3', 'Double'),
    ...['Box', 'Plane'].map(type => call(`intersects${type}`, `other : ${type === 'Box' ? 'Box3' : type}`, 'Bool')),
    call('clampPoint', 'point : Vector3, target : Vector3', 'Vector3'), call('getBoundingBox', 'target : Box3', 'Box3'),
    call('applyMatrix4', 'matrix : Matrix4', 'Sphere'), m('translate', 'offset : Vector3', 'Sphere'), m('union', 'other : Sphere', 'Sphere')]);
  add('Plane', [...copy('Plane'), m('set', 'normal : Vector3, constant : Double', 'Plane'),
    call('setComponents', 'x : Double, y : Double, z : Double, w : Double', 'Plane'), call('setFromNormalAndCoplanarPoint', 'normal : Vector3, point : Vector3', 'Plane'),
    call('distanceToSphere', 'sphere : Sphere', 'Double'), nullable('intersect_line', 'line : Line3, target : Vector3, clamp_to_line : Bool', 'Vector3', 'self.intersectLine(line, target, clamp_to_line)'),
    ...[['Line', 'Line3'], ['Box', 'Box3'], ['Sphere', 'Sphere']].map(([js, type]) => call(`intersects${js}`, `other : ${type}`, 'Bool')),
    call('coplanarPoint', 'target : Vector3', 'Vector3'), m('translate', 'offset : Vector3', 'Plane')]);
  add('Ray', [...copy('Ray'), call('lookAt', 'target : Vector3', 'Ray'), m('recast', 'distance : Double', 'Ray'),
    call('closestPointToPoint', 'point : Vector3, target : Vector3', 'Vector3'), m('distance_squared_to_point', 'point : Vector3', 'Double', 'distanceSqToPoint'),
    m('distance_squared_to_segment', 'start : Vector3, end : Vector3, target_on_ray : Vector3, target_on_segment : Vector3', 'Double', 'distanceSqToSegment'),
    ...[['Sphere', 'Sphere'], ['Plane', 'Plane'], ['Box', 'Box3']].map(([js, type]) => call(`intersects${js}`, `other : ${type}`, 'Bool')),
    // The runtime returns null for a miss, although @types/three declares number.
    nullable('distance_to_plane', 'plane : Plane', 'Double', 'self.distanceToPlane(plane)'),
    nullable('intersect_triangle', 'a : Vector3, b : Vector3, c : Vector3, backface_culling : Bool, target : Vector3', 'Vector3', 'self.intersectTriangle(a, b, c, backface_culling, target)'),
  ]);
  add('Frustum', [expr('planes', '', 'FixedArray[Plane]', 'self.planes.slice()'),
    m('set', Array.from({length: 6}, (_, i) => `p${i} : Plane`).join(', '), 'Frustum'), m('copy', 'other : Frustum', 'Frustum'), m('clone', '', 'Frustum'), call('intersectsSprite', 'sprite : Sprite', 'Bool')]);
  add('Spherical', [m('set', 'radius : Double, phi : Double, theta : Double', 'Spherical'), m('clone', '', 'Spherical'), m('copy', 'other : Spherical', 'Spherical'), call('setFromCartesianCoords', 'x : Double, y : Double, z : Double', 'Spherical')]);
  add('Color', [...arrays('Color'), call('getHSL', 'target : ColorHSL', 'ColorHSL'), call('getRGB', 'target : Color', 'Color'), m('set_color', 'color : Color', 'Color', 'set'),
    call('setFromVector3', 'vector : Vector3', 'Color'), call('setScalar', 'value : Double', 'Color'), call('setHSL', 'h : Double, s : Double, l : Double', 'Color'),
    call('setStyle', 'style : String', 'Color'), call('setColorName', 'name : String', 'Color'),
    ...['copySRGBToLinear', 'copyLinearToSRGB', 'add', 'sub'].map(js => call(js, 'other : Color', 'Color')),
    ...['convertSRGBToLinear', 'convertLinearToSRGB'].map(js => call(js, '', 'Color')),
    call('getHexString', '', 'String'), call('getStyle', '', 'String'), call('offsetHSL', 'h : Double, s : Double, l : Double', 'Color'),
    call('addColors', 'a : Color, b : Color', 'Color'), call('addScalar', 'value : Double', 'Color'), call('applyMatrix3', 'matrix : Matrix3', 'Color'),
    call('lerpColors', 'a : Color, b : Color, alpha : Double', 'Color'), call('lerpHSL', 'other : Color, alpha : Double', 'Color'),
    call('fromBufferAttribute', 'attribute : BufferAttribute, index : Int', 'Color')]);
}
