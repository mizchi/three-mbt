import {BufferGeometry,Box3,Vector3} from 'three';
import {GeometryWriter,validateMesh} from './topology-edit.js';
import {buildTopologyGraph,connectedFaceIndices} from './topology-graph.js';

const parallel=(a,b)=>a.dot(b)>1-1e-10;
const distance=(plane,point)=>plane.normal.dot(new Vector3().subVectors(point,plane.origin))+(plane.inset??0);

function blendWeights(samples) {
  const weights=new Map();
  for(const [sample,factor] of samples)for(const [index,weight] of sample)weights.set(index,(weights.get(index)??0)+weight*factor);
  return [...weights].filter(([,w])=>w!==0).sort(([a],[b])=>a-b);
}

function supportingPlanes(graph,tolerance) {
  const planes=[],facePlanes=[];
  for(const face of graph.faces) {
    const origin=graph.positions[face.vertices[0]],normal=face.normal;
    let index=planes.findIndex(plane=>parallel(plane.normal,normal)&&Math.abs(distance(plane,origin))<=tolerance);
    if(index<0){index=planes.length;planes.push({origin,normal});}
    facePlanes.push(index);
  }
  for(const plane of planes) {
    if(graph.positions.some(point=>distance(plane,point)>tolerance))throw new RangeError('Bevel requires an outward-facing convex solid');
  }
  return {planes,facePlanes};
}

function cuttingPlanes(graph,chosen,width,tolerance) {
  const ridges=[];
  graph.edges.forEach((edge,index)=>{
    const [a,b]=edge.faces.map(face=>graph.faces[face].normal);
    if(parallel(a,b))return;
    const normal=a.clone().add(b).normalize(),origin=graph.positions[edge.vertices[0]];
    const inset=width*Math.sqrt((1-Math.max(-1,Math.min(1,a.dot(b))))/2);
    let ridge=ridges.find(r=>parallel(r.normal,normal)&&Math.abs(distance({...r,inset:0},origin))<=tolerance);
    if(!ridge){ridge={origin,normal,inset,edges:[]};ridges.push(ridge);}
    ridge.edges.push(index);
  });
  return ridges.filter(ridge=>{
    if(!ridge.edges.some(edge=>chosen.has(edge)))return false;
    if(!ridge.edges.every(edge=>chosen.has(edge)))throw new RangeError('Select every segment of a straight ridge before beveling');
    return true;
  });
}

// Shared point IDs make clipping intersections identical across UV seams.
// Attribute weights remain local to each source triangle or generated chamfer.
function clipSolid(polygons,points,plane,epsilon,material) {
  const distances=new Map(),intersections=new Map();
  const dist=id=>{
    if(!distances.has(id)) {
      const value=distance(plane,points[id]);
      distances.set(id,Math.abs(value)<=epsilon?0:value);
    }
    return distances.get(id);
  };
  const intersect=(a,b)=>{
    if(dist(a.id)===0)return a;
    if(dist(b.id)===0)return b;
    const forward=a.id<b.id,lo=forward?a:b,hi=forward?b:a,key=lo.id+','+hi.id;
    if(!intersections.has(key)) {
      const t=dist(lo.id)/(dist(lo.id)-dist(hi.id));
      const id=points.length;
      points.push(points[lo.id].clone().lerp(points[hi.id],t));distances.set(id,0);
      intersections.set(key,{id,t});
    }
    const {id,t}=intersections.get(key);
    return {id,weights:blendWeights([[lo.weights,1-t],[hi.weights,t]])};
  };
  const clipped=[];
  for(const polygon of polygons) {
    const vertices=[];
    for(let i=0;i<polygon.vertices.length;i++) {
      const a=polygon.vertices[i],b=polygon.vertices[(i+1)%polygon.vertices.length];
      const insideA=dist(a.id)<=0,insideB=dist(b.id)<=0;
      if(insideA)vertices.push(a);
      if(insideA!==insideB)vertices.push(intersect(a,b));
    }
    const clean=vertices.filter((v,i)=>v.id!==vertices[(i+vertices.length-1)%vertices.length].id);
    if(clean.length>=3)clipped.push({...polygon,vertices:clean});
  }
  // Cancel interior edges on the cutting plane; the remaining reversed edges
  // form the chamfer boundary, including collinear triangle-seam intersections.
  const boundary=new Map();
  for(const polygon of clipped)for(let i=0;i<polygon.vertices.length;i++) {
    const a=polygon.vertices[i],b=polygon.vertices[(i+1)%polygon.vertices.length];
    if(dist(a.id)!==0||dist(b.id)!==0)continue;
    const key=Math.min(a.id,b.id)+','+Math.max(a.id,b.id);
    if(boundary.has(key))boundary.delete(key);else boundary.set(key,[b,a]);
  }
  if(boundary.size<3)throw new RangeError('Bevel width is too small or removes the solid');
  const next=new Map();
  for(const [a,b] of boundary.values()) {
    if(next.has(a.id))throw new RangeError('Bevel width produces an ambiguous boundary');
    next.set(a.id,{a,b});
  }
  const start=next.keys().next().value,vertices=[];let current=start;
  do {
    const edge=next.get(current);
    if(!edge)throw new RangeError('Bevel clipping could not close a boundary');
    vertices.push(edge.a);next.delete(current);current=edge.b.id;
  } while(current!==start);
  if(next.size)throw new RangeError('Bevel requires one convex solid');
  clipped.push({vertices,material,normal:plane.normal,support:-1,uvPlane:plane});
  return clipped;
}

