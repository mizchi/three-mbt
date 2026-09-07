import { m, p, rw, expr, nullable, optional, cls } from './helpers.mjs';
const addon = (type,args,methods) => cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'modeling-workflow'}});
const checked = method => ({...method,throws:'ModelingError'});
const snake = name => name.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
const jsonMethods = type => [
  {name:'to_json',returns:'Json',expression:'JSON.stringify(self.toJSON())',throws:'SerializationError',jsonResult:true,upstream:'toJSON'},
  {name:'to_json_string',returns:'String',expression:'JSON.stringify(self.toJSON())',throws:'SerializationError',upstream:'toJSON'},
  {name:'from_json',args:'json : Json',returns:type,expression:'{ self.fromJSON(JSON.parse(json)); self.updateArcLengths(); return self; }',throws:'SerializationError',jsonArgs:['json'],upstream:'fromJSON'},
  {name:'from_json_string',args:'text : String',returns:type,expression:'{ self.fromJSON(JSON.parse(text)); self.updateArcLengths(); return self; }',throws:'SerializationError',upstream:'fromJSON'},
];
export const modelingWorkflow = [
  addon('OBB','center : Vector3, half_size : Vector3, rotation : Matrix3',[
    p('center','Vector3'),p('half_size','Vector3','halfSize'),p('rotation','Matrix3'),
    m('set','center : Vector3, half_size : Vector3, rotation : Matrix3','OBB'),m('copy','other : OBB','OBB'),m('clone','','OBB'),m('equals','other : OBB','Bool'),
    m('get_size','target : Vector3','Vector3','getSize'),m('clamp_point','point : Vector3, target : Vector3','Vector3','clampPoint'),m('contains_point','point : Vector3','Bool','containsPoint'),
    m('intersects_box3','box : Box3','Bool','intersectsBox3'),m('intersects_sphere','sphere : Sphere','Bool','intersectsSphere'),m('intersects_obb','other : OBB, epsilon : Double','Bool','intersectsOBB'),m('intersects_plane','plane : Plane','Bool','intersectsPlane'),
    nullable('intersect_ray','ray : Ray, target : Vector3','Vector3','self.intersectRay(ray,target)'),m('intersects_ray','ray : Ray','Bool','intersectsRay'),
    m('from_box3','box : Box3','OBB','fromBox3'),m('apply_matrix4','matrix : Matrix4','OBB','applyMatrix4'),
  ]),
  addon('Capsule','start : Vector3, end : Vector3, radius : Double',[
    p('start','Vector3'),p('end','Vector3'),...rw('radius','Double'),m('set','start : Vector3, end : Vector3, radius : Double','Capsule'),m('clone','','Capsule'),m('copy','other : Capsule','Capsule'),
    m('get_center','target : Vector3','Vector3','getCenter'),m('translate','offset : Vector3','Capsule'),m('intersects_box','box : Box3','Bool','intersectsBox'),
  ]),
  addon('Octree','',[
    p('layers','Layers'),...rw('triangles_per_leaf','Int','trianglesPerLeaf'),...rw('max_level','Int','maxLevel'),
    m('add_triangle','triangle : Triangle','Octree','addTriangle'),m('build','','Octree'),m('from_graph_node','root : Object3D','Octree','fromGraphNode'),m('clear','','Octree'),
    nullable('box','','Box3','self.box'),
    ...[['sphere','Sphere'],['capsule','Capsule'],['box','Box3']].map(([name,type])=>nullable(`${name}_intersect`, `shape : ${type}`,'OctreeIntersection',`self.${name}Intersect(shape) || null`)),
    nullable('ray_intersect','ray : Ray','OctreeRayIntersection','self.rayIntersect(ray) || null'),
  ]),
  cls('OctreeIntersection','',[p('normal','Vector3'),p('depth','Double')],{factory:null}),
  cls('OctreeRayIntersection','',[p('position','Vector3'),p('distance','Double'),p('triangle','Triangle')],{factory:null}),
  addon('MeshSurfaceSampler','mesh : Mesh',[
    {name:'set_weight_attribute',option:'String',expression:'{ self.setWeightAttribute(value); self.distribution = null; }'},
    checked(expr('build','','MeshSurfaceSampler','{ const weights = self.weightAttribute; if (weights) for(let i=0;i<weights.count;i++) if(!Number.isFinite(weights.getX(i)) || weights.getX(i)<0) throw new RangeError("Nonnegative finite sampling weights required"); self.build(); const d = self.distribution; if (!d.length || !(d[d.length-1]>0) || !Number.isFinite(d[d.length-1])) throw new RangeError("Positive total surface area and weight required"); return self; }')),
    m('set_random_generator','random : () -> Double','MeshSurfaceSampler','setRandomGenerator'),
    checked(expr('sample','position : Vector3','MeshSurfaceSampler','{ if (!self.distribution || !(self.distribution.at(-1)>0)) throw new Error("Build the sampler before sampling"); return self.sample(position); }')),
    checked(expr('sample_full','position : Vector3, normal : Vector3, color : Color, uv : Vector2','MeshSurfaceSampler','{ if (!self.distribution || !(self.distribution.at(-1)>0)) throw new Error("Build the sampler before sampling"); return self.sample(position,normal,color,uv); }')),
  ]),
  cls('BatchedGeometryRange','',['vertexStart','vertexCount','reservedVertexCount','indexStart','indexCount','reservedIndexCount','start','count'].map(key=>p(snake(key),'Int',key)),{factory:null}),
];
export function extendModelingWorkflow(bindings) {
  const add = (type,methods) => { const b=bindings.find(b=>b.type===type); b.methods.push(...methods.filter(m=>!b.methods.some(old=>old.name===m.name))); };
  add('Texture', [...rw('channel','Int'),p('matrix','Matrix3'),...rw('matrix_auto_update','Bool','matrixAutoUpdate'),m('transform_uv','uv : Vector2','Vector2','transformUv'),m('copy','source : Texture','Texture')]);
  for(const type of ['Curve2','Curve3','CurvePath2','CurvePath3','Path','Shape','NURBSCurve']) add(type,jsonMethods(type));
  for(const type of ['BoxGeometry','PlaneGeometry','SphereGeometry','CylinderGeometry','ConeGeometry','CapsuleGeometry','CircleGeometry','RingGeometry','TorusGeometry','TorusKnotGeometry','LatheGeometry','TubeGeometry','ShapeGeometry','ExtrudeGeometry','TextGeometry','ParametricGeometry']) add(type,[
    {name:'parameters_json',returns:'Json',expression:'JSON.stringify(self.parameters)',throws:'SerializationError',jsonResult:true,upstream:'parameters'},
  ]);
  add('BatchedMesh',[
    checked(m('set_geometry_at','id : BatchedGeometryId, geometry : BufferGeometry','BatchedGeometryId','setGeometryAt')),
    checked(m('set_geometry_size','max_vertices : Int, max_indices : Int','Unit','setGeometrySize')),
    checked(m('set_instance_count','max_instances : Int','Unit','setInstanceCount')),
    nullable('get_geometry_range_at','id : BatchedGeometryId','BatchedGeometryRange','{ try { return self.getGeometryRangeAt(id); } catch { return null; } }'),
    nullable('get_bounding_box_at','id : BatchedGeometryId, target : Box3','Box3','{ try { self.getGeometryRangeAt(id); } catch { return null; } return self.getBoundingBoxAt(id,target); }'),
    nullable('get_bounding_sphere_at','id : BatchedGeometryId, target : Sphere','Sphere','{ try { self.getGeometryRangeAt(id); } catch { return null; } return self.getBoundingSphereAt(id,target); }'),
    nullable('bounding_box','','Box3','self.boundingBox'),nullable('bounding_sphere','','Sphere','self.boundingSphere'),
  ]);
  add('OrbitControls',[
    p('cursor','Vector3'),...rw('min_target_radius','Double','minTargetRadius'),...rw('max_target_radius','Double','maxTargetRadius'),...rw('key_pan_speed','Double','keyPanSpeed'),...rw('key_rotate_speed','Double','keyRotateSpeed'),
    expr('set_keys','left : String, up : String, right : String, down : String','Unit','{ self.keys = {LEFT:left, UP:up, RIGHT:right, BOTTOM:down}; }'),
    expr('set_mouse_buttons','left : MouseAction, middle : MouseAction, right : MouseAction','Unit','{ const action = n => n === 3 ? null : n; self.mouseButtons = {LEFT:action(left), MIDDLE:action(middle), RIGHT:action(right)}; }'),
    expr('set_touches','one : TouchAction, two : TouchAction','Unit','{ const action = n => n === 4 ? null : n; self.touches = {ONE:action(one), TWO:action(two)}; }'),
    expr('listen_to_key_events','','Unit','self.listenToKeyEvents(window)'),m('stop_listen_to_key_events','','Unit','stopListenToKeyEvents'),
    expr('set_cursor_style','style : OrbitCursorStyle','Unit','{ self.cursorStyle = ["auto","grab"][style]; }'),
    m('pan','x : Double, y : Double','Unit'),m('dolly_in','scale : Double','Unit','dollyIn'),m('dolly_out','scale : Double','Unit','dollyOut'),m('rotate_left','angle : Double','Unit','rotateLeft'),m('rotate_up','angle : Double','Unit','rotateUp'),
  ]);
}
