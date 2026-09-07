import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {read} from 'three/addons/libs/ktx-parse.module.js';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';
import {bVHLoader,eXRExporter,kTX2Exporter,eXRExportOptions} from '../../js/asset-extra.js';
test('BVH motion and EXR/KTX2 texture exports preserve data',async()=>{
 const text='HIERARCHY\nROOT hip\n{\nOFFSET 0 0 0\nCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation\nEnd Site\n{\nOFFSET 0 1 0\n}\n}\nMOTION\nFrames: 2\nFrame Time: 0.5\n0 0 0 0 0 0\n2 0 0 0 0 0\n';
 const result=bVHLoader().parse(text);assert.equal(result.skeleton.bones[0].name,'hip');assert.equal(result.clip.duration,0.5);
 const texture=new T.DataTexture(new Float32Array([0.25,0.5,1,1]),1,1,T.RGBAFormat,T.FloatType);
 const exr=await eXRExporter().parse(texture,eXRExportOptions());
 const decoded=new EXRLoader().setDataType(T.FloatType).parse(exr.buffer);
 assert.equal(decoded.width,1);assert.ok(Math.abs(decoded.data[0]-0.25)<1e-5);
 const ktx=read(await kTX2Exporter().parse(texture));assert.equal(ktx.pixelWidth,1);assert.equal(ktx.pixelHeight,1);
 assert.deepEqual(new Float32Array(ktx.levels[0].levelData.slice().buffer),texture.image.data);
});
