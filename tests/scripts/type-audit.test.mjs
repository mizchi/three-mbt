import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeclarations, bindingCoverage } from '../../scripts/type-audit-lib.mjs';
test('audit preserves overloads and distinguishes static/instance members', () => {
 const declarations = parseDeclarations('export class Example { constructor(x?: number); foo(x: number): this; foo(x: string): this; static foo(): void; value: number; readonly id: number; private secret: string; protected hidden(): void; _internal(): void; }','example.d.ts');
 const item = declarations[0];
 assert.equal(item.members.find(m=>m.key==='foo').signatures.length,2);
 assert.ok(item.members.some(m=>m.key==='static foo'));
 assert.ok(item.members.some(m=>m.key==='value' && m.writable));
 assert.ok(item.members.some(m=>m.key==='id' && !m.writable));
 assert.ok(!item.members.some(m=>/secret|hidden|_internal/.test(m.key)));
});
test('incidental property references never count as a complete binding', () => {
 const coverage = bindingCoverage([{type:'Example',methods:[{name:'mark_dirty',expression:'{ self.buffer.needsUpdate = true; }'},{name:'items',expression:'self.items.slice()'},{name:'run',js:'execute'}]}]);
 assert.equal(coverage.get('Example').get('buffer').kind,'partial');
 assert.equal(coverage.get('Example').get('items').kind,'mapped');
 assert.equal(coverage.get('Example').get('execute').kind,'mapped');
});
test('merged interfaces contribute material properties without duplicating base classes', () => {
 const declarations = parseDeclarations('interface BaseProperties { name: string; } export class Base {} export interface Base extends BaseProperties {} interface ChildProperties extends BaseProperties { roughness: number; } export class Child extends Base {} export interface Child extends ChildProperties {}','material.d.ts');
 assert.deepEqual(declarations.find(c=>c.name==='Base').members.map(m=>m.key),['name']);
 assert.deepEqual(declarations.find(c=>c.name==='Child').members.map(m=>m.key),['roughness']);
});
test('deprecated members retain their annotation and source location', () => {
 const [item] = parseDeclarations('export class Box { /** @deprecated Use isEmpty. */ empty(): any; }','box.d.ts');
 assert.equal(item.members[0].deprecated,true);
 assert.equal(item.members[0].file,'box.d.ts');
});
test('internal underscore suffixes are excluded while class metadata is retained', () => {
 const [item] = parseDeclarations('export abstract class Interpolant { constructor(size: number); evaluate(t: number): number[]; interpolate_(): number[]; DefaultSettings_: {}; }','interpolant.d.ts');
 assert.equal(item.abstract,true);
 assert.deepEqual(item.members.map(m=>m.key),['constructor','evaluate']);
});
test('typed array snapshots and explicit facades count on the upstream contract', () => {
 const coverage = bindingCoverage([
  {type:'Base',methods:[{name:'count',expression:'self.count'}]},
  {type:'Packed',facadeFor:'Base',methods:[{name:'values',expression:'Array.from(self.array)'},{name:'clone',js:'clone'}]},
 ]);
 assert.equal(coverage.get('Base').get('array').kind,'mapped');
 assert.ok(coverage.get('Base').has('clone'));
 assert.ok(coverage.get('Base').has('count'));
});
test('concrete subclasses retain inherited constructor source and overloads', async () => {
 const { inheritConstructors } = await import('../../scripts/type-audit-lib.mjs');
 const items = parseDeclarations('export abstract class Base { constructor(x: number); constructor(x: string); } export class Child extends Base {}','inherit.d.ts');
 const expanded = inheritConstructors(items);
 const constructor = expanded.find(c=>c.name==='Child').members[0];
 assert.equal(constructor.key,'constructor');
 assert.equal(constructor.inheritedFrom,'Base');
 assert.equal(constructor.signatures.length,2);
 assert.equal(constructor.file,'inherit.d.ts');
});
test('a brand comparison used for narrowing is an indirect property reference', () => {
 const coverage = bindingCoverage([{type:'Base',methods:[{name:'as_packed',expression:'self.isPacked === true ? self : null'}]}]);
 assert.equal(coverage.get('Base').get('isPacked').kind,'partial');
});
test('guarded forwarding is mapped without counting string literals or nested mutations', () => {
 const coverage = bindingCoverage([{type:'Example',methods:[
  {name:'safe',expression:'{ try { return self.query(1); } catch { return null; } }'},
  {name:'load',expression:'{ const value = self.parse(text); if (!value) throw Error("self.fake()"); return value; }'},
  {name:'dirty',expression:'{ self.buffer.needsUpdate = true; }'},
 ]}]).get('Example');
 assert.equal(coverage.get('query').kind,'mapped');
 assert.equal(coverage.get('parse').kind,'mapped');
 assert.equal(coverage.get('buffer').kind,'partial');
 assert.equal(coverage.has('fake'),false);
});
