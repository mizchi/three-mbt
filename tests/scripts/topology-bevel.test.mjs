import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {meshTopologyWelded,meshSelection} from '../../js/topology.js';

function setup(source=new T.BoxGeometry()) {
  const topology=meshTopologyWelded(source,0),selection=meshSelection(topology);
  return {source,topology,selection};
}
function positiveXY(topology,edge) {
  const normals=topology.edgeFaces(edge).map(f=>topology.faceNormal(f));
  return normals.length===2&&normals.some(n=>n.x>0.99)&&normals.some(n=>n.y>0.99);
}
function signedVolume(geometry) {
  const p=geometry.attributes.position;let sum=0;
  for(let i=0;i<geometry.index.count;i+=3) {
    const [a,b,c]=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,geometry.index.getX(i+j)));
    sum+=a.dot(b.cross(c))/6;
  }
  return sum;
}
function closed(geometry) {
  const after=meshTopologyWelded(geometry,0);
  assert.equal(after.boundaryEdges().length,0);
  assert.equal(after.nonmanifoldEdges().length,0);
  assert.equal(after.inconsistentEdges().length,0);
  assert.equal(after.degenerateFaces().length,0);
  assert.ok(signedVolume(geometry)>0);
  return after;
}
test('one convex edge becomes a planar chamfer with the requested face setback and material',()=>{
  const {source,topology,selection}=setup(),before=source.attributes.position.array.slice();
  selection.setEdge(topology.edges().find(e=>positiveXY(topology,e)),true);
  const result=selection.beveledGeometry(0.1,6);closed(result);
  assert.ok(Math.abs(signedVolume(result)-0.995)<1e-7);
  const p=result.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(p.getX(i)+p.getY(i)<=0.900001);
  assert.ok(result.groups.some(g=>g.materialIndex===6));
  assert.deepEqual(new Set(result.groups.map(g=>g.materialIndex)),new Set([0,1,2,3,4,5,6]));
  assert.deepEqual(source.attributes.position.array,before);
  assert.equal(selection.edges().length,1);
  assert.equal(result.attributes.uv.count,p.count);
});
test('adjacent selected ridges meet without holes and selection insertion order is irrelevant',()=>{
  const {topology,selection}=setup();
  const chosen=topology.edges().filter(e=>{
    const normals=topology.edgeFaces(e).map(f=>topology.faceNormal(f));
    return normals.length===2&&normals.some(n=>n.x>0.99)&&normals.some(n=>n.y>0.99||n.z>0.99);
  });
  assert.equal(chosen.length,2);
  for(const edge of chosen)selection.setEdge(edge,true);
  const result=selection.beveledGeometry(0.125,6);closed(result);
  const reverse=meshSelection(topology);for(const edge of chosen.toReversed())reverse.setEdge(edge,true);
  assert.deepEqual(reverse.beveledGeometry(0.125,6).attributes.position.array,result.attributes.position.array);
});
test('all cube ridges bevel together while coplanar triangulation diagonals are ignored',()=>{
  const {topology,selection}=setup();for(const edge of topology.edges())selection.setEdge(edge,true);
  const result=selection.beveledGeometry(0.1,6);closed(result);
  assert.ok(signedVolume(result)<0.96);assert.ok(signedVolume(result)>0.9);
  assert.deepEqual(result.boundingBox.min.toArray(),[-0.5,-0.5,-0.5]);
  assert.deepEqual(result.boundingBox.max.toArray(),[0.5,0.5,0.5]);
});
test('source face UVs are interpolated and generated chamfer UVs and normals are finite',()=>{
  const {source,topology,selection}=setup();
  const before=source.attributes.uv.array.slice();
  selection.setEdge(topology.edges().find(e=>positiveXY(topology,e)),true);
  const result=selection.beveledGeometry(0.25,6),p=result.attributes.position,uv=result.attributes.uv;
  // Box +X face maps u = 0.5-z, v = y+0.5, also after clipping.
  for(const group of result.groups)if(group.materialIndex===0)for(let i=group.start;i<group.start+group.count;i++) {
    const v=result.index.getX(i);
    assert.ok(Math.abs(uv.getX(v)-(0.5-p.getZ(v)))<1e-6);
    assert.ok(Math.abs(uv.getY(v)-(p.getY(v)+0.5))<1e-6);
  }
  assert.ok([...uv.array,...result.attributes.normal.array].every(Number.isFinite));
  for(const group of result.groups)if(group.materialIndex===6)for(let i=group.start;i<group.start+group.count;i++) {
    const v=result.index.getX(i),n=result.attributes.normal;
    assert.ok(Math.abs(n.getX(v)-Math.SQRT1_2)<1e-6);assert.ok(Math.abs(n.getY(v)-Math.SQRT1_2)<1e-6);
  }
  assert.deepEqual(source.attributes.uv.array,before);
});
test('bevel supports rotated convex polyhedra and complete subdivided ridges',()=>{
  for(const source of [new T.TetrahedronGeometry(1),new T.BoxGeometry(1,1,1,2,2,2),new T.BoxGeometry().rotateX(0.2).rotateY(0.3).translate(2,3,4)]) {
    const {topology,selection}=setup(source);for(const edge of topology.edges())selection.setEdge(edge,true);
    closed(selection.beveledGeometry(0.05,0));
  }
});
test('empty and coplanar-only selections return independent unchanged geometry',()=>{
  const {source,topology,selection}=setup();
  const empty=selection.beveledGeometry(0.1,0);
  assert.deepEqual(empty.attributes.position.array,source.attributes.position.array);assert.notEqual(empty.attributes.position.array,source.attributes.position.array);
  selection.setEdge(topology.edges().find(e=>topology.edgeFaces(e).map(f=>topology.faceNormal(f)).reduce((a,b)=>a.dot(b))>0.999),true);
  assert.deepEqual(selection.beveledGeometry(0.1,0).index.array,source.index.array);
});
test('invalid width, excessive cuts, open meshes, concavity and partial ridges raise without mutation',()=>{
  const {source,topology,selection}=setup();for(const edge of topology.edges())selection.setEdge(edge,true);
  for(const width of [0,-1,NaN,Infinity,1e-30])assert.throws(()=>selection.beveledGeometry(width,0),/width|precision/i);
  assert.throws(()=>selection.beveledGeometry(0.1,-1),/material/i);
  assert.throws(()=>selection.beveledGeometry(0.6,0),/width/i);
  const plane=setup(new T.PlaneGeometry());plane.selection.setEdge(plane.topology.edges()[0],true);
  assert.throws(()=>plane.selection.beveledGeometry(0.1,0),/closed/i);
  const concave=new T.BoxGeometry(1,1,1,2,2,2),p=concave.attributes.position;
  for(let i=0;i<p.count;i++)if(p.getX(i)===0&&p.getY(i)===0&&p.getZ(i)===0.5)p.setZ(i,0);
  const dent=setup(concave);for(const edge of dent.topology.edges())dent.selection.setEdge(edge,true);
  assert.throws(()=>dent.selection.beveledGeometry(0.05,0),/convex/i);
  const partial=setup(new T.BoxGeometry(1,1,1,2,2,2));partial.selection.setEdge(partial.topology.edges().find(e=>positiveXY(partial.topology,e)),true);
  assert.throws(()=>partial.selection.beveledGeometry(0.1,0),/ridge/i);
  assert.equal(source.attributes.position.count,24);assert.equal(selection.edges().length,18);
});
test('large coordinate offsets cannot silently erase a requested bevel setback',()=>{
  const {topology,selection}=setup(new T.BoxGeometry().translate(100000,0,0));
  selection.setEdge(topology.edges().find(e=>positiveXY(topology,e)),true);
  assert.throws(()=>selection.beveledGeometry(0.0001,6),/precision|width/i);
});
test('continuous colors interpolate through repeated clips without requiring UV attributes',()=>{
  const source=new T.BoxGeometry().deleteAttribute('uv'),p=source.attributes.position;
  const colors=[];
  for(let i=0;i<p.count;i++)colors.push((p.getX(i)+0.5)*255,(p.getY(i)+0.5)*255,(p.getZ(i)+0.5)*255);
  source.setAttribute('color',new T.Uint8BufferAttribute(colors,3,true));
  const {topology,selection}=setup(source);for(const edge of topology.edges())selection.setEdge(edge,true);
  const result=selection.beveledGeometry(0.125,0);closed(result);
  assert.equal(result.hasAttribute('uv'),false);
  const position=result.attributes.position,color=result.attributes.color;
  for(let i=0;i<position.count;i++) {
    assert.ok(Math.abs(color.getX(i)-position.getX(i)-0.5)<1e-6);
    assert.ok(Math.abs(color.getY(i)-position.getY(i)-0.5)<1e-6);
    assert.ok(Math.abs(color.getZ(i)-position.getZ(i)-0.5)<1e-6);
  }
});
