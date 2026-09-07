import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as statics from '../../js/static-methods.js';
import { bindings } from '../../bindings/api.mjs';

test('core forwarding methods exist in the pinned three.js runtime', () => {
  // These classes install methods on instances and require browser state.
  const instanceMethods = new Set(['WebGLRenderer', 'LoadingManager']);
  for (const binding of bindings) {
    const runtime = THREE[binding.facadeFor ?? binding.type];
    if (!runtime || instanceMethods.has(binding.type)) continue;
    const names = new Set();
    for (const method of binding.methods) {
      assert.ok(!names.has(method.name), `Duplicate ${binding.type}::${method.name}`);
      names.add(method.name);
      if (!method.js) continue;
      const owner = method.static ? runtime : runtime.prototype;
      assert.equal(typeof owner?.[method.js], 'function', `${binding.type}.${method.js}`);
    }
  }
});

test('static module exports and material property types match the contract', () => {
  for (const binding of bindings) {
    for (const method of binding.methods.filter(m => m.static)) {
      assert.equal(typeof statics[`${binding.type}_${method.name}`], 'function');
    }
    if (!binding.type.endsWith('Material') || !THREE[binding.type]) continue;
    const instance = new THREE[binding.type]();
    for (const method of binding.methods.filter(m => /^self\.\w+$/.test(m.expression ?? ''))) {
      if (method.nullable) continue;
      const value = instance[method.expression.slice(5)];
      assert.notEqual(value, undefined, `${binding.type}::${method.name}`);
      const primitive = {Double: 'number', Int: 'number', Bool: 'boolean', String: 'string'}[method.returns];
      if (primitive) assert.equal(typeof value, primitive, `${binding.type}::${method.name}`);
    }
    instance.dispose();
  }
});
