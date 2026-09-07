import { m, p, rw, expr, nullable, optional, upcast, geometry, node, cls } from './helpers.mjs';
const addon = (type, args, methods) => cls(type, args, methods, {factory: {name: type, args, js: type[0].toLowerCase() + type.slice(1), module: 'modeling-edit'}});
const checked = method => ({...method, throws: 'ModelingError'});
export const modelingEdit = [
  addon('SelectionBox', 'camera : Camera, scene : Scene, depth : Double', [
    ...rw('camera', 'Camera'), ...rw('scene', 'Scene'), ...rw('depth', 'Double', 'deep'), p('start_point', 'Vector3', 'startPoint'), p('end_point', 'Vector3', 'endPoint'),
    expr('select', 'start : Vector3, end : Vector3', 'FixedArray[Object3D]', 'self.select(start, end).slice()'),
    expr('collection', '', 'FixedArray[Object3D]', 'self.collection.slice()'),
    expr('instance_ids', 'mesh : InstancedMesh', 'FixedArray[Int]', '(self.instances[mesh.uuid] ?? []).slice()'),
    expr('batch_ids', 'mesh : BatchedMesh', 'FixedArray[BatchedInstanceId]', '(self.batches[mesh.uuid] ?? []).slice()'),
  ]),
  addon('SelectionHelper', 'renderer : WebGLRenderer, css_class : String', [
    ...rw('enabled', 'Bool'), p('is_down', 'Bool', 'isDown'), p('element', 'SelectionElement'), p('renderer', 'WebGLRenderer'), m('dispose'),
  ]),
  cls('SelectionElement', '', [p('class_name', 'String', 'className'), p('is_connected', 'Bool', 'isConnected'),
    expr('set_css_text', 'css : String', 'Unit', '{ self.style.cssText = css; self.style.pointerEvents = "none"; }'),
  ], {factory: null}),
  addon('NURBSCurve', 'degree : Int, knots : FixedArray[Double], control_points : FixedArray[Vector4]', [
    upcast('curve3', 'Curve3'), p('degree', 'Int'), expr('knots', '', 'FixedArray[Double]', 'self.knots.slice()'),
    expr('control_points', '', 'FixedArray[Vector4]', 'self.controlPoints.slice()'), ...rw('start_knot', 'Int', 'startKnot'), ...rw('end_knot', 'Int', 'endKnot'),
  ]),
  addon('NURBSSurface', 'degree_u : Int, degree_v : Int, knots_u : FixedArray[Double], knots_v : FixedArray[Double], control_points : FixedArray[FixedArray[Vector4]]', [
    m('get_point', 'u : Double, v : Double, target : Vector3', 'Unit', 'getPoint'),
    expr('control_points', '', 'FixedArray[FixedArray[Vector4]]', 'self.controlPoints.map(row => row.slice())'),
  ]),
  addon('Flow', 'mesh : Mesh, curve_count : Int', [p('object', 'Mesh', 'object3D'), p('spline_texture', 'DataTexture', 'splineTexture'),
    p('uniforms', 'FlowUniforms'), checked(expr('update_curve', 'index : Int, curve : Curve3', 'Unit', '{ if (index < 0 || index >= self.curveArray.length) throw new RangeError("Curve index out of range"); const length = curve.getLength(); if (!(length > 0) || !Number.isFinite(length)) throw new RangeError("Flow requires a finite, positive curve length"); self.updateCurve(index, curve); }')), m('move_along_curve', 'amount : Double', 'Unit', 'moveAlongCurve'),
    nullable('curve', 'index : Int', 'Curve3', 'self.curveArray[index]'), nullable('curve_length', 'index : Int', 'Double', 'self.curveLengthArray[index]'),
  ]),
  addon('InstancedFlow', 'count : Int, curve_count : Int, geometry : BufferGeometry, material : Material', [upcast('flow', 'Flow'), p('object', 'InstancedMesh', 'object3D'),
    checked(expr('set_curve', 'index : Int, curve_index : Int', 'Unit', '{ if (index < 0 || index >= self.object3D.count || curve_index < 0 || curve_index >= self.curveArray.length || !self.curveArray[curve_index]) throw new RangeError("Instance index or initialized curve required"); self.setCurve(index, curve_index); }')),
    checked(expr('move_individual_along_curve', 'index : Int, amount : Double', 'Unit', '{ if (index < 0 || index >= self.object3D.count || !self.curveArray[self.whichCurve[index]]) throw new RangeError("Instance index or initialized curve required"); self.moveIndividualAlongCurve(index, amount); }')),
  ]),
  cls('FlowUniforms', '', [
    ...['pathOffset', 'pathSegment', 'spineOffset'].flatMap(key => {
      const name = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      return [expr(name, '', 'Double', `self.${key}.value`), expr(`set_${name}`, 'value : Double', 'Unit', `{ self.${key}.value = value; }`)];
    }),
    expr('enabled', '', 'Bool', 'self.flow.value !== 0'), expr('set_enabled', 'value : Bool', 'Unit', '{ self.flow.value = value ? 1 : 0; }'),
  ], {factory: null}),
  addon('DecalGeometry', 'mesh : Mesh, position : Vector3, orientation : Euler, size : Vector3', geometry()),
  cls('UVVertices', '', [p('length', 'Int'), expr('get', 'index : Int', 'Double', 'self[index]')], {factory: null}),
  addon('UVGenerator', 'top : (ExtrudeGeometry, UVVertices, Int, Int, Int) -> FixedArray[Vector2], side : (ExtrudeGeometry, UVVertices, Int, Int, Int, Int) -> FixedArray[Vector2]', []),
  ...['VertexNormalsHelper', 'VertexTangentsHelper'].map(type => addon(type, 'object : Object3D, size : Double, color : Int', [
    ...node(), upcast('line_segments', 'LineSegments'), p('object', 'Object3D'), ...rw('size', 'Double'), m('update'), m('dispose'),
  ])),
];
export function extendModelingEdit(bindings) {
  const controls = bindings.find(b => b.type === 'TransformControls');
  controls.methods.push(
    ...['minX','maxX','minY','maxY','minZ','maxZ'].flatMap(key => rw(key.replace(/[A-Z]/g, c => '_' + c.toLowerCase()), 'Double', key)),
    ...['XY','YZ','XZ','XYZE','E'].flatMap(axis => rw('show_' + axis.toLowerCase(), 'Bool', 'show' + axis)),
    nullable('viewport', '', 'Vector4', 'self.viewport'), optional('viewport', 'Vector4'),
    m('set_colors', 'x : Color, y : Color, z : Color, active : Color', 'Unit', 'setColors'), m('get_raycaster', '', 'Raycaster', 'getRaycaster'),
  );
  const options = bindings.find(b => b.type === 'ExtrudeOptions');
  options.methods.push(nullable('uv_generator', '', 'UVGenerator', 'self.UVGenerator'),
    {name: 'set_uv_generator', option: 'UVGenerator', expression: '{ if (value == null) delete self.UVGenerator; else self.UVGenerator = value; }'});
}
