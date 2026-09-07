import {BufferGeometry,Float32BufferAttribute,Mesh} from 'three';
import {buildTopologyGraph} from './topology-graph.js';
import {GeometryWriter,validateMesh} from './topology-edit.js';

function prepareGeometry(source,tolerance) {
  if(source.isInstancedBufferGeometry)throw new TypeError('Expand instanced geometry before CSG');
  if(source.hasAttribute('skinIndex')||source.hasAttribute('skinWeight')||Object.values(source.morphAttributes).some(a=>a.length))throw new TypeError('Bake skinning and morph attributes before CSG');
  const geometry=new BufferGeometry().copy(source);
  try {
    const welded=buildTopologyGraph(geometry,tolerance);
    const positions=new Float32BufferAttribute(geometry.getAttribute('position').count*3,3);
    welded.sources.forEach((indices,vertex)=>{
      const p=welded.positions[vertex];
      for(const index of indices)positions.setXYZ(index,p.x,p.y,p.z);
    });
    geometry.setAttribute('position',positions);
    const graph=buildTopologyGraph(geometry,0);
    validateMesh(geometry,graph);
    if(graph.edges.some(edge=>edge.faces.length!==2))throw new RangeError('CSG requires closed solids; adjust weld tolerance for render seams');
    const writer=new GeometryWriter(geometry,graph);
    const attributes=[...writer.attributes].filter(([name])=>name!=='position').sort(([a],[b])=>a.localeCompare(b));
    const schema=[{name:'position',size:3,offset:0}];let numProp=3;
    for(const [name,{attribute}] of attributes){schema.push({name,size:attribute.itemSize,offset:numProp});numProp+=attribute.itemSize;}
    return {geometry,graph,materials:writer.materials,schema,numProp};
  } catch(error){geometry.dispose();throw error;}
}

function toSolid(wasm,input,offset,materials,owned) {
  const {geometry,graph,schema,numProp}=input,count=geometry.getAttribute('position').count;
  const properties=new Float32Array(count*numProp);
  for(let i=0;i<count;i++)for(const {name,size,offset} of schema) {
    const attribute=geometry.getAttribute(name);
    for(let c=0;c<size;c++)properties[i*numProp+offset+c]=attribute[['getX','getY','getZ','getW'][c]](i);
  }
  if(!properties.every(Number.isFinite))throw new RangeError('Finite Float32 CSG attributes required');
  const indices=geometry.index?Uint32Array.from(geometry.index.array):Uint32Array.from({length:count},(_,i)=>i);
  const from=[],to=[];
  for(const sources of graph.sources)for(let i=1;i<sources.length;i++){from.push(sources[i]);to.push(sources[0]);}
  const runs=[];
  input.materials.forEach((material,face)=>{
    if(runs.at(-1)?.material!==material)runs.push({start:face*3,material});
  });
  const firstID=runs.length?wasm.Manifold.reserveIDs(runs.length):0;
  const runIndex=runs.map(r=>r.start),runOriginalID=runs.map((r,i)=>{
    const id=firstID+i,value=r.material+offset;
    if(!Number.isSafeInteger(value)||value>2147483647)throw new RangeError('CSG material index exceeds MoonBit Int range');
    materials.set(id,value);return id;
  });
  runIndex.push(indices.length);
  const mesh=new wasm.Mesh({numProp,vertProperties:properties,triVerts:indices,
    mergeFromVert:Uint32Array.from(from),mergeToVert:Uint32Array.from(to),
    runIndex:Uint32Array.from(runIndex),runOriginalID:Uint32Array.from(runOriginalID)});
  const solid=new wasm.Manifold(mesh);owned.push(solid);
  if(solid.status()!=='NoError')throw new RangeError('Invalid CSG solid: '+solid.status());
  if(!solid.isEmpty()&&!(solid.volume()>0))throw new RangeError('CSG requires outward-oriented solids with positive volume');
  return solid;
}

