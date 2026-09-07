import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {meshTopology,meshTopologyWelded,meshSelection} from '../../js/topology.js';
function quad() {
  return new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,1,1,0,0,1,0],3)).setIndex([0,1,2,0,2,3]);
}
test('topology exposes adjacency, boundary edges and connected faces',()=>{
  const topology=meshTopology(quad());
  assert.equal(topology.vertices().length,4);assert.equal(topology.edges().length,5);assert.equal(topology.faces().length,2);
  assert.equal(topology.boundaryEdges().length,4);assert.equal(topology.nonmanifoldEdges().length,0);
  const diagonal=topology.edges().find(edge=>topology.edgeFaces(edge).length===2);
  assert.deepEqual(topology.edgeVertices(diagonal).map(v=>v.index).sort(),[0,2]);
  assert.equal(topology.connectedFaces(topology.faces()[0]).length,2);
  assert.deepEqual(topology.faceNormal(topology.faces()[0]).toArray(),[0,0,1]);
  assert.throws(()=>topology.vertexPosition(meshTopology(quad()).vertices()[0]),/different topology/i);
});
test('welded topology joins UV seams without changing render vertices and selection moves all seam copies',()=>{
  const box=new T.BoxGeometry(),topology=meshTopologyWelded(box,1e-6);
  assert.equal(topology.vertices().length,8);assert.equal(topology.boundaryEdges().length,0);
  assert.equal(box.attributes.position.count,24);
  const selection=meshSelection(topology),id=topology.vertices()[0],before=topology.vertexPosition(id);
  selection.setVertex(id,true);
  const moved=selection.translatedGeometry(new T.Vector3(1,0,0));
  for(const sourceIndex of topology.sourceIndices(id)) {
    assert.equal(moved.attributes.position.getX(sourceIndex),before.x+1);
    assert.equal(box.attributes.position.getX(sourceIndex),before.x);
  }
  assert.equal(moved.attributes.uv.count,box.attributes.uv.count);
  assert.equal(moved.groups.length,box.groups.length);
  selection.growVertices();assert.ok(selection.vertices().length>1);
});
test('degenerate and nonmanifold triangles are reported without silently discarding faces',()=>{
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,0,-1,0,0,0,1],3)).setIndex([0,1,2,1,0,3,0,1,4,0,0,1]);
  const topology=meshTopology(geometry);
  assert.equal(topology.faces().length,4);assert.equal(topology.degenerateFaces().length,1);
  assert.ok(topology.nonmanifoldEdges().length>0);
  assert.throws(()=>meshTopology(quad().setIndex([0,1,999])),/index/i);
  assert.throws(()=>meshTopologyWelded(quad(),-1),/tolerance/i);
});
test('face selection resolves vertices once and snapshots remain independent',()=>{
  const source=quad(),topology=meshTopology(source),selection=meshSelection(topology);
  selection.setFace(topology.faces()[0],true);selection.setFace(topology.faces()[1],true);
  assert.equal(selection.effectiveVertices().length,4);
  const result=selection.translatedGeometry(new T.Vector3(0,0,2));
  assert.equal(result.attributes.position.getZ(0),2);
  result.attributes.position.setZ(0,99);assert.equal(topology.vertexPosition(topology.vertices()[0]).z,0);
  source.attributes.position.setZ(0,100);assert.equal(topology.vertexPosition(topology.vertices()[0]).z,0);
  selection.clear();assert.equal(selection.effectiveVertices().length,0);
});
test('an empty selection preserves authored normals and tangents',()=>{
  const source=quad();
  source.setAttribute('normal',new T.Float32BufferAttribute(Array(4).fill([0,1,0]).flat(),3));
  source.setAttribute('tangent',new T.Float32BufferAttribute(Array(4).fill([1,0,0,1]).flat(),4));
  const copy=meshSelection(meshTopology(source)).translatedGeometry(new T.Vector3(1,0,0));
  assert.deepEqual(copy.attributes.normal.array,source.attributes.normal.array);
  assert.deepEqual(copy.attributes.tangent.array,source.attributes.tangent.array);
  assert.notEqual(copy.attributes.position.array,source.attributes.position.array);
});
test('winding diagnostics and tolerance welding account for neighboring buckets',()=>{
  assert.equal(meshTopology(quad()).inconsistentEdges().length,0);
  assert.equal(meshTopology(quad().setIndex([0,1,2,0,3,2])).inconsistentEdges().length,1);
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0.099,0,0,1,0,0,0,1,0,0.101,0,0,0,-1,0,1,0,0],3));
  const topology=meshTopologyWelded(geometry,0.01);
  assert.equal(topology.vertices().length,4);
  assert.deepEqual(topology.sourceIndices(topology.vertices()[0]),[0,3]);
  assert.equal(topology.connectedFaces(topology.faces()[0]).length,2);
});
