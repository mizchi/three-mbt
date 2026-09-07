import { m, p, rw, expr, nullable, optional, upcast, geometry, cls } from './helpers.mjs';
const snake = s => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const addon = (type, args, methods) => cls(type, args, methods, {factory: {name: type, args, js: type[0].toLowerCase() + type.slice(1), module: 'modeling'}});

export const modeling = [
  addon('TessellateModifier', 'max_edge_length : Double, max_iterations : Int', [
    ...rw('max_edge_length', 'Double', 'maxEdgeLength'), ...rw('max_iterations', 'Int', 'maxIterations'),
    {...m('modify', 'geometry : BufferGeometry', 'BufferGeometry'), throws: 'ModelingError'},
  ]),
  addon('SimplifyModifier', '', [{...m('modify', 'geometry : BufferGeometry, vertices_to_remove : Int', 'BufferGeometry'), throws: 'ModelingError'}]),
  addon('EdgeSplitModifier', '', [{...m('modify', 'geometry : BufferGeometry, cutoff_angle : Double, keep_normals : Bool', 'BufferGeometry'), throws: 'ModelingError'}]),
  addon('OBJExporter', '', [{...m('parse', 'root : Object3D', 'String'), throws: 'ExportError'}]),
  addon('STLExporter', '', [
    {...expr('export_ascii', 'root : Object3D', 'String', 'self.parse(root, { binary: false })'), throws: 'ExportError', upstream: 'parse'},
    {...expr('export_binary', 'root : Object3D', 'Bytes', '{ const view = self.parse(root, { binary: true }); return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice(); }'), throws: 'ExportError', upstream: 'parse'},
  ]),
  addon('OBJLoader', '', [upcast('loader', 'Loader'),
    {...m('parse', 'text : String', 'Group'), throws: 'LoadError'},
    {...expr('load', 'url : String', 'Group', 'self.loadAsync(url)'), throws: 'LoadError', async: true, upstream: 'loadAsync'},
  ]),
  addon('STLLoader', '', [upcast('loader', 'Loader'),
    {...expr('parse', 'data : Bytes', 'BufferGeometry', 'self.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))'), throws: 'LoadError', upstream: 'parse'},
    {...m('parse_ascii', 'text : String', 'BufferGeometry', 'parse'), throws: 'LoadError'},
    {...expr('load', 'url : String', 'BufferGeometry', 'self.loadAsync(url)'), throws: 'LoadError', async: true, upstream: 'loadAsync'},
  ]),
  cls('MorphedAttributes', '', [p('position', 'BufferAttribute', 'positionAttribute'), p('normal', 'BufferAttribute', 'normalAttribute'), p('morphed_position', 'BufferAttribute', 'morphedPositionAttribute'), p('morphed_normal', 'BufferAttribute', 'morphedNormalAttribute')], {factory: null}),
  cls('ArcCurve', 'x : Double, y : Double, radius : Double, start_angle : Double, end_angle : Double, clockwise : Bool', [upcast('curve2', 'Curve2'), upcast('ellipse_curve', 'EllipseCurve')]),
  cls('ShapePath', '', [p('color', 'Color'), p('user_data', 'UserData', 'userData'),
    expr('sub_paths', '', 'FixedArray[Path]', 'self.subPaths.slice()'), nullable('current_path', '', 'Path', 'self.currentPath'),
    m('move_to', 'x : Double, y : Double', 'ShapePath', 'moveTo'), m('line_to', 'x : Double, y : Double', 'ShapePath', 'lineTo'),
    m('quadratic_curve_to', 'cx : Double, cy : Double, x : Double, y : Double', 'ShapePath', 'quadraticCurveTo'),
    m('bezier_curve_to', 'cx1 : Double, cy1 : Double, cx2 : Double, cy2 : Double, x : Double, y : Double', 'ShapePath', 'bezierCurveTo'),
    m('spline_thru', 'points : FixedArray[Vector2]', 'ShapePath', 'splineThru'), m('to_shapes', '', 'FixedArray[Shape]', 'toShapes'),
  ]),
  cls('ShapePoints', '', [expr('shape', '', 'FixedArray[Vector2]', 'self.shape.slice()'), expr('holes', '', 'FixedArray[FixedArray[Vector2]]', 'self.holes.map(hole => hole.slice())')], {factory: null}),
  cls('FrenetFrames', '', ['tangents', 'normals', 'binormals'].map(n => expr(n, '', 'FixedArray[Vector3]', `self.${n}.slice()`)), {factory: null}),
  addon('ParametricGeometry', 'surface : (Double, Double, Vector3) -> Unit, slices : Int, stacks : Int', geometry()),
  addon('ConvexGeometry', 'points : FixedArray[Vector3]', geometry()),
  addon('RoundedBoxGeometry', 'width : Double, height : Double, depth : Double, segments : Int, radius : Double', [...geometry(), upcast('box_geometry', 'BoxGeometry')]),
  cls('Face', '', [...['a', 'b', 'c'].map(n => p(n, 'Int')), p('normal', 'Vector3'), p('material_index', 'Int', 'materialIndex')], {factory: null}),
];

