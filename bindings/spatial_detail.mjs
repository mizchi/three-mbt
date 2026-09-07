import {m,p,expr,nullable,cls} from './helpers.mjs';
export const spatialDetail=[
 cls('ConvexHull','',[
  {...expr('set_from_points','points : FixedArray[Vector3]','ConvexHull','{ if(points.length<4)throw new RangeError("At least four points required"); return self.setFromPoints(points); }'),throws:'ModelingError'},
  {...m('set_from_object','object : Object3D','ConvexHull','setFromObject'),throws:'ModelingError'},
  m('contains_point','point : Vector3','Bool','containsPoint'),m('intersects_ray','ray : Ray','Bool','intersectsRay'),nullable('intersect_ray','ray : Ray, target : Vector3','Vector3','self.intersectRay(ray,target)'),
  expr('faces','','FixedArray[HullFace]','self.faces.slice()'),p('tolerance','Double'),m('make_empty','','ConvexHull','makeEmpty'),
 ],{factory:{name:'ConvexHull',args:'',js:'convexHull',module:'spatial-detail'}}),
 cls('HullFace','',[p('normal','Vector3'),p('midpoint','Vector3'),p('area','Double'),p('constant','Double'),
  expr('vertices','','FixedArray[Vector3]','[0,1,2].map(i=>self.getEdge(i).head().point)'),m('distance_to_point','point : Vector3','Double','distanceToPoint'),
 ],{factory:null}),
 cls('OctreeTriangleIntersection','',[p('normal','Vector3'),p('point','Vector3'),p('depth','Double')],{factory:null}),
];
export function extendSpatialDetail(bindings) {
 bindings.find(b=>b.type==='Octree').methods.push(
  p('bounds','Box3'),expr('triangles','','FixedArray[Triangle]','self.triangles.slice()'),expr('sub_trees','','FixedArray[Octree]','self.subTrees.slice()'),
  expr('ray_triangles','ray : Ray','FixedArray[Triangle]','{ const result=[]; self.getRayTriangles(ray,result); return result; }'),
  ...[['sphere','Sphere'],['box','Box3'],['capsule','Capsule']].flatMap(([name,type])=>[
   expr(`${name}_triangles`,`shape : ${type}`,'FixedArray[Triangle]',`{ const result=[]; self.get${type==='Box3'?'Box':type}Triangles(shape,result); return result; }`),
   nullable(`triangle_${name}_intersect`,`shape : ${type}, triangle : Triangle`,'OctreeTriangleIntersection',`self.triangle${type==='Box3'?'Box':type}Intersect(shape,triangle) || null`),
  ]),
 );
}
