import { m, p, rw, expr, nullable, upcast, geometry, cls } from './helpers.mjs';
const addon = (type, args, methods, js = type[0].toLowerCase() + type.slice(1)) => cls(type, args, methods, {factory: {name: type, args, js, module: 'modeling-io'}});
const opaque = (type, methods, extra = {}) => cls(type, '', methods, {factory: null, ...extra});
const checked = (method, error = 'LoadError') => ({...method, throws: error});
const load = result => ({...expr('load', 'url : String', result, 'self.loadAsync(url)'), async: true, throws: 'LoadError', upstream: 'loadAsync'});
export const modelingIO = [
  addon('SVGLoader', '', [upcast('loader', 'Loader'), ...rw('default_dpi', 'Double', 'defaultDPI'), ...rw('default_unit', 'String', 'defaultUnit'),
    checked(expr('parse', 'text : String', 'SVGResult', '{ const result = self.parse(text); if (result.xml.querySelector("parsererror") || result.xml.localName !== "svg") throw new Error("Invalid SVG document"); return result; }')),
    {...load('SVGResult'), expression: 'self.loadAsync(url).then(result => { if (result.xml.querySelector("parsererror") || result.xml.localName !== "svg") throw new Error("Invalid SVG document"); return result; })'},
    {...nullable('points_to_stroke', 'points : FixedArray[Vector2], style : StrokeStyle, arc_divisions : Int, min_distance : Double', 'BufferGeometry', 'self.constructor.pointsToStroke(points, style, arc_divisions, min_distance)'), upstream: 'static pointsToStroke'},
    {...nullable('create_fill_material', 'path : ShapePath', 'MeshBasicMaterial', 'self.constructor.createFillMaterial(path)'), upstream: 'static createFillMaterial'},
    {...nullable('create_stroke_material', 'path : ShapePath', 'MeshBasicMaterial', 'self.constructor.createStrokeMaterial(path)'), upstream: 'static createStrokeMaterial'},
  ]),
  opaque('SVGResult', [expr('paths', '', 'FixedArray[ShapePath]', 'self.paths.slice()'), expr('xml_string', '', 'String', 'new XMLSerializer().serializeToString(self.xml)')]),
  addon('StrokeStyle', 'width : Double, color : String, line_join : StrokeLineJoin, line_cap : StrokeLineCap, miter_limit : Double', [
    ...rw('width', 'Double', 'strokeWidth'), ...rw('color', 'String', 'strokeColor'), ...rw('miter_limit', 'Double', 'strokeMiterLimit'),
  ]),
  addon('FontLoader', '', [upcast('loader', 'Loader'), load('Font'),
    {...checked(expr('parse_json', 'json : Json', 'Font', 'self.parse(JSON.parse(json))')), jsonArgs: ['json'], upstream: 'parse'},
    {...checked(expr('parse_json_string', 'json : String', 'Font', 'self.parse(JSON.parse(json))')), upstream: 'parse'},
  ]),
  opaque('Font', [checked(expr('generate_shapes', 'text : String, size : Double, direction : TextDirection', 'FixedArray[Shape]', 'self.generateShapes(text, size, ["ltr", "rtl", "tb"][direction])'), 'ModelingError'),
    nullable('family_name', '', 'String', 'self.data.familyName'),
  ]),
  addon('TextGeometryOptions', 'font : Font, size : Double, depth : Double', [upcast('extrude_options', 'ExtrudeOptions'), ...rw('font', 'Font'), ...rw('size', 'Double'),
    expr('set_direction', 'direction : TextDirection', 'Unit', '{ self.direction = ["ltr", "rtl", "tb"][direction]; }'),
  ]),
  addon('TextGeometry', 'text : String, options : TextGeometryOptions', [...geometry(), upcast('extrude_geometry', 'ExtrudeGeometry')]),
  addon('MTLLoader', '', [upcast('loader', 'Loader'), load('MTLMaterialCreator'), checked(m('parse', 'text : String, path : String', 'MTLMaterialCreator')),
    m('set_material_options', 'options : MTLMaterialOptions', 'Unit', 'setMaterialOptions'),
  ]),
  addon('MTLMaterialOptions', '', [...rw('side', 'Side'), ...rw('wrap', 'Wrapping'), ...rw('normalize_rgb', 'Bool', 'normalizeRGB'), ...rw('ignore_zero_rgbs', 'Bool', 'ignoreZeroRGBs'), ...rw('invert_tr', 'Bool', 'invertTrProperty')]),
  opaque('MTLMaterialCreator', [checked(m('preload')), checked(m('create', 'name : String', 'Material')),
    checked(m('materials', '', 'FixedArray[Material]', 'getAsArray')), m('set_cross_origin', 'value : String', 'MTLMaterialCreator', 'setCrossOrigin'), m('set_manager', 'manager : LoadingManager', 'Unit', 'setManager'),
  ], {facadeFor: 'MaterialCreator'}),
  addon('PLYLoader', '', [upcast('loader', 'Loader'), load('BufferGeometry'),
    checked(expr('parse', 'data : Bytes', 'BufferGeometry', 'self.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))')),
    checked(m('parse_ascii', 'text : String', 'BufferGeometry', 'parse')),
    m('set_property_name_mapping', 'mapping : PLYPropertyNames', 'Unit', 'setPropertyNameMapping'),
    m('set_custom_property_name_mapping', 'mapping : PLYCustomProperties', 'Unit', 'setCustomPropertyNameMapping'),
  ]),
  addon('PLYPropertyNames', '', [expr('set', 'source : String, target : String', 'Unit', '{ self[source] = target; }')]),
  addon('PLYCustomProperties', '', [expr('set', 'attribute : String, properties : FixedArray[String]', 'Unit', '{ self[attribute] = properties.slice(); }')]),
  addon('PLYExportOptions', '', [...rw('little_endian', 'Bool', 'littleEndian'), expr('set_exclude_attributes', 'names : FixedArray[String]', 'Unit', '{ self.excludeAttributes = names.slice(); }'),
    p('custom_properties', 'PLYCustomProperties', 'customPropertyMapping'),
  ]),
  addon('PLYExporter', '', [
    checked(expr('export_ascii', 'root : Object3D, options : PLYExportOptions', 'String', '{ const result = self.parse(root, undefined, {...options, binary: false}); if (typeof result !== "string") throw new Error("PLY export failed"); return result; }'), 'ExportError'),
    checked(expr('export_binary', 'root : Object3D, options : PLYExportOptions', 'Bytes', '{ const result = self.parse(root, undefined, {...options, binary: true}); if (!(result instanceof ArrayBuffer)) throw new Error("PLY export failed"); return new Uint8Array(result); }'), 'ExportError'),
  ]),
];
export function extendModelingIO(bindings) {
  bindings.find(b => b.type === 'OBJLoader').methods.push(m('set_materials', 'materials : MTLMaterialCreator', 'OBJLoader', 'setMaterials'));
  bindings.find(b => b.type === 'Material').methods.push(nullable('as_phong_material', '', 'MeshPhongMaterial', 'self.isMeshPhongMaterial === true ? self : null'));
}
