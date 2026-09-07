import { m, p, rw, expr, nullable, upcast, geometry, cls } from './helpers.mjs';
const custom = (type, args, methods) => cls(type, args, methods, { factory: { name: type, args, js: type[0].toLowerCase() + type.slice(1), module: 'geometry' } });
const curve = dim => [
  m('get_point', `t : Double, target : Vector${dim}`, `Vector${dim}`, 'getPoint'),
  m('get_point_at', `u : Double, target : Vector${dim}`, `Vector${dim}`, 'getPointAt'),
  m('get_tangent', `t : Double, target : Vector${dim}`, `Vector${dim}`, 'getTangent'),
  m('get_tangent_at', `u : Double, target : Vector${dim}`, `Vector${dim}`, 'getTangentAt'),
  m('get_points', 'divisions : Int', `FixedArray[Vector${dim}]`, 'getPoints'),
  m('get_spaced_points', 'divisions : Int', `FixedArray[Vector${dim}]`, 'getSpacedPoints'),
  m('get_length', '', 'Double', 'getLength'), m('update_arc_lengths', '', 'Unit', 'updateArcLengths'), ...rw('arc_length_divisions', 'Int', 'arcLengthDivisions'),
];
export const curves = [
  ...[2, 3].map(dim => cls(`Curve${dim}`, '', curve(dim), { factory: null })),
  ...[2, 3].flatMap(dim => [
    cls(`LineCurve${dim === 2 ? '' : '3'}`, `start : Vector${dim}, end : Vector${dim}`, [upcast(`curve${dim}`, `Curve${dim}`)]),
    cls(`QuadraticBezierCurve${dim === 2 ? '' : '3'}`, `start : Vector${dim}, control : Vector${dim}, end : Vector${dim}`, [upcast(`curve${dim}`, `Curve${dim}`)]),
    cls(`CubicBezierCurve${dim === 2 ? '' : '3'}`, `start : Vector${dim}, control1 : Vector${dim}, control2 : Vector${dim}, end : Vector${dim}`, [upcast(`curve${dim}`, `Curve${dim}`)]),
    custom(`CurvePath${dim}`, '', [upcast(`curve${dim}`, `Curve${dim}`), m('add', `curve : Curve${dim}`), m('close_path', '', `CurvePath${dim}`, 'closePath'), expr('curves', '', `FixedArray[Curve${dim}]`, 'self.curves.slice()'), ...rw('auto_close', 'Bool', 'autoClose')]),
  ]),
  custom('CatmullRomCurve3', 'points : FixedArray[Vector3], closed : Bool, curve_type : CatmullRomType, tension : Double', [upcast('curve3', 'Curve3'), ...rw('closed', 'Bool'), ...rw('tension', 'Double'), expr('points', '', 'FixedArray[Vector3]', 'self.points.slice()'), expr('set_points', 'points : FixedArray[Vector3]', 'Unit', '{ self.points = points.slice(); self.updateArcLengths(); }')]),
  cls('SplineCurve', 'points : FixedArray[Vector2]', [upcast('curve2', 'Curve2')]),
  cls('EllipseCurve', 'x : Double, y : Double, radius_x : Double, radius_y : Double, start_angle : Double, end_angle : Double, clockwise : Bool, rotation : Double', [upcast('curve2', 'Curve2')]),
  cls('Path', '', [upcast('curve2', 'Curve2'), upcast('curve_path2', 'CurvePath2'),
    m('move_to', 'x : Double, y : Double', 'Path', 'moveTo'), m('line_to', 'x : Double, y : Double', 'Path', 'lineTo'),
    m('quadratic_curve_to', 'cx : Double, cy : Double, x : Double, y : Double', 'Path', 'quadraticCurveTo'),
    m('bezier_curve_to', 'cx1 : Double, cy1 : Double, cx2 : Double, cy2 : Double, x : Double, y : Double', 'Path', 'bezierCurveTo'),
    m('absarc', 'x : Double, y : Double, radius : Double, start_angle : Double, end_angle : Double, clockwise : Bool', 'Path'),
    m('absellipse', 'x : Double, y : Double, radius_x : Double, radius_y : Double, start_angle : Double, end_angle : Double, clockwise : Bool, rotation : Double', 'Path'),
    m('close_path', '', 'Path', 'closePath'),
  ]),
  cls('Shape', '', [upcast('path', 'Path'), expr('holes', '', 'FixedArray[Path]', 'self.holes.slice()'), expr('set_holes', 'holes : FixedArray[Path]', 'Unit', '{ self.holes = holes.slice(); }')]),
  cls('ShapeGeometry', 'shapes : FixedArray[Shape], curve_segments : Int', geometry()),
  cls('TubeGeometry', 'path : Curve3, tubular_segments : Int, radius : Double, radial_segments : Int, closed : Bool', geometry()),
  cls('LatheGeometry', 'points : FixedArray[Vector2], segments : Int, phi_start : Double, phi_length : Double', geometry()),
  cls('ExtrudeGeometry', 'shapes : FixedArray[Shape], options : ExtrudeOptions', geometry()),
  custom('ExtrudeOptions', '', [
    ...['depth', 'bevel_thickness', 'bevel_size', 'bevel_offset'].flatMap(n => rw(n, 'Double', n.replace(/_([a-z])/g, (_, c) => c.toUpperCase()))),
    ...['steps', 'bevel_segments', 'curve_segments'].flatMap(n => rw(n, 'Int', n.replace(/_([a-z])/g, (_, c) => c.toUpperCase()))),
    ...rw('bevel_enabled', 'Bool', 'bevelEnabled'), nullable('extrude_path', '', 'Curve3', 'self.extrudePath'),
    { name: 'set_extrude_path', option: 'Curve3', expression: '{ if (value == null) delete self.extrudePath; else self.extrudePath = value; }' },
  ]),
];
