import { m, p, rw, expr, nullable, material, cls } from './helpers.mjs';

export const extended = [
  cls('Vector4', 'x : Double, y : Double, z : Double, w : Double', [
    ...['x','y','z','w'].map(c => p(c, 'Double')), m('set', 'x : Double, y : Double, z : Double, w : Double', 'Vector4'),
    m('clone', '', 'Vector4'), m('copy', 'other : Vector4', 'Vector4'), m('add', 'other : Vector4', 'Vector4'), m('sub', 'other : Vector4', 'Vector4'),
    m('multiply_scalar', 'scalar : Double', 'Vector4', 'multiplyScalar'), m('dot', 'other : Vector4', 'Double'), m('normalize', '', 'Vector4'),
    m('length', '', 'Double'), m('apply_matrix4', 'matrix : Matrix4', 'Vector4', 'applyMatrix4'),
  ]),
  cls('Matrix3', '', [
    m('clone', '', 'Matrix3'), m('copy', 'other : Matrix3', 'Matrix3'), m('identity', '', 'Matrix3'), m('invert', '', 'Matrix3'), m('transpose', '', 'Matrix3'),
    m('multiply', 'other : Matrix3', 'Matrix3'), m('premultiply', 'other : Matrix3', 'Matrix3'), m('determinant', '', 'Double'),
    m('get_normal_matrix', 'matrix : Matrix4', 'Matrix3', 'getNormalMatrix'), m('set_from_matrix4', 'matrix : Matrix4', 'Matrix3', 'setFromMatrix4'),
    expr('elements', '', 'FixedArray[Double]', 'self.elements.slice()'),
  ]),
  cls('Plane', 'normal : Vector3, constant : Double', [
    p('normal', 'Vector3'), ...rw('constant', 'Double'), m('normalize', '', 'Plane'), m('negate', '', 'Plane'),
    m('distance_to_point', 'point : Vector3', 'Double', 'distanceToPoint'), m('project_point', 'point : Vector3, target : Vector3', 'Vector3', 'projectPoint'),
    m('set_from_coplanar_points', 'a : Vector3, b : Vector3, c : Vector3', 'Plane', 'setFromCoplanarPoints'),
    m('apply_matrix4', 'matrix : Matrix4', 'Plane', 'applyMatrix4'), m('clone', '', 'Plane'),
  ]),
  cls('Ray', 'origin : Vector3, direction : Vector3', [
    p('origin', 'Vector3'), p('direction', 'Vector3'), m('set', 'origin : Vector3, direction : Vector3', 'Ray'), m('at', 'distance : Double, target : Vector3', 'Vector3'),
    nullable('intersect_plane', 'plane : Plane, target : Vector3', 'Vector3', 'self.intersectPlane(plane, target)'),
    nullable('intersect_box', 'box : Box3, target : Vector3', 'Vector3', 'self.intersectBox(box, target)'),
    nullable('intersect_sphere', 'sphere : Sphere, target : Vector3', 'Vector3', 'self.intersectSphere(sphere, target)'),
    m('distance_to_point', 'point : Vector3', 'Double', 'distanceToPoint'), m('apply_matrix4', 'matrix : Matrix4', 'Ray', 'applyMatrix4'), m('clone', '', 'Ray'),
  ]),
  cls('Frustum', '', [
    m('set_from_projection_matrix', 'matrix : Matrix4', 'Frustum', 'setFromProjectionMatrix'),
    m('contains_point', 'point : Vector3', 'Bool', 'containsPoint'), m('intersects_object', 'object : Object3D', 'Bool', 'intersectsObject'),
    m('intersects_box', 'box : Box3', 'Bool', 'intersectsBox'), m('intersects_sphere', 'sphere : Sphere', 'Bool', 'intersectsSphere'),
  ]),
  cls('Spherical', 'radius : Double, phi : Double, theta : Double', [
    ...['radius', 'phi', 'theta'].flatMap(c => rw(c, 'Double')), m('set_from_vector3', 'vector : Vector3', 'Spherical', 'setFromVector3'), m('make_safe', '', 'Spherical', 'makeSafe'),
  ]),
  cls('Timer', '', [
    m('update', 'timestamp_ms : Double', 'Timer'), m('get_delta', '', 'Double', 'getDelta'), m('get_elapsed', '', 'Double', 'getElapsed'),
    m('set_timescale', 'scale : Double', 'Timer', 'setTimescale'), m('reset', '', 'Timer'), m('dispose'),
  ]),
  cls('Uniforms', '', [
    ...[
      ['float', 'Double', 'typeof value === "number"'], ['int', 'Int', 'Number.isInteger(value) && value >= -2147483648 && value <= 2147483647'],
      ['bool', 'Bool', 'typeof value === "boolean"'], ['color', 'Color', 'value?.isColor'],
      ['vector2', 'Vector2', 'value?.isVector2'], ['vector3', 'Vector3', 'value?.isVector3'], ['vector4', 'Vector4', 'value?.isVector4'],
      ['matrix3', 'Matrix3', 'value?.isMatrix3'], ['matrix4', 'Matrix4', 'value?.isMatrix4'], ['texture', 'Texture', 'value?.isTexture'],
    ].flatMap(([name, type, predicate]) => [
      expr(`set_${name}`, `name : String, value : ${type}`, 'Unit', '{ if (Object.hasOwn(self, name)) self[name].value = value; else self[name] = { value }; }'),
      nullable(`get_${name}`, 'name : String', type, `{ const value = Object.hasOwn(self, name) ? self[name].value : undefined; return ${predicate} ? value : null; }`),
    ]),
  ], { factory: null }),
  cls('ShaderMaterial', '', [...material(), p('uniforms', 'Uniforms'), ...rw('vertex_shader', 'String', 'vertexShader'), ...rw('fragment_shader', 'String', 'fragmentShader'), ...rw('wireframe', 'Bool')], { factory: null }),
];
