import {test,before} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {cSG} from '../../js/csg.js';
import {meshTopologyWelded,meshSelection} from '../../js/topology.js';
let csg;
before(async()=>{csg=cSG();await csg.initialize();});
function volume(g) {
  const p=g.attributes.position,origin=g.boundingBox?.getCenter(new T.Vector3())??new T.Vector3();let result=0;
  for(let i=0;i<g.index.count;i+=3) {
    const [a,b,c]=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,g.index.getX(i+j)).sub(origin));
    result+=a.dot(b.cross(c))/6;
  }
  return result;
}
function closed(g) {
  const topology=meshTopologyWelded(g,0);
  assert.equal(topology.boundaryEdges().length,0);assert.equal(topology.nonmanifoldEdges().length,0);
  assert.equal(topology.inconsistentEdges().length,0);assert.equal(topology.degenerateFaces().length,0);
}
test('overlapping cube booleans preserve closed geometry, volume, UVs and source materials',()=>{
  const a=new T.BoxGeometry(),b=new T.BoxGeometry().translate(.5,0,0),original=a.attributes.position.array.slice();
  for(const [operation,expected] of [['unionGeometry',1.5],['subtractGeometry',.5],['intersectGeometry',.5]]) {
    const result=csg[operation](a,b,6);closed(result);assert.ok(Math.abs(volume(result)-expected)<1e-6);
    assert.equal(result.attributes.uv.count,result.attributes.position.count);
    assert.ok([...result.attributes.normal.array,...result.attributes.uv.array].every(Number.isFinite));
    assert.ok(result.groups.every(g=>g.materialIndex>=0&&g.materialIndex<12));
    assert.ok(result.groups.some(g=>g.materialIndex>=6));
  }
  assert.deepEqual(a.attributes.position.array,original);
});
test('identical, disjoint and empty operands follow Boolean identities',()=>{
  const a=new T.BoxGeometry(),far=new T.BoxGeometry().translate(3,0,0);
  const empty=csg.subtractGeometry(a,a,6);closed(empty);assert.equal(empty.index.count,0);
  assert.equal(csg.intersectGeometry(a,far,6).index.count,0);
  assert.ok(Math.abs(volume(csg.unionGeometry(a,a,6))-1)<1e-6);
  assert.ok(Math.abs(volume(csg.unionGeometry(a,far,6))-2)<1e-6);
  assert.ok(Math.abs(volume(csg.unionGeometry(empty,a,6))-1)<1e-6);
  assert.equal(csg.intersectGeometry(empty,a,6).index.count,0);
});
test('a through-hole forms concave geometry and supports subsequent booleans',()=>{
  const block=new T.BoxGeometry(2,2,2),tool=new T.CylinderGeometry(.4,.4,3,24);
  const result=csg.subtractGeometry(block,tool,6);closed(result);
  const removed=24/2*.4*.4*Math.sin(2*Math.PI/24)*2;
  assert.ok(Math.abs(volume(result)-(8-removed))<1e-5);
  const clip=new T.BoxGeometry(2,1,2).translate(0,.5,0);
  const half=csg.intersectGeometry(result,clip,9);closed(half);
  assert.ok(Math.abs(volume(half)-volume(result)/2)<1e-5);
});
test('nested subtraction retains cavity winding and face-touching unions remove internal faces',()=>{
  const outside=new T.BoxGeometry(2,2,2),inside=new T.BoxGeometry();
  const shell=csg.subtractGeometry(outside,inside,6);closed(shell);assert.ok(Math.abs(volume(shell)-7)<1e-6);
  const filled=csg.unionGeometry(shell,inside,12);closed(filled);assert.ok(Math.abs(volume(filled)-8)<1e-6);
  const touching=csg.unionGeometry(new T.BoxGeometry(),new T.BoxGeometry().translate(1,0,0),6);closed(touching);assert.ok(Math.abs(volume(touching)-2)<1e-6);
});
test('Mesh operations include parent transforms, reflected winding and concatenate shared materials',()=>{
  const red=new T.MeshBasicMaterial({color:0xff0000}),green=new T.MeshBasicMaterial({color:0x00ff00});
  const a=new T.Mesh(new T.BoxGeometry(),red),b=new T.Mesh(new T.BoxGeometry(),green),parent=new T.Group();
  parent.position.x=2;parent.add(a);a.scale.x=-1;b.position.x=2.5;
  const source=a.geometry.attributes.position.array.slice(),result=csg.subtractMesh(a,b);
  closed(result.geometry);assert.ok(Math.abs(volume(result.geometry)-.5)<1e-6);
  assert.deepEqual(result.material,[red,green]);assert.deepEqual(result.position.toArray(),[0,0,0]);
  assert.equal(result.geometry.boundingBox.min.x,1.5);assert.equal(result.geometry.boundingBox.max.x,2);
  assert.ok(result.geometry.groups.some(g=>g.materialIndex===1));
  assert.deepEqual(a.geometry.attributes.position.array,source);assert.equal(a.parent,parent);
});
test('invalid inputs and use before initialization throw without poisoning subsequent operations',()=>{
  const a=new T.BoxGeometry(),b=new T.BoxGeometry();
  assert.throws(()=>cSG().unionGeometry(a,b,6),/initial/i);
  assert.throws(()=>csg.unionGeometry(a,b,-1),/material/i);
  assert.throws(()=>csg.subtractGeometry(new T.PlaneGeometry(),b,0),/closed/i);
  assert.throws(()=>csg.unionGeometry(a,b.clone().deleteAttribute('uv'),6),/attribute/i);
  assert.throws(()=>csg.setWeldTolerance(-1),/tolerance/i);
  const bad=new T.Mesh(a,new T.MeshBasicMaterial());bad.scale.x=0;
  assert.throws(()=>csg.unionMesh(bad,new T.Mesh(b)),/transform/i);
  assert.ok(Math.abs(volume(csg.unionGeometry(a,b,6))-1)<1e-6);
});
test('failed initialization can be retried and successful initialization is idempotent',async()=>{
  const local=cSG();
  await assert.rejects(local.initializeFromBytes(new Uint8Array([0,1,2])));
  assert.equal(local.ready(),false);
  await Promise.all([local.initialize(),local.initialize()]);assert.equal(local.ready(),true);
  await local.initialize();
  assert.ok(Math.abs(volume(local.unionGeometry(new T.BoxGeometry(),new T.BoxGeometry(),6))-1)<1e-6);
});
test('normalized colors and interleaved UVs interpolate across cuts with material provenance',()=>{
  const a=new T.BoxGeometry(),b=new T.BoxGeometry().translate(.5,0,0);
  for(const [g,right] of [[a,false],[b,true]]) {
    const p=g.attributes.position,colors=[],uv=g.attributes.uv,data=[];
    for(let i=0;i<p.count;i++){colors.push(right?0:(p.getX(i)+.5)*255,right?255:0,0);data.push(7,uv.getX(i),uv.getY(i));}
    g.setAttribute('color',new T.Uint8BufferAttribute(colors,3,true));
    g.setAttribute('uv',new T.InterleavedBufferAttribute(new T.InterleavedBuffer(new Float32Array(data),3),2,1));
  }
  const result=csg.subtractGeometry(a,b,6);closed(result);
  for(const group of result.groups)for(let i=group.start;i<group.start+group.count;i++) {
    const vertex=result.index.getX(i),color=result.attributes.color,position=result.attributes.position;
    if(group.materialIndex<6)assert.ok(Math.abs(color.getX(vertex)-position.getX(vertex)-.5)<1e-6);
    else {assert.equal(color.getX(vertex),0);assert.equal(color.getY(vertex),1);}
  }
});
test('weld tolerance is configurable and unsupported instancing or nonmanifold contact rejects',async()=>{
  const strict=cSG();await strict.initialize();strict.setWeldTolerance(0);
  const cylinder=new T.CylinderGeometry(.4,.4,3,24),box=new T.BoxGeometry();
  assert.throws(()=>strict.subtractGeometry(box,cylinder,6),/closed/i);
  strict.setWeldTolerance(1e-6);closed(strict.subtractGeometry(box,cylinder,6));
  const instanced=new T.InstancedBufferGeometry().copy(box);
  assert.throws(()=>strict.unionGeometry(instanced,box,6),/instanc/i);
  assert.throws(()=>strict.unionMesh(new T.Mesh(instanced),new T.Mesh(box)),/instanc/i);
  assert.throws(()=>strict.unionGeometry(box,new T.BoxGeometry().translate(1,1,0),6),/manifold/i);
});
test('beveled topology output remains usable as a Boolean operand',()=>{
  const source=new T.BoxGeometry(),topology=meshTopologyWelded(source,0),selection=meshSelection(topology);
  for(const edge of topology.edges())selection.setEdge(edge,true);
  const bevel=selection.beveledGeometry(.1,6),before=bevel.attributes.position.array.slice();
  const result=csg.subtractGeometry(bevel,new T.BoxGeometry().translate(.5,0,0),7);closed(result);
  assert.ok(Math.abs(volume(result)-volume(bevel)/2)<1e-6);
  assert.deepEqual(bevel.attributes.position.array,before);
});
test('WASM byte initialization snapshots Node Buffer input before awaiting',async()=>{
  const data=readFileSync(new URL('../../node_modules/manifold-3d/manifold.wasm',import.meta.url));
  const local=cSG(),initializing=local.initializeFromBytes(data);
  data.fill(0);
  await initializing;
  assert.equal(local.ready(),true);
});
