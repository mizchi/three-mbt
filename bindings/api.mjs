import { modelingIO, extendModelingIO } from './modeling_io.mjs';
import { materialEdit, extendMaterialEdit } from './material_edit.mjs';
import { assetFormats } from './asset_formats.mjs';
import { spatialDetail, extendSpatialDetail } from './spatial_detail.mjs';
import { objMTL } from './obj_mtl.mjs';
import { sceneTools, extendSceneTools } from './scene_tools.mjs';
import { rigging } from './rigging.mjs';
import { assetExtra } from './asset_extra.mjs';
import { renderExtra, extendRenderExtra } from './render_extra.mjs';
import { gltfPlugins, extendGLTFPlugins } from './gltf_plugins.mjs';
import { parametric } from './parametric.mjs';
import { topology } from './topology.mjs';
import { csg } from './csg.mjs';
import { modelingWorkflow, extendModelingWorkflow } from './modeling_workflow.mjs';
import { modelingEdit, extendModelingEdit } from './modeling_edit.mjs';
import { modeling, extendModeling } from './modeling.mjs';
import { jsonLoaders, extendJsonLoaders } from './json_loaders.mjs';
import { buffersComplete, extendBuffers } from './buffers_complete.mjs';
import { interpolation, extendInterpolation } from './interpolation.mjs';
import { utilities, extendStaticMath } from './utilities.mjs';
import { surfaceComplete, extendSurfaces } from './surface_complete.mjs';
import { sceneComplete, extendScene } from './scene_complete.mjs';
import { mathComplete, extendMath } from './math_complete.mjs';
import { objectHelpers, extendObjects } from './object_helpers.mjs';
import { materialPipeline, extendMaterialPipeline } from './material_pipeline.mjs';
import { texturesExtended, extendTextures } from './textures_extended.mjs';
import { exporters } from './exporters.mjs';
import { curves } from './curves.mjs';
import { dynamicGeometry, extendGeometry } from './dynamic_geometry.mjs';
import { postprocessing } from './postprocessing.mjs';
import { controls, extendControls } from './controls.mjs';
import { renderingAdvanced, extendRendering } from './rendering_advanced.mjs';
import { rendering, objectMethods, sceneMethods } from './rendering.mjs';
import { animation } from './animation.mjs';
import { loaders } from './loaders.mjs';
import { extended } from './extended.mjs';
import { dataBindings } from './data.mjs';
import { extendErgonomics } from './ergonomics.mjs';
import { extendDSL } from './dsl.mjs';
// Binding contract: explicit MoonBit argument/return types and JS member names.
// Only direct forwarding belongs here. Option/enum conversions live in src/.
const method = (name, args, returns, js = name) => ({ name, args, returns, js });
const property = (name, returns, js = name) => ({ name, args: '', returns, expression: `self.${js}` });
const sameReference = (type) => ({
  name: 'same_reference', args: `other : ${type}`, returns: 'Bool', expression: 'self === other',
});
const common = (type) => [
  method('clone', '', type), method('copy', `other : ${type}`, type),
  method('equals', `other : ${type}`, 'Bool'), sameReference(type),
];
const vector = (type, components) => ({
  type,
  factory: { name: type, args: components.map(c => `${c} : Double`).join(', '), js: type.toLowerCase() },
  methods: [
    ...components.map(c => property(c, 'Double')),
    method('set', components.map(c => `${c} : Double`).join(', '), type),
    ...common(type),
    ...['add', 'sub', 'multiply', 'divide', 'min', 'max'].map(name => method(name, `other : ${type}`, type)),
    method('multiply_scalar', 'scalar : Double', type, 'multiplyScalar'),
    method('divide_scalar', 'scalar : Double', type, 'divideScalar'),
    method('dot', `other : ${type}`, 'Double'),
    method('length', '', 'Double'), method('length_squared', '', 'Double', 'lengthSq'),
    method('normalize', '', type), method('negate', '', type),
    method('distance_to', `other : ${type}`, 'Double', 'distanceTo'),
    method('lerp', `other : ${type}, alpha : Double`, type),
  ],
});

