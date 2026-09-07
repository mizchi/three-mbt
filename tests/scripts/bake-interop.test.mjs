import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bakeMeshGeometry, bakeMeshHierarchy} from '../../js/bake.js';

test('baking freezes morph positions and bone normals while preserving hierarchy transforms', () => {
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 geometry.computeVertexNormals();
 geometry.morphTargetsRelative=true;
 geometry.morphAttributes.position=[new T.Float32BufferAttribute([0,0,2,0,0,2,0,0,2],3)];
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(Array(12).fill(0),4));
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new T.SkinnedMesh(geometry,new T.MeshStandardMaterial());
 const bone=new T.Bone();mesh.add(bone);mesh.bind(new T.Skeleton([bone]));
 mesh.morphTargetInfluences[0]=0.5;bone.rotation.y=Math.PI/2;
 const group=new T.Group();group.position.x=3;group.add(mesh);group.updateMatrixWorld(true);
 const result=bakeMeshGeometry(mesh);assert.equal(result.ok,true,result.error);
 const p=result.value.getAttribute('position'),n=result.value.getAttribute('normal');
 assert.ok(Math.abs(p.getX(0)-1)<1e-6);assert.ok(Math.abs(n.getX(0)-1)<1e-6);
 assert.equal(result.value.getAttribute('skinWeight'),undefined);
 assert.deepEqual(result.value.morphAttributes,{});
 const hierarchy=bakeMeshHierarchy(group);assert.equal(hierarchy.ok,true,hierarchy.error);
 assert.equal(hierarchy.value.children[0].position.x,3);assert.equal(hierarchy.value.children[0].children[0].isSkinnedMesh,undefined);
 assert.equal(mesh.morphTargetInfluences[0],0.5);assert.equal(geometry.getAttribute('position').getZ(0),0);
});
