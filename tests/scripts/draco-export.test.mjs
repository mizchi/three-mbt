import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import draco from 'draco3d';
import {dRACOExporter,dRACOExportOptions} from '../../js/asset-formats.js';

test('Draco handles nonindexed interleaved triangles without changing source storage',async()=>{
 const storage=new T.InterleavedBuffer(new Float32Array([9,0,0,0,9,1,0,0,9,0,1,0]),4);
 const geometry=new T.BufferGeometry().setAttribute('position',new T.InterleavedBufferAttribute(storage,3,1));
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial());
 const previous=globalThis.DracoEncoderModule;
 globalThis.DracoEncoderModule=()=>draco.createEncoderModule({});
 try {
  const bytes=await dRACOExporter().parseAsync(mesh,dRACOExportOptions());
  const module=await draco.createDecoderModule({});
  const decoder=new module.Decoder(),buffer=new module.DecoderBuffer(),restored=new module.Mesh();
  try {
   buffer.Init(bytes,bytes.length);
   assert.ok(decoder.DecodeBufferToMesh(buffer,restored).ok());
   assert.equal(restored.num_faces(),1);
   assert.equal(restored.num_points(),3);
   const values=new module.DracoFloat32Array();
   try {
    decoder.GetAttributeFloatForAllPoints(restored,decoder.GetAttribute(restored,decoder.GetAttributeId(restored,module.POSITION)),values);
    const points=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>values.GetValue(i*3+j)));
    assert.deepEqual(points.map(p=>p.join(',')).sort(),['0,0,0','0,1,0','1,0,0']);
   } finally {module.destroy(values);}
  } finally {module.destroy(restored);module.destroy(buffer);module.destroy(decoder);}
  assert.equal(geometry.index,null);
  assert.equal(geometry.getAttribute('position').data,storage);
 } finally {
  if(previous===undefined)delete globalThis.DracoEncoderModule;else globalThis.DracoEncoderModule=previous;
  geometry.dispose();mesh.material.dispose();
 }
});