export function extendModeling(bindings) {
  const get = type => bindings.find(b => b.type === type);
  const add = (type, methods) => {
    const binding = get(type);
    for (const method of methods) if (!binding.methods.some(m => m.name === method.name)) binding.methods.push(method);
  };
  // Optional native constructor arguments are separate named constructors so
  // existing short constructors remain source-compatible.
  for (const [type, name, args] of [
    ['BoxGeometry', 'segmented', 'width : Double, height : Double, depth : Double, width_segments : Int, height_segments : Int, depth_segments : Int'],
    ['PlaneGeometry', 'segmented', 'width : Double, height : Double, width_segments : Int, height_segments : Int'],
    ['CylinderGeometry', 'section', 'radius_top : Double, radius_bottom : Double, height : Double, radial_segments : Int, height_segments : Int, open_ended : Bool, theta_start : Double, theta_length : Double'],
    ['ConeGeometry', 'section', 'radius : Double, height : Double, radial_segments : Int, height_segments : Int, open_ended : Bool, theta_start : Double, theta_length : Double'],
    ['SphereGeometry', 'section', 'radius : Double, width_segments : Int, height_segments : Int, phi_start : Double, phi_length : Double, theta_start : Double, theta_length : Double'],
    ['TorusGeometry', 'arc', 'radius : Double, tube : Double, radial_segments : Int, tubular_segments : Int, arc : Double'],
    ['TorusKnotGeometry', 'with_winding', 'radius : Double, tube : Double, tubular_segments : Int, radial_segments : Int, p : Int, q : Int'],
    ['CircleGeometry', 'arc', 'radius : Double, segments : Int, theta_start : Double, theta_length : Double'],
    ['RingGeometry', 'section', 'inner_radius : Double, outer_radius : Double, theta_segments : Int, phi_segments : Int, theta_start : Double, theta_length : Double'],
    ['Shape', 'from_points', 'points : FixedArray[Vector2]'],
    ['Path', 'from_points', 'points : FixedArray[Vector2]'],
  ]) {
    get(type).factories = [{name, args, js: `${type}_${name}`}];
  }
  for (const dim of [2, 3]) {
    add(`Curve${dim}`, [
      expr('get_lengths', 'divisions : Int', 'FixedArray[Double]', 'self.getLengths(divisions).slice()'),
      m('get_u_to_t_mapping', 'u : Double', 'Double', 'getUtoTmapping'),
      expr('get_t_at_distance', 'distance : Double', 'Double', 'self.getUtoTmapping(0, distance)'),
      m('clone', '', `Curve${dim}`), m('copy', `source : Curve${dim}`, `Curve${dim}`),
    ]);
    add(`CurvePath${dim}`, [
      expr('get_curve_lengths', '', 'FixedArray[Double]', 'self.getCurveLengths().slice()'),
      nullable('get_point', `t : Double, target : Vector${dim}`, `Vector${dim}`, 'self.getPoint(t, target)'),
      m('clone', '', `CurvePath${dim}`), m('copy', `source : CurvePath${dim}`, `CurvePath${dim}`),
    ]);
    for (const [stem, controls] of [['LineCurve', ['v1', 'v2']], ['QuadraticBezierCurve', ['v0', 'v1', 'v2']], ['CubicBezierCurve', ['v0', 'v1', 'v2', 'v3']]]) {
      const type = stem + (dim === 3 ? '3' : '');
      add(type, [...controls.flatMap(n => rw(n, `Vector${dim}`)), m('clone', '', type), m('copy', `source : ${type}`, type)]);
    }
  }
  add('Curve3', [m('compute_frenet_frames', 'segments : Int, closed : Bool', 'FrenetFrames', 'computeFrenetFrames')]);
  add('Path', [p('current_point', 'Vector2', 'currentPoint'),
    m('set_from_points', 'points : FixedArray[Vector2]', 'Path', 'setFromPoints'), m('spline_thru', 'points : FixedArray[Vector2]', 'Path', 'splineThru'),
    m('arc', 'x : Double, y : Double, radius : Double, start_angle : Double, end_angle : Double, clockwise : Bool', 'Path'),
    m('ellipse', 'x : Double, y : Double, radius_x : Double, radius_y : Double, start_angle : Double, end_angle : Double, clockwise : Bool, rotation : Double', 'Path'),
    m('clone', '', 'Path'), m('copy', 'source : Path', 'Path'),
  ]);
  add('Shape', [p('uuid', 'String'), upcast('curve2', 'Curve2'), upcast('curve_path2', 'CurvePath2'),
    m('extract_points', 'divisions : Int', 'ShapePoints', 'extractPoints'), m('get_points_holes', 'divisions : Int', 'FixedArray[FixedArray[Vector2]]', 'getPointsHoles'),
    m('clone', '', 'Shape'), m('copy', 'source : Shape', 'Shape'),
  ]);
  add('SplineCurve', [expr('points', '', 'FixedArray[Vector2]', 'self.points.slice()'), expr('set_points', 'points : FixedArray[Vector2]', 'Unit', '{ self.points = points.slice(); self.updateArcLengths(); }')]);
  add('EllipseCurve', [...['aX', 'aY', 'xRadius', 'yRadius', 'aStartAngle', 'aEndAngle', 'aRotation'].flatMap(n => rw(snake(n), 'Double', n)), ...rw('clockwise', 'Bool', 'aClockwise')]);
  add('TubeGeometry', ['tangents', 'normals', 'binormals'].map(n => expr(n, '', 'FixedArray[Vector3]', `self.${n}.slice()`)));
  add('ExtrudeGeometry', [m('copy', 'source : ExtrudeGeometry', 'ExtrudeGeometry')]);
  add('Raycaster', [p('ray', 'Ray'), nullable('camera', '', 'Camera', 'self.camera'), optional('camera', 'Camera'),
    ...['Line', 'Points'].flatMap(n => [expr(`${n.toLowerCase()}_threshold`, '', 'Double', `self.params.${n}.threshold`), expr(`set_${n.toLowerCase()}_threshold`, 'threshold : Double', 'Unit', `{ self.params.${n}.threshold = threshold; }`)]),
  ]);
  add('Intersection', [nullable('face', '', 'Face', 'self.face'), nullable('barycoord', '', 'Vector3', 'self.barycoord'), nullable('normal', '', 'Vector3', 'self.normal'), nullable('uv1', '', 'Vector2', 'self.uv1'),
    nullable('index', '', 'Int', 'self.index'), nullable('distance_to_ray', '', 'Double', 'self.distanceToRay'), nullable('point_on_line', '', 'Vector3', 'self.pointOnLine'), nullable('batch_id', '', 'Int', 'self.batchId')]);
}
