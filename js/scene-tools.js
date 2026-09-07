import {Group,Mesh,Color,BufferGeometry} from 'three';
import * as SceneUtils from 'three/addons/utils/SceneUtils.js';
import {UVsDebug} from 'three/addons/utils/UVsDebug.js';
import {batchInstanceIds,batchGeometry,meshesFromBatch} from './batch-expand.js';

function meshesFromInstances(source) {
 const group=new Group().copy(source,false);
 for(let i=0;i<source.count;i++) {
  let material=source.material;
  if(source.instanceColor) {
   const color=new Color();source.getColorAt(i,color);
   const tint=m=>{const copy=m.clone();if(!copy.color)throw new TypeError('Instance colors require a color-based material');copy.color.multiply(color);return copy;};
   material=Array.isArray(material)?material.map(tint):tint(material);
  }
  const mesh=new Mesh(source.geometry,material);
  source.getMatrixAt(i,mesh.matrix);
  mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);
  mesh.matrixAutoUpdate=false;
  if(source.morphTexture)source.getMorphAt(i,mesh);
  group.add(mesh);
 }
 group.updateMatrixWorld(true);
 return group;
}

function meshesFromMaterials(source) {
 if(source.isSkinnedMesh||source.isInstancedMesh||source.isBatchedMesh)throw new TypeError('Bake or expand dynamic meshes first');
 const group=new Group().copy(source,false),input=source.geometry;
 const count=input.index?.count??input.getAttribute('position')?.count??0;
 const ranges=Array.isArray(source.material)?input.groups:[{start:0,count,materialIndex:0}];
 for(const range of ranges) {
  const start=Math.max(range.start,input.drawRange.start),end=Math.min(count,range.start+range.count,input.drawRange.start+input.drawRange.count);
  if(end<=start)continue;
  if(start%3||(end-start)%3)throw new TypeError('Triangle-aligned geometry groups required');
  const material=Array.isArray(source.material)?source.material[range.materialIndex]:source.material;
  if(!material)throw new TypeError('Missing group material');
  const geometry=new BufferGeometry().copy(input);
  geometry.clearGroups();geometry.setDrawRange(0,Infinity);
  geometry.setIndex(Array.from({length:end-start},(_,i)=>input.index?input.index.getX(start+i):start+i));
  const mesh=new Mesh(geometry,material);
  if(source.morphTargetInfluences)mesh.morphTargetInfluences=source.morphTargetInfluences.slice();
  group.add(mesh);
 }
 group.updateMatrixWorld(true);
 return group;
}
export const sceneUtils=()=>({
 batchInstanceIds,batchGeometry,meshesFromBatch,
 meshesFromInstances,meshesFromMaterials,
 createMultiMaterialObject:SceneUtils.createMultiMaterialObject,
 sortInstancedMesh:SceneUtils.sortInstancedMesh,
 uvDebug:UVsDebug,
});
