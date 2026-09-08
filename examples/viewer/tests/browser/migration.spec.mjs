import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import rhino3dm from 'rhino3dm';
import {fbx,collada,bvh} from '../../../../tests/fixtures/migration.mjs';
const url='http://migration.test/bundle.js';
let moduleSource;
test.beforeAll(async()=>{
 const {outputFiles}=await build({entryPoints:[resolve('_build/js/release/build/mizchi/three-viewer/migration/migration.js')],bundle:true,platform:'browser',format:'esm',write:false});
 moduleSource=outputFiles[0].text;
});
test.beforeEach(async({page})=>{
 await page.route('http://migration.test/**',route=>{
  if(route.request().url()===url)return route.fulfill({body:moduleSource,contentType:'text/javascript'});
  return route.fulfill({body:'<!doctype html>',contentType:'text/html'});
 });
 await page.goto('http://migration.test/');
});
test('UBO values update rendered pixels',async({page})=>{
 const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 expect(await page.evaluate(async url=>Array.from((await import(url)).render_ubo()),url)).toEqual([255,0,0,255,0,255,0,255]);
 expect(errors).toEqual([]);
});
test('framebuffer copies and volume/array layers retain pixels',async({page})=>{
 const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 expect(await page.evaluate(async url=>Array.from((await import(url)).render_copies()),url)).toEqual([0,255,0,255,0,255,0,255,0,255,0,255]);
 expect(errors).toEqual([]);
});
for(const [kind,name] of ['ShaderPass','SMAAPass','GTAOPass','BokehPass'].entries())test(name+' renders through the composer',async({page})=>{
 const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const pixel=await page.evaluate(async({url,kind})=>Array.from(await(await import(url)).render_effect(kind)),{url,kind});
 if(kind===0)expect(pixel).toEqual([0,255,255,255]);else expect(pixel[0]).toBeGreaterThan(150);
 expect(errors).toEqual([]);
});
test('glTF extension hooks round-trip metadata and stop after unregister',async({page})=>{
 expect(await page.evaluate(async url=>(await import(url)).plugin_roundtrip(),url)).toEqual([1,0,1]);
});
test('UV debug produces a canvas and shadow hooks run around depth rendering',async({page})=>{
 const result=await page.evaluate(async url=>(await import(url)).render_helpers(),url);
 expect(result[0]).toBe(64);expect(result[1]).toBeGreaterThan(0);expect(result[2]).toBe(result[1]);
});
test('FBX, Collada and Rhino 3DM loaders read generated assets',async({page})=>{
 const rhino=await rhino3dm();const document=new rhino.File3dm();
 let model;
 try {document.objects().addPoint([1,2,3]);model=Buffer.from(document.toByteArray());}finally{document.delete();}
 await page.route('http://migration.test/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/bundle.js')return route.fallback();
  if(path==='/part.fbx')return route.fulfill({body:fbx});
  if(path==='/part.dae')return route.fulfill({body:collada,contentType:'application/xml'});
  if(path==='/part.3dm')return route.fulfill({body:model});
  if(path==='/rhino/rhino3dm.js')return route.fulfill({path:resolve('node_modules/rhino3dm/rhino3dm.js'),contentType:'text/javascript'});
  if(path==='/rhino/rhino3dm.wasm')return route.fulfill({path:resolve('node_modules/rhino3dm/rhino3dm.wasm'),contentType:'application/wasm'});
  return route.fulfill({body:'<!doctype html>',contentType:'text/html'});
 });
 await page.goto('http://migration.test/');
 for(const [kind,path,count] of [[0,'/part.fbx',3],[1,'/part.dae',3],[2,'/part.3dm',1]]) {
  expect(await page.evaluate(async({url,kind,path})=>(await import(url)).load_formats(kind,path),{url,kind,path})).toBe(count);
 }
});
test('MoonBit texture exports and retargeted BVH motion reach native output',async({page})=>{
 expect(await page.evaluate(async url=>(await import(url)).texture_exports(),url)).toEqual([118,47,49,1,171,75,84,88]);
 expect(await page.evaluate(async({url,bvh})=>(await import(url)).rig_clip(bvh),{url,bvh})).toBeCloseTo(1,5);
});
test('compressed KTX2 textures decompress to a usable canvas texture',async({page})=>{
 await page.route('http://migration.test/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/bundle.js')return route.fallback();
  if(path==='/image.ktx2')return route.fulfill({path:resolve('tests/fixtures/2d_uastc.ktx2')});
  if(path.startsWith('/basis/'))return route.fulfill({path:resolve('node_modules/three/examples/jsm/libs'+path),contentType:path.endsWith('.wasm')?'application/wasm':'text/javascript'});
  return route.fulfill({body:'<!doctype html>',contentType:'text/html'});
 });
 await page.goto('http://migration.test/');
 const result=await page.evaluate(async url=>(await import(url)).decompress_texture('/image.ktx2'),url);
 expect(result[0]).toBeGreaterThan(0);expect(result[0]).toBeLessThanOrEqual(32);
 expect(result[1]).toBeGreaterThan(0);expect(result[1]).toBeLessThanOrEqual(32);
 expect(result[2]).toBe(255);
});
