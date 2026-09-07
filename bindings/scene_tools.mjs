import {m,p,expr,nullable,cls} from './helpers.mjs';
export const sceneTools=[
 cls('SceneUtils','',[
  m('batch_instance_ids','batch : BatchedMesh','FixedArray[BatchedInstanceId]','batchInstanceIds'),
  {...m('batch_geometry','batch : BatchedMesh, id : BatchedGeometryId','BufferGeometry','batchGeometry'),throws:'ModelingError'},
  {...m('meshes_from_batch','batch : BatchedMesh, only_visible : Bool','Group','meshesFromBatch'),throws:'ModelingError'},
  {...m('meshes_from_instances','mesh : InstancedMesh','Group','meshesFromInstances'),throws:'ModelingError',upstream:'createMeshesFromInstancedMesh'},
  {...m('meshes_from_materials','mesh : Mesh','Group','meshesFromMaterials'),throws:'ModelingError',upstream:'createMeshesFromMultiMaterialMesh'},
  m('multi_material_object','geometry : BufferGeometry, materials : FixedArray[Material]','Group','createMultiMaterialObject'),
  m('sort_instances','mesh : InstancedMesh, compare : (Int, Int) -> Int','Unit','sortInstancedMesh'),
  {...m('uv_debug','geometry : BufferGeometry, size : Int','Canvas','uvDebug'),throws:'ModelingError'},
 ],{factory:{name:'SceneUtils',args:'',js:'sceneUtils',module:'scene-tools'}}),
];
export function extendSceneTools(bindings) {
 bindings.find(b=>b.type==='Object3D').methods.push(nullable('as_points','','Points','self.isPoints?self:null'));
 bindings.find(b=>b.type==='Points').methods.push(p('geometry','BufferGeometry'),p('material','Material'));
 const triangle=bindings.find(b=>b.type==='Triangle');
 for(const size of [2,3,4]) {
  const type='Vector'+size;
  triangle.methods.push(nullable('interpolate_vector'+size,`point : Vector3, a : ${type}, b : ${type}, c : ${type}, target : ${type}`,type,'self.getInterpolation(point,a,b,c,target)'));
  triangle.methods.push({...m('interpolate_attribute'+size,`attribute : BufferAttribute, a : Int, b : Int, c : Int, barycentric : Vector3, target : ${type}`,type,'getInterpolatedAttribute'),static:true});
 }
}
