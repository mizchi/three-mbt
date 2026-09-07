import {BufferGeometry,Float32BufferAttribute,FloatType,Vector3} from 'three';

// Connectivity algorithms consume immutable snapshots and return owned geometry.
export function validateMesh(source,graph) {
  if(source.isInstancedBufferGeometry)throw new TypeError('Expand instanced geometry before editing');
  const count=graph.faces.length*3;
  if(source.drawRange.start!==0||source.drawRange.count<count)throw new RangeError('Connectivity edits require a full draw range');
  if(graph.faces.some(face=>face.degenerate))throw new RangeError('Degenerate faces must be repaired before editing');
  for(const edge of graph.edges) {
    if(edge.faces.length>2)throw new RangeError('Nonmanifold edges must be repaired before editing');
    if(edge.faces.length===2&&edge.directions[0]===edge.directions[1])throw new RangeError('Inconsistent winding must be repaired before editing');
  }
  const position=source.getAttribute('position'),point=new Vector3();
  for(let vertex=0;vertex<graph.positions.length;vertex++) {
    for(const index of graph.sources[vertex]) {
      if(!point.fromBufferAttribute(position,index).equals(graph.positions[vertex]))throw new RangeError('Connectivity edits require exactly coincident welded positions');
    }
    // An edge-manifold mesh may still contain a bow-tie vertex.
    const incident=graph.vertexFaces[vertex];
    if(!incident.length)continue;
    const adjacency=new Map(incident.map(face=>[face,[]]));
    for(const index of graph.vertexEdges[vertex]) {
      const faces=graph.edges[index].faces;
      if(faces.length===2){adjacency.get(faces[0]).push(faces[1]);adjacency.get(faces[1]).push(faces[0]);}
    }
    const queue=[incident[0]],visited=new Set(queue);
    for(let i=0;i<queue.length;i++)for(const face of adjacency.get(queue[i]))if(!visited.has(face)){visited.add(face);queue.push(face);}
    if(visited.size!==incident.length)throw new RangeError('Nonmanifold vertex fans must be repaired before editing');
  }
}

function faceMaterials(source,count) {
  if(!source.groups.length)return Array(count).fill(0);
  const materials=Array(count).fill(-1);
  for(const {start,count:indices,materialIndex} of source.groups) {
    if(!Number.isInteger(start)||!Number.isInteger(indices)||start<0||indices<0||start%3||indices%3||start+indices>count*3||!Number.isInteger(materialIndex)||materialIndex<0)throw new RangeError('Triangle-aligned material groups required');
    for(let face=start/3;face<(start+indices)/3;face++) {
      if(materials[face]!==-1)throw new RangeError('Overlapping material groups are ambiguous');
      materials[face]=materialIndex;
    }
  }
  if(materials.includes(-1))throw new RangeError('Material groups must cover every triangle');
  return materials;
}

export class GeometryWriter {
  constructor(source,graph) {
    this.source=source;
    this.materials=faceMaterials(source,graph.faces.length);
    this.attributes=new Map();this.indices=[];this.groups=[];this.originals=new Map();
    const count=source.getAttribute('position').count;
    for(const [name,attribute] of Object.entries(source.attributes)) {
      if(name==='normal'||name==='tangent')continue;
      const array=attribute.array??attribute.data?.array;
      if(attribute.isInstancedBufferAttribute||attribute.data?.isInstancedInterleavedBuffer||attribute.count!==count||attribute.itemSize<1||attribute.itemSize>4||
        (attribute.gpuType!==undefined&&attribute.gpuType!==FloatType)||
        (!(array instanceof Float32Array)&&!(array instanceof Float64Array)&&!attribute.normalized&&!attribute.isFloat16BufferAttribute))throw new TypeError('Continuous vertex attributes with one to four components required: '+name);
      this.attributes.set(name,{attribute,values:[]});
    }
  }
  sourceFace(face) {
    return [0,1,2].map(corner=>this.source.index?this.source.index.getX(face*3+corner):face*3+corner);
  }
  append(a,b=a,t=0,offset,uv) {
    const id=this.attributes.get('position').values.length/3;
    for(const [name,{attribute,values}] of this.attributes) {
      for(let component=0;component<attribute.itemSize;component++) {
        const getter=['getX','getY','getZ','getW'][component];
        const x=attribute[getter](a),y=attribute[getter](b);
        let value=x+(y-x)*t;
        if(name==='position'&&offset)value+=offset.getComponent(component);
        if(name==='uv'&&uv&&component<2)value=uv[component];
        value=Math.fround(value);
        if(!Number.isFinite(value))throw new RangeError('Edited attributes exceed finite float storage');
        values.push(value);
      }
    }
    return id;
  }
  original(index) {
    if(!this.originals.has(index))this.originals.set(index,this.append(index));
    return this.originals.get(index);
  }
  appendWeighted(weights,point,uv) {
    const id=this.attributes.get('position').values.length/3;
    for(const [name,{attribute,values}] of this.attributes)for(let component=0;component<attribute.itemSize;component++) {
      let value=0;
      if(name==='position')value=point.getComponent(component);
      else if(name==='uv'&&uv&&component<2)value=uv[component];
      else {
        const getter=['getX','getY','getZ','getW'][component];
        for(const [index,weight] of weights)value+=attribute[getter](index)*weight;
      }
      value=Math.fround(value);
      if(!Number.isFinite(value))throw new RangeError('Edited attributes exceed finite float storage');
      values.push(value);
    }
    return id;
  }
  triangle(a,b,c,material) {
    const values=this.attributes.get('position').values;
    const p=new Vector3().fromArray(values,a*3),q=new Vector3().fromArray(values,b*3),r=new Vector3().fromArray(values,c*3);
    const area=q.sub(p).cross(r.sub(p)).lengthSq();
    if(!Number.isFinite(area)||area===0)throw new RangeError('Edit would create a degenerate triangle');
    const last=this.groups.at(-1);
    if(last?.materialIndex===material)last.count+=3;
    else this.groups.push({start:this.indices.length,count:3,materialIndex:material});
    this.indices.push(a,b,c);
  }
  finish() {
    const result=new BufferGeometry();
    result.name=this.source.name;
    result.userData=JSON.parse(JSON.stringify(this.source.userData));
    for(const [name,{attribute,values}] of this.attributes) {
      const output=new Float32BufferAttribute(values,attribute.itemSize);
      output.name=attribute.name;output.setUsage(attribute.usage??attribute.data?.usage);
      result.setAttribute(name,output);
    }
    result.setIndex(this.indices);
    for(const group of this.groups)result.addGroup(group.start,group.count,group.materialIndex);
    result.computeVertexNormals();
    if(!result.getAttribute('normal').array.every(Number.isFinite)) {
      result.dispose();
      throw new RangeError('Edited normals exceed finite float storage');
    }
    result.computeBoundingBox();result.computeBoundingSphere();
    return result;
  }
}

