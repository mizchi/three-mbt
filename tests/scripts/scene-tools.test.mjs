import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {sceneUtils} from '../../js/scene-tools.js';
test('mesh expansion preserves instance colors and leaves source groups unchanged',()=>{
 const geometry=new T.BoxGeometry();const red=new T.MeshBasicMaterial({color:0xffffff});
 const instanced=new T.InstancedMesh(geometry,red,2);instanced.setColorAt(1,new T.Color(0,1,0));
 const group=sceneUtils().meshesFromInstances(instanced);
 assert.equal(group.children[1].material.color.g,1);assert.equal(group.children[1].material.color.r,0);
 assert.equal(red.color.r,1);
 const mesh=new T.Mesh(geometry,[red,red,red,red,red,red]);const groups=JSON.stringify(geometry.groups);
 const split=sceneUtils().meshesFromMaterials(mesh);
 assert.ok(split.isGroup);assert.equal(split.children.length,6);assert.equal(JSON.stringify(geometry.groups),groups);
 assert.ok(sceneUtils().meshesFromMaterials(new T.Mesh(geometry,red)).isGroup);
});
