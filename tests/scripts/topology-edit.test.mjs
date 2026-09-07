import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {meshTopology,meshTopologyWelded,meshSelection} from '../../js/topology.js';

function quad() {
  return new T.BufferGeometry()
    .setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,1,1,0,0,1,0],3))
    .setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2))
    .setIndex([0,1,2,0,2,3]);
}
function healthy(geometry,closed=false) {
  const topology=meshTopologyWelded(geometry,0);
  assert.equal(topology.degenerateFaces().length,0);
  assert.equal(topology.inconsistentEdges().length,0);
  assert.equal(topology.nonmanifoldEdges().length,0);
  if(closed)assert.equal(topology.boundaryEdges().length,0);
  return topology;
}
function area(geometry) {
  const p=geometry.attributes.position,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let sum=0;
  for(let i=0;i<geometry.index.count;i+=3) {
    a.fromBufferAttribute(p,geometry.index.getX(i));b.fromBufferAttribute(p,geometry.index.getX(i+1));c.fromBufferAttribute(p,geometry.index.getX(i+2));
    sum+=b.sub(a).cross(c.sub(a)).length()/2;
  }
  return sum;
}
test('region extrusion of a cube cap adds only boundary walls and preserves a closed surface',()=>{
  const source=new T.BoxGeometry(),before=source.attributes.position.array.slice();
  const topology=meshTopologyWelded(source,0),selection=meshSelection(topology);
  for(const face of topology.faces())if(topology.faceNormal(face).y>0.9)selection.setFace(face,true);
  const result=selection.extrudedGeometry(new T.Vector3(0,1,0),6),after=healthy(result,true);
  assert.equal(after.faces().length,20);assert.equal(after.vertices().length,12);
  assert.equal(result.boundingBox.max.y,1.5);assert.equal(result.boundingBox.min.y,-0.5);
  assert.equal(result.groups.filter(g=>g.materialIndex===6).reduce((n,g)=>n+g.count,0),24);
  assert.deepEqual(source.attributes.position.array,before);assert.equal(selection.faces().length,2);
  assert.equal(result.attributes.uv.count,result.attributes.position.count);
  assert.equal(result.index.count,60);
});
test('open region extrusion replaces the cap, leaves the base open, and gives walls usable UVs',()=>{
  const source=quad(),topology=meshTopology(source),selection=meshSelection(topology);
  for(const face of topology.faces())selection.setFace(face,true);
  const result=selection.extrudedGeometry(new T.Vector3(0,0,2),3),after=healthy(result);
  assert.equal(after.faces().length,10);assert.equal(after.boundaryEdges().length,4);
  assert.equal(area(result),9);
  assert.ok(Array.from(result.attributes.uv.array).includes(2));
});
test('a shared edge splits both triangles with interpolated attributes and unchanged area',()=>{
  const source=quad(),topology=meshTopology(source),selection=meshSelection(topology);
  source.addGroup(0,3,2);source.addGroup(3,3,4);
  const grouped=meshTopology(source),edit=meshSelection(grouped);
  edit.setEdge(grouped.edges().find(e=>grouped.edgeFaces(e).length===2),true);
  const result=edit.splitEdgesGeometry(0.25),after=healthy(result);
  assert.equal(after.faces().length,4);assert.equal(after.vertices().length,5);
  assert.equal(area(result),1);
  const p=result.attributes.position,uv=result.attributes.uv;
  const midpoint=Array.from({length:p.count},(_,i)=>i).find(i=>p.getX(i)===0.25&&p.getY(i)===0.25);
  assert.notEqual(midpoint,undefined);assert.equal(uv.getX(midpoint),0.25);assert.equal(uv.getY(midpoint),0.25);
  assert.deepEqual(result.groups.map(g=>[g.count,g.materialIndex]),[[6,2],[6,4]]);
  assert.equal(selection.edges().length,0);
});
test('multiple simultaneous edge splits triangulate all edge masks without T junctions',()=>{
  for(let mask=1;mask<8;mask++) {
    const source=quad().setIndex([0,1,2]),topology=meshTopology(source),selection=meshSelection(topology);
    topology.edges().forEach((edge,i)=>{if(mask&(1<<i))selection.setEdge(edge,true);});
    const result=selection.splitEdgesGeometry(0.3),after=healthy(result);
    assert.equal(after.faces().length,1+selection.edges().length);
    assert.ok(Math.abs(area(result)-0.5)<1e-7);
  }
});
test('edge splitting follows welded seams while keeping their different UV coordinates',()=>{
  const source=new T.BoxGeometry(),topology=meshTopologyWelded(source,0),selection=meshSelection(topology);
  const edge=topology.edges().find(e=>{
    const faces=topology.edgeFaces(e);return topology.faceNormal(faces[0]).dot(topology.faceNormal(faces[1]))===0;
  });
  const midpoint=topology.edgeVertices(edge).map(v=>topology.vertexPosition(v)).reduce((a,b)=>a.add(b)).multiplyScalar(0.5);
  selection.setEdge(edge,true);
  const result=selection.splitEdgesGeometry(0.5),after=healthy(result,true);
  assert.equal(after.faces().length,14);assert.equal(after.vertices().length,9);
  const p=result.attributes.position,uv=result.attributes.uv,matches=[];
  for(let i=0;i<p.count;i++)if(new T.Vector3().fromBufferAttribute(p,i).equals(midpoint))matches.push([uv.getX(i),uv.getY(i)]);
  assert.equal(matches.length,2);assert.notDeepEqual(matches[0],matches[1]);
});
test('connectivity edits reject invalid parameters, ambiguous materials, and malformed meshes',()=>{
  const source=quad(),topology=meshTopology(source),selection=meshSelection(topology);
  selection.setFace(topology.faces()[0],true);selection.setEdge(topology.edges()[0],true);
  assert.throws(()=>selection.extrudedGeometry(new T.Vector3(),0),/offset/i);
  assert.throws(()=>selection.extrudedGeometry(new T.Vector3(1,0,0),0),/degenerate|parallel/i);
  assert.throws(()=>selection.extrudedGeometry(new T.Vector3(0,0,1),-1),/material/i);
  for(const t of [0,1,NaN])assert.throws(()=>selection.splitEdgesGeometry(t),/fraction/i);
  source.addGroup(0,6,0);source.addGroup(0,3,1);
  const ambiguous=meshTopology(source),edit=meshSelection(ambiguous);edit.setFace(ambiguous.faces()[0],true);
  assert.throws(()=>edit.extrudedGeometry(new T.Vector3(0,0,1),0),/group/i);
  const broken=meshTopology(quad().setIndex([0,1,2,0,3,2])),bad=meshSelection(broken);bad.setEdge(broken.edges()[0],true);
  assert.throws(()=>bad.splitEdgesGeometry(0.5),/winding/i);
});
test('empty edit selections return independent unchanged geometry',()=>{
  const source=quad(),selection=meshSelection(meshTopology(source));
  for(const result of [selection.extrudedGeometry(new T.Vector3(0,0,1),0),selection.splitEdgesGeometry(0.5)]) {
    assert.deepEqual(result.index.array,source.index.array);
    assert.deepEqual(result.attributes.position.array,source.attributes.position.array);
    assert.notEqual(result.attributes.position.array,source.attributes.position.array);
  }
});
test('opposite seam orientations produce bit-identical split positions near an endpoint',()=>{
  const topology=meshTopologyWelded(quad().toNonIndexed(),0),selection=meshSelection(topology);
  selection.setEdge(topology.edges().find(e=>topology.edgeFaces(e).length===2),true);
  const result=selection.splitEdgesGeometry(1e-10),after=healthy(result);
  assert.equal(after.vertices().length,5);
  assert.equal(after.boundaryEdges().length,4);
});
test('region boundaries include holes and reject regions touching only at a vertex',()=>{
  const grid=new T.PlaneGeometry(3,3,3,3),topology=meshTopology(grid),selection=meshSelection(topology);
  for(const face of topology.faces()) {
    const center=topology.faceVertices(face).map(v=>topology.vertexPosition(v)).reduce((a,b)=>a.add(b)).divideScalar(3);
    if(Math.abs(center.x)>0.5||Math.abs(center.y)>0.5)selection.setFace(face,true);
  }
  const result=selection.extrudedGeometry(new T.Vector3(0,0,1),0),after=healthy(result);
  assert.equal(after.faces().length,50);assert.equal(after.boundaryEdges().length,12);assert.equal(area(result),25);
  const small=meshTopology(new T.PlaneGeometry(2,2,2,2)),touching=meshSelection(small);
  for(const face of small.faces()) {
    const center=small.faceVertices(face).map(v=>small.vertexPosition(v)).reduce((a,b)=>a.add(b));
    if(center.x*center.y>0)touching.setFace(face,true);
  }
  assert.throws(()=>touching.extrudedGeometry(new T.Vector3(0,0,1),0),/boundar/i);
});
test('normalized and interleaved attributes decode before interpolation; integer shader inputs reject',()=>{
  const source=quad();
  source.setAttribute('color',new T.Uint8BufferAttribute([0,0,0,255,0,0,255,255,255,0,255,0],3,true));
  source.setAttribute('uv',new T.InterleavedBufferAttribute(new T.InterleavedBuffer(new Float32Array([7,0,0,7,1,0,7,1,1,7,0,1]),3),2,1));
  const topology=meshTopology(source),selection=meshSelection(topology);
  selection.setEdge(topology.edges().find(e=>topology.edgeFaces(e).length===2),true);
  const result=selection.splitEdgesGeometry(0.5),position=result.attributes.position;
  const mid=Array.from({length:position.count},(_,i)=>i).find(i=>position.getX(i)===0.5&&position.getY(i)===0.5);
  assert.equal(result.attributes.color.getX(mid),0.5);assert.equal(result.attributes.uv.getY(mid),0.5);
  source.setAttribute('label',new T.Int32BufferAttribute([0,1,2,3],1));
  const discrete=meshTopology(source),edit=meshSelection(discrete);edit.setEdge(discrete.edges()[0],true);
  assert.throws(()=>edit.splitEdgesGeometry(0.5),/attributes/i);
});
test('nonmanifold vertices, approximate welds, partial draws and float normal overflow reject',()=>{
  const bowtie=quad().setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,-1,0,0,0,-1,0],3)).deleteAttribute('uv').setIndex([0,1,2,0,3,4]);
  const topology=meshTopology(bowtie),selection=meshSelection(topology);selection.setEdge(topology.edges()[0],true);
  assert.throws(()=>selection.splitEdgesGeometry(0.5),/vertex/i);
  const seam=quad().toNonIndexed();seam.attributes.position.setX(3,0.00001);
  const approximate=meshTopologyWelded(seam,0.0001),edit=meshSelection(approximate);edit.setEdge(approximate.edges()[0],true);
  assert.throws(()=>edit.splitEdgesGeometry(0.5),/coincident/i);
  const partial=quad();partial.setDrawRange(0,3);
  const cropped=meshTopology(partial),crop=meshSelection(cropped);crop.setEdge(cropped.edges()[0],true);
  assert.throws(()=>crop.splitEdgesGeometry(0.5),/draw range/i);
  const huge=quad().scale(1e20,1e20,1),large=meshTopology(huge),overflow=meshSelection(large);overflow.setEdge(large.edges()[0],true);
  assert.throws(()=>overflow.splitEdgesGeometry(0.5),/normal/i);
});
