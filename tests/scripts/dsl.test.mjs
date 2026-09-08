import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Group, Object3D } from 'three';
import { bindings } from '../../bindings/api.mjs';

test('empty DSL child lists are silent no-ops; nonempty lists retain native nodes', t => {
  const errors = t.mock.method(console, 'error', () => {});
  const contract = bindings.find(b => b.type === 'Object3D').methods.find(m => m.name === 'add_children');
  const addChildren = new Function('self', 'children', contract.expression);
  const parent = new Group();
  assert.equal(addChildren(parent, []), undefined);
  assert.equal(errors.mock.calls.length, 0);
  const a = new Object3D(), b = new Object3D();
  assert.equal(addChildren(parent, [a, b]), undefined);
  assert.deepEqual(parent.children, [a, b]);
  assert.equal(a.parent, parent);
  assert.equal(b.parent, parent);
});
