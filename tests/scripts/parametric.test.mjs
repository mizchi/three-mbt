import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,Vector4} from 'three';
import {loftGeometry,loftOptions,nURBSVolume,nURBSUtils,simplexNoiseSeeded} from '../../js/parametric.js';
test('loft caps form a closed surface and invalid sections are rejected',()=>{
 const sections=[0,2].map(y=>[[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,z])=>new Vector3(x,y,z)));
 const geometry=loftGeometry(sections,{...loftOptions(),capStart:true,capEnd:true});
 assert.equal(geometry.index.count,36);
 const positions=geometry.attributes.position,edges=new Map();
 for(let i=0;i<geometry.index.count;i+=3) {
  const vertices=[0,1,2].map(j=>new Vector3().fromBufferAttribute(positions,geometry.index.getX(i+j)).toArray().join(','));
  for(let j=0;j<3;j++){const key=[vertices[j],vertices[(j+1)%3]].sort().join('|');edges.set(key,(edges.get(key)??0)+1);}
 }
 assert.ok([...edges.values()].every(count=>count===2));
 assert.throws(()=>loftGeometry([sections[0],[]],loftOptions()),/section/i);
 assert.equal(sections[0].length,4);
});
test('derivatives have exactly order plus one entries and vanish above a linear degree',()=>{
 const utils=nURBSUtils(),points=[new Vector4(0,0,0,1),new Vector4(2,0,0,1)],knots=[0,0,1,1];
 const polynomial=utils.calcBSplineDerivatives(1,knots,points,0.25,3);
 assert.equal(polynomial.length,4);
 assert.deepEqual(polynomial[2].toArray(),[0,0,0,0]);
 const rational=utils.calcNURBSDerivatives(1,knots,points,0.25,3);
 assert.deepEqual(rational.map(v=>v.toArray()),[[0.5,0,0],[2,0,0],[0,0,0],[0,0,0]]);
});
test('NURBS volume evaluates a cube and rejects invalid domains without looping',()=>{
 const points=[0,1].map(x=>[0,1].map(y=>[0,1].map(z=>new Vector4(x,y,z,1))));
 const knots=[0,0,1,1];
 const volume=nURBSVolume(1,1,1,knots,knots,knots,points);
 const point=new Vector3();volume.getPoint(0.25,0.5,0.75,point);
 assert.deepEqual(point.toArray(),[0.25,0.5,0.75]);
 points[0][0][0].x=100;knots[0]=-100;
 volume.getPoint(0,0,0,point);assert.deepEqual(point.toArray(),[0,0,0]);
 assert.throws(()=>nURBSUtils().findSpan(1,0.5,[0,1,0,1]),/knot/i);
 assert.throws(()=>volume.getPoint(2,0,0,point),/range/i);
 const a=simplexNoiseSeeded(7),b=simplexNoiseSeeded(7);
 assert.equal(a.noise4d(.1,.2,.3,.4),b.noise4d(.1,.2,.3,.4));
});
