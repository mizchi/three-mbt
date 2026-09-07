import { m, p, rw, expr, nullable, optional, material, geometry, node, upcast, cls } from './helpers.mjs';
const snake = name => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const call = (js, args = '', returns = 'Unit') => m(snake(js), args, returns, js);
const maps = names => names.split(' ').flatMap(js => [nullable(snake(js), '', 'Texture', `self.${js}`), optional(snake(js), 'Texture', js)]);
const scalars = names => names.split(' ').flatMap(js => rw(snake(js), 'Double', js));
const flags = names => names.split(' ').flatMap(js => rw(snake(js), 'Bool', js));

export const surfaceComplete = [
  ...['TetrahedronGeometry', 'OctahedronGeometry', 'DodecahedronGeometry'].map(type => cls(type, 'radius : Double, detail : Int', geometry())),
  cls('PolyhedronGeometry', 'vertices : FixedArray[Double], indices : FixedArray[Int], radius : Double, detail : Int', geometry()),
  cls('LineLoop', 'geometry : BufferGeometry, material : Material', [...node(), upcast('line', 'Line')]),
  cls('LineDashedMaterial', 'color : Int, scale : Double, dash_size : Double, gap_size : Double', [
    ...material(), upcast('line_basic_material', 'LineBasicMaterial'), ...scalars('scale dashSize gapSize'),
  ], {factory: {name: 'LineDashedMaterial', args: 'color : Int, scale : Double, dash_size : Double, gap_size : Double', js: 'lineDashedMaterial', options: {dash_size: 'dashSize', gap_size: 'gapSize'}}}),
];