export const bindings = [
  vector('Vector2', ['x', 'y']),
  {
    ...vector('Vector3', ['x', 'y', 'z']),
    methods: [
      ...vector('Vector3', ['x', 'y', 'z']).methods,
      method('cross', 'other : Vector3', 'Vector3'),
      method('apply_quaternion', 'quaternion : Quaternion', 'Vector3', 'applyQuaternion'),
      method('apply_matrix4', 'matrix : Matrix4', 'Vector3', 'applyMatrix4'),
      method('apply_matrix3', 'matrix : Matrix3', 'Vector3', 'applyMatrix3'),
      method('set_from_spherical', 'spherical : Spherical', 'Vector3', 'setFromSpherical'),
      method('transform_direction', 'matrix : Matrix4', 'Vector3', 'transformDirection'),
      method('project', 'camera : Camera', 'Vector3'),
      method('unproject', 'camera : Camera', 'Vector3'),
    ],
  },
  {
    type: 'Quaternion',
    factory: { name: 'from_xyzw', args: 'x : Double, y : Double, z : Double, w : Double', js: 'quaternion' },
    methods: [
      ...['x', 'y', 'z', 'w'].map(c => property(c, 'Double')),
      ...common('Quaternion'),
      method('set', 'x : Double, y : Double, z : Double, w : Double', 'Quaternion'),
      method('identity', '', 'Quaternion'), method('normalize', '', 'Quaternion'),
      method('invert', '', 'Quaternion'), method('conjugate', '', 'Quaternion'),
      method('length', '', 'Double'), method('dot', 'other : Quaternion', 'Double'),
      method('multiply', 'other : Quaternion', 'Quaternion'),
      method('premultiply', 'other : Quaternion', 'Quaternion'),
      method('slerp', 'other : Quaternion, alpha : Double', 'Quaternion'),
      method('angle_to', 'other : Quaternion', 'Double', 'angleTo'),
      method('set_from_axis_angle', 'axis : Vector3, angle : Double', 'Quaternion', 'setFromAxisAngle'),
      method('set_from_euler', 'euler : Euler', 'Quaternion', 'setFromEuler'),
      method('set_from_rotation_matrix', 'matrix : Matrix4', 'Quaternion', 'setFromRotationMatrix'),
    ],
  },
  {
    type: 'Euler',
    methods: [
      ...['x', 'y', 'z'].map(c => property(c, 'Double')), ...common('Euler'),
      method('set_from_quaternion', 'quaternion : Quaternion', 'Euler', 'setFromQuaternion'),
      method('set_from_rotation_matrix', 'matrix : Matrix4', 'Euler', 'setFromRotationMatrix'),
    ],
  },
  {
    type: 'Matrix4',
    factory: { name: 'Matrix4', args: '', js: 'matrix4' },
    methods: [
      ...common('Matrix4'), method('identity', '', 'Matrix4'),
      method('multiply', 'other : Matrix4', 'Matrix4'),
      method('premultiply', 'other : Matrix4', 'Matrix4'),
      method('multiply_matrices', 'left : Matrix4, right : Matrix4', 'Matrix4', 'multiplyMatrices'),
      method('invert', '', 'Matrix4'), method('transpose', '', 'Matrix4'),
      method('determinant', '', 'Double'),
      method('make_translation', 'x : Double, y : Double, z : Double', 'Matrix4', 'makeTranslation'),
      method('make_scale', 'x : Double, y : Double, z : Double', 'Matrix4', 'makeScale'),
      ...['x', 'y', 'z'].map(axis => method(`make_rotation_${axis}`, 'angle : Double', 'Matrix4', `makeRotation${axis.toUpperCase()}`)),
      method('make_rotation_from_quaternion', 'quaternion : Quaternion', 'Matrix4', 'makeRotationFromQuaternion'),
      method('compose', 'position : Vector3, quaternion : Quaternion, scale : Vector3', 'Matrix4'),
      method('decompose', 'position : Vector3, quaternion : Quaternion, scale : Vector3', 'Matrix4'),
      { name: 'elements', args: '', returns: 'FixedArray[Double]', expression: 'self.elements.slice()' },
    ],
  },
  {
    type: 'Color',
    factory: { name: 'from_hex', args: 'hex : Int', js: 'colorHex' },
    methods: [
      ...['r', 'g', 'b'].map(c => property(c, 'Double')), ...common('Color'),
      method('set_hex', 'hex : Int', 'Color', 'setHex'), method('get_hex', '', 'Int', 'getHex'),
      method('set_rgb', 'r : Double, g : Double, b : Double', 'Color', 'setRGB'),
      method('lerp', 'other : Color, alpha : Double', 'Color'),
      method('multiply', 'other : Color', 'Color'),
      method('multiply_scalar', 'scalar : Double', 'Color', 'multiplyScalar'),
    ],
  },
  {
    type: 'Object3D',
    factory: { name: 'Object3D', args: '', js: 'object3D' },
    methods: [
      sameReference('Object3D'),
      ...objectMethods,
      property('id', 'Int'), property('uuid', 'String'), property('kind', 'String', 'type'),
      property('name', 'String'), property('visible', 'Bool'),
      property('position', 'Vector3'), property('rotation', 'Euler'),
      property('quaternion', 'Quaternion'), property('scale', 'Vector3'), property('up', 'Vector3'),
      property('matrix', 'Matrix4'), property('matrix_world', 'Matrix4', 'matrixWorld'),
      { name: 'set_name', args: 'name : String', returns: 'Unit', expression: '{ self.name = name; }' },
      { name: 'set_visible', args: 'visible : Bool', returns: 'Unit', expression: '{ self.visible = visible; }' },
      { name: 'children', args: '', returns: 'FixedArray[Object3D]', expression: 'self.children.slice()' },
      method('add', 'child : Object3D', 'Object3D'), method('remove', 'child : Object3D', 'Object3D'),
      method('attach', 'child : Object3D', 'Object3D'), method('clear', '', 'Object3D'),
      method('remove_from_parent', '', 'Object3D', 'removeFromParent'),
      method('look_at', 'target : Vector3', 'Unit', 'lookAt'),
      ...['x', 'y', 'z'].map(axis => method(`rotate_${axis}`, 'angle : Double', 'Object3D', `rotate${axis.toUpperCase()}`)),
      ...['x', 'y', 'z'].map(axis => method(`translate_${axis}`, 'distance : Double', 'Object3D', `translate${axis.toUpperCase()}`)),
      method('apply_matrix4', 'matrix : Matrix4', 'Unit', 'applyMatrix4'),
      method('apply_quaternion', 'quaternion : Quaternion', 'Object3D', 'applyQuaternion'),
      method('update_matrix', '', 'Unit', 'updateMatrix'),
      method('update_matrix_world', 'force : Bool', 'Unit', 'updateMatrixWorld'),
      method('update_world_matrix', 'update_parents : Bool, update_children : Bool', 'Unit', 'updateWorldMatrix'),
      method('get_world_position', 'target : Vector3', 'Vector3', 'getWorldPosition'),
      method('get_world_quaternion', 'target : Quaternion', 'Quaternion', 'getWorldQuaternion'),
      method('get_world_scale', 'target : Vector3', 'Vector3', 'getWorldScale'),
      method('get_world_direction', 'target : Vector3', 'Vector3', 'getWorldDirection'),
      method('local_to_world', 'vector : Vector3', 'Vector3', 'localToWorld'),
      method('world_to_local', 'vector : Vector3', 'Vector3', 'worldToLocal'),
      method('traverse', 'callback : (Object3D) -> Unit', 'Unit'),
      method('traverse_visible', 'callback : (Object3D) -> Unit', 'Unit', 'traverseVisible'),
    ],
  },
  { type: 'Group', factory: { name: 'Group', args: '', js: 'group' }, methods: [] },
  { type: 'Scene', factory: { name: 'Scene', args: '', js: 'scene' }, methods: sceneMethods },
  ...rendering,
  ...animation,
  ...loaders,
  ...extended,
  ...dataBindings,
  ...renderingAdvanced,
  ...controls,
  ...postprocessing,
  ...dynamicGeometry,
  ...curves,
  ...exporters,
  ...texturesExtended,
  ...materialPipeline,
  ...objectHelpers,
];