function writePolygons(writer,polygons,points) {
  for(const polygon of polygons) {
    let u,v;
    if(polygon.uvPlane) {
      const n=polygon.normal,axis=Math.abs(n.x)<0.8?new Vector3(1,0,0):new Vector3(0,1,0);
      u=axis.cross(n).normalize();v=n.clone().cross(u);
    }
    const append=(weights,point)=>{
      const relative=polygon.uvPlane?point.clone().sub(polygon.uvPlane.origin):null;
      return writer.appendWeighted(weights,point,relative?[relative.dot(u),relative.dot(v)]:undefined);
    };
    const indices=polygon.vertices.map(vertex=>append(vertex.weights,points[vertex.id]));
    if(indices.length===3){writer.triangle(...indices,polygon.material);continue;}
    // A center fan retains collinear boundary vertices and avoids T junctions.
    const center=new Vector3();
    for(const vertex of polygon.vertices)center.add(points[vertex.id]);
    center.divideScalar(indices.length);
    const weights=blendWeights(polygon.vertices.map(vertex=>[vertex.weights,1/indices.length]));
    const middle=append(weights,center);
    for(let i=0;i<indices.length;i++)writer.triangle(middle,indices[i],indices[(i+1)%indices.length],polygon.material);
  }
  return writer.finish();
}

function packPolygons(polygons,points) {
  const packed=[],ids=new Map();
  const mapping=points.map(point=>{
    const position=point.clone();position.set(Math.fround(point.x),Math.fround(point.y),Math.fround(point.z));
    if(!position.toArray().every(Number.isFinite))throw new RangeError('Bevel exceeds Float32 precision');
    const key=position.toArray().join(',');
    if(!ids.has(key)){ids.set(key,packed.length);packed.push(position);}
    return ids.get(key);
  });
  const result=[];
  for(const polygon of polygons) {
    const vertices=polygon.vertices.map(vertex=>({...vertex,id:mapping[vertex.id]}));
    const clean=vertices.filter((v,i)=>v.id!==vertices[(i+vertices.length-1)%vertices.length].id);
    // Adjacent clipping planes can leave slivers smaller than one storage unit.
    // Merge their coincident corners globally before triangulation.
    if(clean.length<3)continue;
    if(new Set(clean.map(v=>v.id)).size!==clean.length)throw new RangeError('Bevel width creates a collapsed polygon');
    result.push({...polygon,vertices:clean});
  }
  return {polygons:result,points:packed};
}

export function bevelEdges(source,graph,edges,width,material) {
  if(!Number.isFinite(width)||width<=0)throw new RangeError('Bevel width must be positive and finite');
  if(!Number.isInteger(material)||material<0)throw new RangeError('A nonnegative bevel material index is required');
  if(!edges.length)return new BufferGeometry().copy(source);
  validateMesh(source,graph);
  if(graph.edges.some(edge=>edge.faces.length!==2))throw new RangeError('Bevel requires a closed mesh; weld render seams first');
  if(!graph.faces.length||connectedFaceIndices(graph,0).length!==graph.faces.length)throw new RangeError('Bevel requires one connected convex solid');
  const size=new Box3().setFromPoints(graph.positions).getSize(new Vector3()).length();
  if(!Number.isFinite(size)||size===0||width<size*1e-7)throw new RangeError('Bevel width is below supported geometry precision');
  const tolerance=size*1e-6,{planes,facePlanes}=supportingPlanes(graph,tolerance);
  const cuts=cuttingPlanes(graph,new Set(edges),width,tolerance);
  if(!cuts.length)return new BufferGeometry().copy(source);
  const writer=new GeometryWriter(source,graph),points=graph.positions.map(p=>p.clone());
  let polygons=graph.faces.map((face,index)=>({
    vertices:writer.sourceFace(index).map((raw,i)=>({id:face.vertices[i],weights:[[raw,1]]})),
    normal:face.normal,material:writer.materials[index],support:facePlanes[index],
  }));
  for(const plane of cuts)polygons=clipSolid(polygons,points,plane,size*1e-10,material);
  const packed=packPolygons(polygons,points);
  const remaining=new Set(packed.polygons.map(p=>p.support));
  if(planes.some((_,i)=>!remaining.has(i)))throw new RangeError('Bevel width removes an original supporting face');
  for(const plane of cuts) {
    const caps=packed.polygons.filter(p=>p.uvPlane===plane);
    if(!caps.length||caps.some(cap=>cap.vertices.some(v=>Math.abs(distance(plane,packed.points[v.id]))>plane.inset*1e-3))) {
      throw new RangeError('Bevel width cannot be represented at these coordinates with Float32 precision');
    }
  }
  const result=writePolygons(writer,packed.polygons,packed.points);
  try {
    const after=buildTopologyGraph(result,0);
    validateMesh(result,after);
    if(after.edges.some(edge=>edge.faces.length!==2))throw new RangeError('Bevel width cannot preserve closure at Float32 precision');
    return result;
  } catch(error) {result.dispose();throw error;}
}
