import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {resolve} from 'node:path';
const url='http://topology.test/bundle.js';
let moduleSource;
test.beforeAll(async()=>{
  const {outputFiles}=await build({entryPoints:[resolve('_build/js/release/build/examples/topology/topology.js')],bundle:true,platform:'browser',format:'esm',write:false});
  moduleSource=outputFiles[0].text;
});
test.beforeEach(async({page})=>{
  await page.route('http://topology.test/**',route=>route.fulfill(route.request().url()===url
    ?{body:moduleSource,contentType:'text/javascript'}:{body:'<!doctype html>',contentType:'text/html'}));
  await page.goto('http://topology.test/');
});
test('selection moves a procedural loft and expanded batch tint reaches pixels',async({page})=>{
  const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const pixels=await page.evaluate(async url=>Array.from(await(await import(url)).render_edit()),url);
  expect(pixels).toEqual([255,0,0,255,0,0,0,255,0,255,0,255]);
  expect(errors).toEqual([]);
});
test('edited capped loft exports a closed, consistently oriented STL at its new position',async({page})=>{
  const bytes=Uint8Array.from(await page.evaluate(async url=>Array.from(await(await import(url)).export_edit()),url));
  const view=new DataView(bytes.buffer);
  expect(view.getUint32(80,true)).toBe(12);
  expect(bytes.length).toBe(84+12*50);
  const edges=new Map(),xs=[];
  for(let triangle=0;triangle<12;triangle++) {
    const points=Array.from({length:3},(_,vertex)=>Array.from({length:3},(_,axis)=>view.getFloat32(84+triangle*50+12+vertex*12+axis*4,true)));
    xs.push(...points.map(p=>p[0]));
    for(let i=0;i<3;i++) {
      const a=points[i].join(','),b=points[(i+1)%3].join(','),key=[a,b].sort().join('|');
      const edge=edges.get(key)??[];edge.push(a<b?1:-1);edges.set(key,edge);
    }
  }
  expect(Math.min(...xs)).toBe(1.5);expect(Math.max(...xs)).toBe(2.5);
  for(const directions of edges.values())expect(directions.sort()).toEqual([-1,1]);
});
test('extruded and split faces render new side-wall material above the original cube',async({page})=>{
  const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const pixels=await page.evaluate(async url=>Array.from(await(await import(url)).render_connectivity()),url);
  expect(pixels).toEqual([0,0,0,255,0,255,0,255]);
  expect(errors).toEqual([]);
});
test('extrusion followed by all-edge splitting exports a closed STL with the expected volume',async({page})=>{
  const bytes=Uint8Array.from(await page.evaluate(async url=>Array.from(await(await import(url)).export_connectivity()),url));
  const view=new DataView(bytes.buffer),count=view.getUint32(80,true),edges=new Map();let volume=0;
  expect(count).toBe(80);expect(bytes.length).toBe(84+count*50);
  for(let triangle=0;triangle<count;triangle++) {
    const points=Array.from({length:3},(_,vertex)=>Array.from({length:3},(_,axis)=>view.getFloat32(84+triangle*50+12+vertex*12+axis*4,true)));
    const [a,b,c]=points;
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    for(let i=0;i<3;i++) {
      const a=points[i].join(','),b=points[(i+1)%3].join(','),key=[a,b].sort().join('|');
      const directions=edges.get(key)??[];directions.push(a<b?1:-1);edges.set(key,directions);
    }
  }
  expect(volume).toBeCloseTo(2,6);
  for(const directions of edges.values())expect(directions.sort()).toEqual([-1,1]);
});
test('a selected edge bevel renders its own material with front-face culling',async({page})=>{
  const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const pixels=await page.evaluate(async url=>Array.from(await(await import(url)).render_bevel()),url);
  expect(pixels).toEqual([255,0,0,255,0,255,0,255]);
  expect(errors).toEqual([]);
});
test('beveled STL retains closure and removes the expected triangular prism volume',async({page})=>{
  const bytes=Uint8Array.from(await page.evaluate(async url=>Array.from(await(await import(url)).export_bevel()),url));
  const view=new DataView(bytes.buffer),count=view.getUint32(80,true),edges=new Map();let volume=0;
  expect(count).toBeGreaterThan(12);expect(bytes.length).toBe(84+count*50);
  for(let triangle=0;triangle<count;triangle++) {
    const points=Array.from({length:3},(_,vertex)=>Array.from({length:3},(_,axis)=>view.getFloat32(84+triangle*50+12+vertex*12+axis*4,true)));
    const [a,b,c]=points;
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    for(let i=0;i<3;i++) {
      expect(points[i][0]+points[i][2]).toBeLessThanOrEqual(0.750001);
      const a=points[i].join(','),b=points[(i+1)%3].join(','),key=[a,b].sort().join('|');
      const directions=edges.get(key)??[];directions.push(a<b?1:-1);edges.set(key,directions);
    }
  }
  expect(volume).toBeCloseTo(0.96875,6);
  for(const directions of edges.values())expect(directions.sort()).toEqual([-1,1]);
});
