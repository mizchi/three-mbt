import {BufferGeometry,BufferAttribute,Group,Mesh,Vector4,Color} from 'three';

export function batchInstanceIds(batch) {
  const ids=[];
  for(let i=0;i<batch.maxInstanceCount && ids.length<batch.instanceCount;i++) {
    try { batch.getGeometryIdAt(i);ids.push(i); }
    catch { /* Deleted and never-allocated IDs are holes in the public ID space. */ }
  }
  return ids;
}

export function batchGeometry(batch,id) {
  const range=batch.getGeometryRangeAt(id),source=batch.geometry;
  const result=new BufferGeometry();
  for(const [name,attribute] of Object.entries(source.attributes)) {
    if(attribute.isInterleavedBufferAttribute)throw new TypeError('Packed batch storage required');
    const begin=range.vertexStart*attribute.itemSize,end=begin+range.vertexCount*attribute.itemSize;
    const copy=new BufferAttribute(attribute.array.slice(begin,end),attribute.itemSize,attribute.normalized);
    copy.name=attribute.name;copy.gpuType=attribute.gpuType;
    result.setAttribute(name,copy);
  }
  if(source.index) {
    const indices=Array.from({length:range.indexCount},(_,i)=>source.index.getX(range.indexStart+i)-range.vertexStart);
    if(indices.some(index=>index<0||index>=range.vertexCount))throw new RangeError('Batch index refers outside its geometry range');
    result.setIndex(indices);
  }
  result.computeBoundingBox();result.computeBoundingSphere();
  return result;
}

export function meshesFromBatch(batch,onlyVisible) {
  if(Array.isArray(batch.material))throw new TypeError('A single batch material is required');
  const group=new Group().copy(batch,false);
  const geometries=[],materials=[];
  try {
    for(const id of batchInstanceIds(batch)) {
      const visible=batch.getVisibleAt(id);
      if(onlyVisible&&!visible)continue;
      const geometry=batchGeometry(batch,batch.getGeometryIdAt(id));geometries.push(geometry);
      const material=batch.material.clone();materials.push(material);
      const tint=batch.getColorAt(id,new Vector4());
      if(material.color)material.color.multiply(new Color(tint.x,tint.y,tint.z));
      else if(tint.x!==1||tint.y!==1||tint.z!==1)throw new TypeError('Instance tint requires a color-based material');
      material.opacity*=tint.w;
      const mesh=new Mesh(geometry,material);
      mesh.visible=visible;mesh.castShadow=batch.castShadow;mesh.receiveShadow=batch.receiveShadow;
      mesh.layers.mask=batch.layers.mask;mesh.renderOrder=batch.renderOrder;mesh.frustumCulled=batch.frustumCulled;
      batch.getMatrixAt(id,mesh.matrix);
      mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.matrixAutoUpdate=false;
      group.add(mesh);
    }
    group.updateMatrixWorld(true);
    return group;
  } catch(error) {
    for(const geometry of geometries)geometry.dispose();
    for(const material of materials)material.dispose();
    throw error;
  }
}