function fromSolid(solid,schema,materials) {
  if(solid.status()!=='NoError')throw new RangeError('CSG operation failed: '+solid.status());
  const mesh=solid.getMesh(),values=schema.map(()=>[]),indices=[],groups=[];
  // Keep material runs separate when recomputing normals at newly cut boundaries.
  for(let run=0;run<mesh.runOriginalID.length;run++) {
    const material=materials.get(mesh.runOriginalID[run]);
    if(material===undefined)throw new Error('CSG output has unknown material provenance');
    const vertices=new Map(),start=indices.length;
    for(let i=mesh.runIndex[run];i<mesh.runIndex[run+1];i++) {
      const vertex=mesh.triVerts[i];
      if(!vertices.has(vertex)) {
        vertices.set(vertex,values[0].length/3);
        schema.forEach(({size,offset},channel)=>{
          for(let c=0;c<size;c++)values[channel].push(mesh.vertProperties[vertex*mesh.numProp+offset+c]);
        });
      }
      indices.push(vertices.get(vertex));
    }
    if(indices.length>start)groups.push({start,count:indices.length-start,material});
  }
  const geometry=new BufferGeometry();
  try {
    schema.forEach(({name,size},channel)=>{
      const attribute=new Float32BufferAttribute(values[channel],size);
      if(!attribute.array.every(Number.isFinite))throw new RangeError('CSG output exceeds Float32 storage');
      geometry.setAttribute(name,attribute);
    });
    geometry.setIndex(indices);
    for(const group of groups)geometry.addGroup(group.start,group.count,group.material);
    geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
    if(!geometry.attributes.normal.array.every(Number.isFinite))throw new RangeError('CSG normals exceed Float32 storage');
    const graph=buildTopologyGraph(geometry,0);validateMesh(geometry,graph);
    if(graph.edges.some(edge=>edge.faces.length!==2))throw new RangeError('CSG output cannot preserve closure at Float32 precision');
    return geometry;
  } catch(error){geometry.dispose();throw error;}
}

export function booleanGeometry(wasm,operation,left,right,rightOffset,tolerance) {
  if(!Number.isInteger(rightOffset)||rightOffset<0)throw new RangeError('A nonnegative right material offset is required');
  const owned=[],snapshots=[];
  try {
    const a=prepareGeometry(left,tolerance);snapshots.push(a.geometry);
    const b=prepareGeometry(right,tolerance);snapshots.push(b.geometry);
    if(JSON.stringify(a.schema)!==JSON.stringify(b.schema))throw new TypeError('CSG operands require matching continuous attribute names and sizes');
    const materials=new Map();
    const first=toSolid(wasm,a,0,materials,owned),second=toSolid(wasm,b,rightOffset,materials,owned);
    const result=first[operation](second);owned.push(result);
    return fromSolid(result,a.schema,materials);
  } finally {
    for(const solid of owned.toReversed())solid.delete();
    for(const geometry of snapshots)geometry.dispose();
  }
}

function worldGeometry(mesh) {
  if(mesh.isSkinnedMesh||mesh.isInstancedMesh||mesh.isBatchedMesh||mesh.geometry.isInstancedBufferGeometry)throw new TypeError('Bake or expand mesh instances before CSG');
  mesh.updateWorldMatrix(true,false);
  const matrix=mesh.matrixWorld,e=matrix.elements,det=matrix.determinant();
  if(!e.every(Number.isFinite)||!Number.isFinite(det)||det===0||e[3]!==0||e[7]!==0||e[11]!==0||e[15]!==1)throw new RangeError('A finite invertible affine world transform is required');
  const geometry=new BufferGeometry().copy(mesh.geometry);
  try {
    geometry.applyMatrix4(matrix);
    if(det<0) {
      const count=geometry.index?.count??geometry.getAttribute('position')?.count??0;
      const indices=Array.from({length:count},(_,i)=>geometry.index?geometry.index.getX(i):i);
      for(let i=0;i<count;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
      geometry.setIndex(indices);
    }
    const materials=Array.isArray(mesh.material)?mesh.material.slice():[mesh.material];
    if(!Array.isArray(mesh.material))geometry.clearGroups();
    if(!materials.length||materials.some(m=>!m?.isMaterial)||geometry.groups.some(g=>g.materialIndex>=materials.length))throw new RangeError('CSG material groups must reference valid mesh materials');
    return {geometry,materials};
  } catch(error){geometry.dispose();throw error;}
}

export function booleanMesh(wasm,operation,left,right,tolerance) {
  const snapshots=[];
  try {
    const a=worldGeometry(left);snapshots.push(a.geometry);
    const b=worldGeometry(right);snapshots.push(b.geometry);
    const geometry=booleanGeometry(wasm,operation,a.geometry,b.geometry,a.materials.length,tolerance);
    return new Mesh(geometry,[...a.materials,...b.materials]);
  } finally {for(const geometry of snapshots)geometry.dispose();}
}
