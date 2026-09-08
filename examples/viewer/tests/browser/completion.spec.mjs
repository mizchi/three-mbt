import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import draco from 'draco3d';
import {zipSync,strToU8} from 'three/addons/libs/fflate.module.js';
let url;
test.beforeAll(async()=>{
 const {outputFiles}=await build({entryPoints:[resolve('_build/js/release/build/mizchi/three-viewer/completion/completion.js')],bundle:true,platform:'browser',format:'esm',write:false});
 url=`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`;
});
test('typed shader patches and render callbacks change actual pixels',async({page})=>{
 const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 expect(await page.evaluate(async url=>Array.from((await import(url)).render_patch()),url)).toEqual([0,255,0,255,1,1]);
 expect(errors).toEqual([]);
});
test('RGBA partial updates upload after the initial texture render',async({page})=>{
 expect(await page.evaluate(async url=>Array.from(await (await import(url)).render_partial()),url)).toEqual([255,0,0,255,0,255,0,255]);
});
test('manual mipmap levels are uploaded and selected during minification',async({page})=>{
 expect(await page.evaluate(async url=>Array.from(await (await import(url)).render_mipmaps()),url)).toEqual([0,0,255,255]);
});
test('USDZ exported meshes load through USDLoader with preserved dimensions',async({page})=>{
 expect(await page.evaluate(async url=>(await import(url)).usdz_roundtrip(),url)).toEqual([80,75,1,2,3]);
});
test('3MF loader reads a manufactured triangle from a ZIP package',async({page})=>{
 const data=zipSync({
  '_rels/.rels':strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
  '3D/3dmodel.model':strToU8('<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh><vertices><vertex x="0" y="0" z="0"/><vertex x="1" y="0" z="0"/><vertex x="0" y="1" z="0"/></vertices><triangles><triangle v1="0" v2="1" v3="2"/></triangles></mesh></object></resources><build><item objectid="1"/></build></model>'),
 });
 await page.route('http://completion.test/**',route=>new URL(route.request().url()).pathname==='/model.3mf'?route.fulfill({body:Buffer.from(data)}):route.fulfill({contentType:'text/html',body:'<!doctype html>'}));
 await page.goto('http://completion.test/');
 expect(await page.evaluate(async url=>(await import(url)).load_3mf('/model.3mf'),url)).toBe(3);
});
test('Draco exporter loads the encoder and produces independently decodable triangles',async({page})=>{
 await page.route('http://completion.test/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/draco_encoder_nodejs.js')return route.fulfill({contentType:'text/javascript',path:resolve('node_modules/draco3d/draco_encoder_nodejs.js')});
  if(path==='/draco_encoder.wasm')return route.fulfill({contentType:'application/wasm',path:resolve('node_modules/draco3d/draco_encoder.wasm')});
  return route.fulfill({contentType:'text/html',body:'<!doctype html>'});
 });
 await page.goto('http://completion.test/');
 const bytes=await page.evaluate(async url=>Array.from(await (await import(url)).export_draco('/draco_encoder_nodejs.js')),url);
 const module=await draco.createDecoderModule({});const decoder=new module.Decoder(), buffer=new module.DecoderBuffer(),mesh=new module.Mesh();
 try {
  const data=Int8Array.from(bytes);buffer.Init(data,data.length);const status=decoder.DecodeBufferToMesh(buffer,mesh);
  expect(status.ok()).toBe(true);expect(mesh.num_faces()).toBe(12);expect(mesh.num_points()).toBe(24);
 } finally {module.destroy(mesh);module.destroy(buffer);module.destroy(decoder);}
});