export function extrudeRegion(source,graph,faces,offset,sideMaterial) {
  if(!offset.toArray().every(Number.isFinite)||!Number.isFinite(offset.length())||offset.length()===0)throw new RangeError('A finite nonzero extrusion offset is required');
  if(!Number.isInteger(sideMaterial)||sideMaterial<0)throw new RangeError('A nonnegative side material index is required');
  if(!faces.length)return new BufferGeometry().copy(source);
  validateMesh(source,graph);
  const selected=new Set(faces),boundary=[],incoming=new Map(),outgoing=new Map();
  for(const index of faces) {
    const face=graph.faces[index];
    for(let i=0;i<3;i++) {
      const edge=graph.edges[face.edges[i]];
      if(edge.faces.filter(f=>selected.has(f)).length!==1)continue;
      const a=face.vertices[i],b=face.vertices[(i+1)%3];
      incoming.set(b,(incoming.get(b)??0)+1);outgoing.set(a,(outgoing.get(a)??0)+1);
      boundary.push({face:index,corner:i});
    }
  }
  for(const vertex of new Set([...incoming.keys(),...outgoing.keys()])) {
    if(incoming.get(vertex)!==1||outgoing.get(vertex)!==1)throw new RangeError('Extrusion boundaries must be disjoint manifold loops');
  }
  const writer=new GeometryWriter(source,graph),cap=new Map();
  const lifted=index=>{
    if(!cap.has(index))cap.set(index,writer.append(index,index,0,offset));
    return cap.get(index);
  };
  for(let face=0;face<graph.faces.length;face++) {
    const indices=writer.sourceFace(face).map(i=>selected.has(face)?lifted(i):writer.original(i));
    writer.triangle(...indices,writer.materials[face]);
  }
  for(const {face,corner} of boundary) {
    const indices=writer.sourceFace(face),a=indices[corner],b=indices[(corner+1)%3];
    const position=source.getAttribute('position');
    const length=new Vector3().fromBufferAttribute(position,a).distanceTo(new Vector3().fromBufferAttribute(position,b));
    const height=offset.length();
    const bottomA=writer.append(a,a,0,undefined,[0,0]),bottomB=writer.append(b,b,0,undefined,[length,0]);
    const topB=writer.append(b,b,0,offset,[length,height]),topA=writer.append(a,a,0,offset,[0,height]);
    writer.triangle(bottomA,bottomB,topB,sideMaterial);
    writer.triangle(bottomA,topB,topA,sideMaterial);
  }
  return writer.finish();
}

export function splitEdges(source,graph,edges,fraction) {
  if(!Number.isFinite(fraction)||fraction<=0||fraction>=1)throw new RangeError('Edge split fraction must be strictly between zero and one');
  if(!edges.length)return new BufferGeometry().copy(source);
  validateMesh(source,graph);
  const selected=new Set(edges),writer=new GeometryWriter(source,graph),midpoints=new Map();
  for(let index=0;index<graph.faces.length;index++) {
    const face=graph.faces[index],raw=writer.sourceFace(index),vertices=raw.map(i=>writer.original(i));
    const mids=face.edges.map((edge,corner)=>{
      if(!selected.has(edge))return undefined;
      const a=raw[corner],b=raw[(corner+1)%3],key=Math.min(a,b)+','+Math.max(a,b);
      if(!midpoints.has(key)) {
        // Use the same operand order on both sides of a render seam, even near t=0.
        const forward=face.vertices[corner]===graph.edges[edge].vertices[0];
        midpoints.set(key,writer.append(forward?a:b,forward?b:a,fraction));
      }
      return midpoints.get(key);
    });
    const count=mids.filter(m=>m!==undefined).length,material=writer.materials[index];
    const emit=(a,b,c)=>writer.triangle(a,b,c,material);
    if(count===0){emit(...vertices);continue;}
    if(count===3) {
      const [a,b,c]=vertices,[ab,bc,ca]=mids;
      emit(a,ab,ca);emit(ab,b,bc);emit(ca,bc,c);emit(ab,bc,ca);continue;
    }
    const first=mids.findIndex((m,i)=>m!==undefined&&(count===1||mids[(i+1)%3]!==undefined));
    const [a,b,c]=[0,1,2].map(i=>vertices[(first+i)%3]);
    const ab=mids[first];
    if(count===1){emit(a,ab,c);emit(ab,b,c);}
    else {
      const bc=mids[(first+1)%3];
      emit(b,bc,ab);emit(a,ab,c);emit(ab,bc,c);
    }
  }
  return writer.finish();
}
