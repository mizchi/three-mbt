import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {resolve} from 'node:path';
const url='http://csg.test/bundle.js',wasm='http://csg.test/manifold.wasm';
let moduleSource;
test.beforeAll(async()=>{
  const {outputFiles}=await build({entryPoints:[resolve('_build/js/release/build/mizchi/three-viewer/csg/csg.js')],bundle:true,platform:'browser',format:'esm',external:['node:*'],write:false});
  moduleSource=outputFiles[0].text;
});
test.beforeEach(async({page})=>{
  await page.route('http://csg.test/**',route=>{
    if(route.request().url()===url)return route.fulfill({body:moduleSource,contentType:'text/javascript'});
    if(route.request().url()===wasm)return route.fulfill({path:resolve('node_modules/manifold-3d/manifold.wasm'),contentType:'application/wasm'});
    if(route.request().url().endsWith('missing.wasm'))return route.fulfill({status:404,body:'missing'});
    return route.fulfill({body:'<!doctype html>',contentType:'text/html'});
  });
  await page.goto('http://csg.test/');
});
test('MoonBit CSG opens a visible hole and assigns the cutter material to its walls',async({page})=>{
  const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const result=await page.evaluate(async({url,wasm})=>{
    const pixels=await(await import(url)).render_cut(wasm);let green=0;
    for(let i=8;i<pixels.length;i+=4)if(pixels[i]===0&&pixels[i+1]===255&&pixels[i+2]===0)green++;
    return {center:Array.from(pixels.slice(0,8)),green};
  },{url,wasm});
  expect(result.center).toEqual([255,0,0,255,0,0,255,255]);expect(result.green).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});
test('CSG through-hole STL is closed and has the analytically expected volume',async({page})=>{
  const bytes=Uint8Array.from(await page.evaluate(async({url,wasm})=>Array.from(await(await import(url)).export_cut(wasm)),{url,wasm}));
  const view=new DataView(bytes.buffer),count=view.getUint32(80,true),edges=new Map();let volume=0;
  expect(count).toBeGreaterThan(12);expect(bytes.length).toBe(84+count*50);
  for(let triangle=0;triangle<count;triangle++) {
    const points=Array.from({length:3},(_,vertex)=>Array.from({length:3},(_,axis)=>view.getFloat32(84+triangle*50+12+vertex*12+axis*4,true)));
    const [a,b,c]=points;
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    for(let i=0;i<3;i++) {
      const a=points[i].join(','),b=points[(i+1)%3].join(','),key=[a,b].sort().join('|');
      const directions=edges.get(key)??[];directions.push(a<b?1:-1);edges.set(key,directions);
    }
  }
  expect(volume).toBeCloseTo(8-24/2*.4*.4*Math.sin(2*Math.PI/24)*2,5);
  for(const directions of edges.values())expect(directions.sort()).toEqual([-1,1]);
});
test('CSG GLB export retains both source and cut-face materials',async({page})=>{
  const bytes=Uint8Array.from(await page.evaluate(async({url,wasm})=>Array.from(await(await import(url)).export_glb(wasm)),{url,wasm}));
  const view=new DataView(bytes.buffer);expect(view.getUint32(0,true)).toBe(0x46546c67);
  const document=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+view.getUint32(12,true))));
  expect(document.materials.map(m=>m.pbrMetallicRoughness.baseColorFactor)).toEqual([[1,0,0,1],[0,1,0,1]]);
  expect(new Set(document.meshes.flatMap(m=>m.primitives.map(p=>p.material)))).toEqual(new Set([0,1]));
  expect(document.meshes.flatMap(m=>m.primitives).every(p=>p.attributes.TEXCOORD_0!==undefined)).toBe(true);
});
test('WASM URL failures propagate as typed MoonBit errors',async({page})=>{
  expect(await page.evaluate(async url=>(await import(url)).load_failure('http://csg.test/missing.wasm'),url)).toBe(true);
});
