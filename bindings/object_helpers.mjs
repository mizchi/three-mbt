import { m, p, rw, expr, nullable, upcast, node, geometry, material, cls } from './helpers.mjs';
const addon = (type,args,methods) => cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'objects'}});
export const objectHelpers = [
  ...['BatchedGeometryId','BatchedInstanceId'].map(type=>cls(type,'',[],{factory:null})),
  cls('BatchedMesh','max_instances : Int, max_vertices : Int, max_indices : Int, material : Material',[
    ...node(),upcast('mesh','Mesh'),p('instance_count','Int','instanceCount'),p('max_instance_count','Int','maxInstanceCount'),p('unused_vertex_count','Int','unusedVertexCount'),p('unused_index_count','Int','unusedIndexCount'),
    ...rw('per_object_frustum_culled','Bool','perObjectFrustumCulled'),...rw('sort_objects','Bool','sortObjects'),
    m('add_geometry','geometry : BufferGeometry','BatchedGeometryId','addGeometry'),m('add_instance','geometry : BatchedGeometryId','BatchedInstanceId','addInstance'),
    m('delete_geometry','geometry : BatchedGeometryId','BatchedMesh','deleteGeometry'),m('delete_instance','instance : BatchedInstanceId','BatchedMesh','deleteInstance'),
    m('set_matrix_at','instance : BatchedInstanceId, matrix : Matrix4','BatchedMesh','setMatrixAt'),m('get_matrix_at','instance : BatchedInstanceId, target : Matrix4','Matrix4','getMatrixAt'),
    m('set_color_at','instance : BatchedInstanceId, color : Color','BatchedMesh','setColorAt'),m('get_color_at','instance : BatchedInstanceId, target : Color','Color','getColorAt'),
    m('set_rgba_at','instance : BatchedInstanceId, color : Vector4','BatchedMesh','setColorAt'),m('get_rgba_at','instance : BatchedInstanceId, target : Vector4','Vector4','getColorAt'),
    m('set_visible_at','instance : BatchedInstanceId, visible : Bool','BatchedMesh','setVisibleAt'),m('get_visible_at','instance : BatchedInstanceId','Bool','getVisibleAt'),
    m('set_geometry_id_at','instance : BatchedInstanceId, geometry : BatchedGeometryId','BatchedMesh','setGeometryIdAt'),m('get_geometry_id_at','instance : BatchedInstanceId','BatchedGeometryId','getGeometryIdAt'),
    m('optimize','','BatchedMesh'),m('compute_bounding_box','','Unit','computeBoundingBox'),m('compute_bounding_sphere','','Unit','computeBoundingSphere'),m('dispose'),
  ]),
  addon('LineGeometry','',[...geometry(),m('set_positions','positions : FixedArray[Double]','LineGeometry','setPositions'),m('set_colors','colors : FixedArray[Double]','LineGeometry','setColors')]),
  addon('LineMaterial','color : Int, linewidth : Double',[...material(),upcast('shader_material','ShaderMaterial'),p('color','Color'),p('resolution','Vector2'),...rw('linewidth','Double'),...rw('world_units','Bool','worldUnits'),...rw('dashed','Bool'),...rw('dash_scale','Double','dashScale'),...rw('dash_size','Double','dashSize'),...rw('gap_size','Double','gapSize'),...rw('dash_offset','Double','dashOffset')]),
  addon('Line2','geometry : LineGeometry, material : LineMaterial',[...node(),m('compute_line_distances','','Line2','computeLineDistances')]),
  cls('CubeCamera','near : Double, far : Double, target : WebGLCubeRenderTarget',[...node(),m('update','renderer : WebGLRenderer, scene : Scene')]),
  cls('RectAreaLight','color : Int, intensity : Double, width : Double, height : Double',[...node(),upcast('light','Light'),...rw('width','Double'),...rw('height','Double')]),
  cls('ArrowHelper','direction : Vector3, origin : Vector3, length : Double, color : Int',[...node(),m('set_direction','direction : Vector3','Unit','setDirection'),m('set_length','length : Double, head_length : Double, head_width : Double','Unit','setLength'),m('set_color','color : Color','Unit','setColor'),m('dispose')]),
  cls('SkeletonHelper','root : Object3D',[...node(),p('geometry','BufferGeometry'),m('set_colors','start : Color, end : Color','Unit','setColors'),m('dispose')]),
  cls('Box3Helper','box : Box3, color : Int',[...node(),m('dispose')]),
  cls('PlaneHelper','plane : Plane, size : Double, color : Int',[...node(),m('dispose')]),
  ...[
    ['DirectionalLightHelper','light : DirectionalLight, size : Double'],
    ['PointLightHelper','light : PointLight, size : Double'],
    ['SpotLightHelper','light : SpotLight'],
    ['HemisphereLightHelper','light : HemisphereLight, size : Double'],
  ].map(([type,args])=>cls(type,args,[...node(),m('update'),m('dispose')])),
];
export function extendObjects(bindings) {
  const add=(type,methods)=>bindings.find(b=>b.type===type).methods.push(...methods);
  add('Object3D',[nullable('as_batched_mesh','','BatchedMesh','self.isBatchedMesh ? self : null')]);
  add('InstancedMesh',[m('get_color_at','index : Int, target : Color','Unit','getColorAt'),m('set_morph_at','index : Int, mesh : Mesh','Unit','setMorphAt'),m('get_morph_at','index : Int, mesh : Mesh','Unit','getMorphAt')]);
  add('Intersection',[nullable('batch_id','','BatchedInstanceId','self.batchId')]);
  add('Scene',[
    ...['background_blurriness','background_intensity','environment_intensity'].flatMap(n=>rw(n,'Double',n.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()))),
    p('background_rotation','Euler','backgroundRotation'),p('environment_rotation','Euler','environmentRotation'),
  ]);
}