extendRendering(bindings);

extendControls(bindings);

extendGeometry(bindings);

extendTextures(bindings);

extendMaterialPipeline(bindings);

extendObjects(bindings);

bindings.push(...mathComplete);
extendMath(bindings);

bindings.push(...sceneComplete);
extendScene(bindings);

bindings.push(...surfaceComplete);
extendSurfaces(bindings);

bindings.push(...utilities);
extendStaticMath(bindings);

bindings.push(...interpolation);
extendInterpolation(bindings);

bindings.push(...buffersComplete);
extendBuffers(bindings);

bindings.push(...jsonLoaders);
extendJsonLoaders(bindings);

bindings.push(...modeling);
extendModeling(bindings);
bindings.push(...modelingIO);
extendModelingIO(bindings);
bindings.push(...modelingEdit);
extendModelingEdit(bindings);
bindings.push(...modelingWorkflow);
extendModelingWorkflow(bindings);
bindings.push(...materialEdit);
extendMaterialEdit(bindings);
bindings.push(...assetFormats);
bindings.push(...spatialDetail);
extendSpatialDetail(bindings);
bindings.push(...objMTL);
bindings.push(...sceneTools);
extendSceneTools(bindings);
bindings.push(...rigging);
bindings.push(...assetExtra);
bindings.push(...renderExtra);
extendRenderExtra(bindings);
bindings.push(...gltfPlugins);
extendGLTFPlugins(bindings);
bindings.push(...parametric);
bindings.push(...topology);
bindings.push(...csg);

extendDSL(bindings);
extendErgonomics(bindings);