export function extendSurfaces(bindings) {
  const add = (type, methods) => {
    const binding = bindings.find(b => b.type === type);
    for (const method of methods) if (!binding.methods.some(m => m.name === method.name)) binding.methods.push(method);
  };
  add('Material', [p('uuid', 'String'), p('version', 'Int'), ...flags('forceSinglePass allowOverride'),
    nullable('shadow_side', '', 'Side', 'self.shadowSide'), optional('shadow_side', 'Side', 'shadowSide'),
    m('copy', 'source : Material', 'Material'), call('customProgramCacheKey', '', 'String')]);
  add('MeshBasicMaterial', [
    ...maps('lightMap aoMap specularMap alphaMap envMap'), ...scalars('lightMapIntensity aoMapIntensity reflectivity refractionRatio wireframeLinewidth'),
    p('env_map_rotation', 'Euler', 'envMapRotation'), ...rw('combine', 'CombineOperation'), ...flags('fog')]);
  for (const type of ['MeshLambertMaterial', 'MeshPhongMaterial', 'MeshToonMaterial']) {
    add(type, [...maps('lightMap aoMap emissiveMap bumpMap normalMap displacementMap alphaMap'),
      ...scalars('lightMapIntensity aoMapIntensity emissiveIntensity bumpScale displacementScale displacementBias wireframeLinewidth'),
      ...rw('normal_map_type', 'NormalMapType', 'normalMapType'), p('normal_scale', 'Vector2', 'normalScale'), ...flags('wireframe fog')]);
    if (type !== 'MeshToonMaterial') add(type, [...maps('specularMap envMap'), ...scalars('reflectivity envMapIntensity refractionRatio'),
      ...rw('combine', 'CombineOperation'), p('env_map_rotation', 'Euler', 'envMapRotation'), ...flags('flatShading')]);
  }
  for (const type of ['MeshNormalMaterial', 'MeshMatcapMaterial']) {
    add(type, [...maps('bumpMap normalMap displacementMap'), ...scalars('bumpScale displacementScale displacementBias wireframeLinewidth'),
      ...rw('normal_map_type', 'NormalMapType', 'normalMapType'), p('normal_scale', 'Vector2', 'normalScale'), ...flags('flatShading wireframe')]);
  }
  add('MeshMatcapMaterial', [...maps('alphaMap'), ...flags('fog')]);
  for (const type of ['MeshDepthMaterial', 'MeshDistanceMaterial']) add(type, [...maps('displacementMap'), ...scalars('displacementScale displacementBias')]);
  add('MeshDepthMaterial', scalars('wireframeLinewidth'));
  add('MeshStandardMaterial', [...scalars('wireframeLinewidth'), ...flags('fog')]);
  for (const type of ['PointsMaterial', 'SpriteMaterial']) add(type, [...maps('alphaMap'), ...flags('fog')]);
  add('SpriteMaterial', flags('sizeAttenuation'));
  for (const type of ['LineBasicMaterial', 'ShadowMaterial']) add(type, flags('fog'));
  add('ShaderMaterial', [...scalars('linewidth wireframeLinewidth'), ...flags('fog lights clipping uniformsNeedUpdate'),
    ...['clipCullDistance', 'multiDraw'].flatMap(js => [expr(snake(js), '', 'Bool', `self.extensions.${js}`), expr(`set_${snake(js)}`, 'value : Bool', 'Unit', `{ self.extensions.${js} = value; }`)]),
    nullable('index0_attribute_name', '', 'String', 'self.index0AttributeName'), { ...optional('index0_attribute_name', 'String'), expression: '{ self.index0AttributeName = value ?? undefined; }' },
  ]);
  add('Light', [m('dispose'), m('copy', 'source : Light, recursive : Bool', 'Light')]);
  for (const type of ['PointLight', 'SpotLight']) add(type, [...rw('power', 'Double'), m('copy', `source : ${type}, recursive : Bool`, type)]);
  add('DirectionalLight', [m('copy', 'source : DirectionalLight', 'DirectionalLight')]);
  add('SpotLight', maps('map'));
  add('LightShadow', [...rw('intensity', 'Double'), p('matrix', 'Matrix4'),
    call('getViewportCount', '', 'Int'), call('getFrustum', '', 'Frustum'), call('updateMatrices', 'light : Light'), call('getViewport', 'index : Int', 'Vector4'), call('getFrameExtents', '', 'Vector2'),
    m('copy', 'source : LightShadow', 'LightShadow'), m('clone', '', 'LightShadow')]);
  add('Skeleton', [p('uuid', 'String'), ...rw('frame', 'Int'), expr('bone_inverses', '', 'FixedArray[Matrix4]', 'self.boneInverses.slice()'),
    nullable('bone_matrices', '', 'FixedArray[Double]', 'self.boneMatrices ? Array.from(self.boneMatrices) : null'), nullable('bone_texture', '', 'DataTexture', 'self.boneTexture'),
    m('init'), call('calculateInverses'), call('computeBoneTexture', '', 'Skeleton'), m('clone', '', 'Skeleton')]);
  add('SkinnedMesh', [p('bind_matrix', 'Matrix4', 'bindMatrix'), p('bind_matrix_inverse', 'Matrix4', 'bindMatrixInverse'),
    nullable('bounding_box', '', 'Box3', 'self.boundingBox'), nullable('bounding_sphere', '', 'Sphere', 'self.boundingSphere'),
    call('computeBoundingBox'), call('computeBoundingSphere'), call('applyBoneTransform', 'index : Int, vector : Vector3', 'Vector3'),
    m('apply_bone_transform4', 'index : Int, vector : Vector4', 'Vector4', 'applyBoneTransform')]);
  add('BufferGeometry', [p('uuid', 'String'), p('kind', 'String', 'type'), p('user_data', 'UserData', 'userData'),
    expr('attribute_names', '', 'FixedArray[String]', 'Object.keys(self.attributes)'),
    call('applyQuaternion', 'quaternion : Quaternion', 'BufferGeometry'), call('lookAt', 'vector : Vector3', 'BufferGeometry'),
    m('set_from_points', 'points : FixedArray[Vector3]', 'BufferGeometry', 'setFromPoints'), m('set_from_points2', 'points : FixedArray[Vector2]', 'BufferGeometry', 'setFromPoints'),
    call('computeTangents'), call('normalizeNormals'), m('copy', 'source : BufferGeometry', 'BufferGeometry'),
    expr('draw_range_start', '', 'Int', 'self.drawRange.start'), expr('draw_range_count', '', 'Double', 'self.drawRange.count'),
  ]);
  for (const type of ['Line', 'LineSegments']) add(type, [call('computeLineDistances', '', type), p('geometry', 'BufferGeometry')]);
  add('Timer', [call('getTimescale', '', 'Double')]);
}
