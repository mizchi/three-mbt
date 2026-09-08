import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MeshStandardMaterial, MeshPhysicalMaterial } from 'three';
import { meshStandardMaterial, meshPhysicalMaterial } from '../../js/core-factories.js';
import { bindings } from '../../bindings/api.mjs';

test('material factories match native defaults and explicit options', () => {
  for (const [factory, Native] of [[meshStandardMaterial, MeshStandardMaterial], [meshPhysicalMaterial, MeshPhysicalMaterial]]) {
    for (const configured of [false, true]) {
      const native = new Native(configured
        ? { color: 0x123456, roughness: 0.4, metalness: 0.2, flatShading: true }
        : { color: 0x123456 });
      const bound = configured ? factory(0x123456, 0.4, 0.2, true) : factory(0x123456);
      for (const property of ['roughness', 'metalness', 'flatShading', 'opacity', 'transparent']) {
        assert.equal(bound[property], native[property], `${Native.name}.${property}`);
      }
      assert.ok(bound.color.equals(native.color));
      bound.dispose(); native.dispose();
    }
  }
});

test('inherited contracts keep base expressions and return types', () => {
  const types = new Map(bindings.map(binding => [binding.type, binding]));
  let count = 0;
  for (const binding of bindings) for (const method of binding.methods) {
    if (!method.inheritedFrom) continue;
    const base = types.get(method.inheritedFrom).methods.find(candidate => candidate.name === method.name);
    assert.ok(base, `${binding.type}::${method.name}`);
    for (const key of ['args', 'returns', 'js', 'expression', 'nullable', 'defaults']) {
      assert.deepEqual(method[key], base[key], `${binding.type}::${method.name} ${key}`);
    }
    count++;
  }
  assert.ok(count > 0);
});
