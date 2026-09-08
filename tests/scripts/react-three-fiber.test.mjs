import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidElement, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { build } from 'esbuild';
import * as r3f from '../../js/react-three-fiber.js';

test('elements retain native React types, keys, children, and shared resource references', () => {
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial();
  const props = r3f.Props_Props();
  r3f.Props_set_key(props, 'body');
  r3f.Props_set_geometry(props, geometry);
  r3f.Props_set_material(props, material);
  r3f.Props_set_position_xyz(props, 1, 2, 3);
  const node = r3f.mesh(props, []);
  assert.ok(isValidElement(node));
  assert.equal(node.type, 'mesh');
  assert.equal(node.key, 'body');
  assert.equal(node.props.geometry, geometry);
  assert.equal(node.props.material, material);
  assert.deepEqual(node.props.position, [1, 2, 3]);
  r3f.Props_set_name(props, 'later');
  assert.equal(node.props.name, undefined);
  const group = r3f.group(r3f.Props_Props(), [node]);
  assert.equal(group.props.children, node);
  geometry.dispose();
  material.dispose();
});

test('Canvas, components, and Suspense are React elements, without eager component evaluation', () => {
  let renders = 0;
  const component = r3f.component(() => { renders++; return r3f.empty(); });
  const node = r3f.Component_element(component);
  assert.equal(renders, 0);
  assert.equal(node.type, component);
  const suspended = r3f.suspense(r3f.empty(), [node]);
  assert.equal(suspended.type, Suspense);
  const canvas = r3f.canvas(r3f.CanvasProps_CanvasProps(), [suspended]);
  assert.equal(canvas.type, Canvas);
  assert.equal(canvas.props.children, suspended);
});

test('primitive identity and dispose opt-out preserve R3F ownership semantics', () => {
  const object = new Mesh();
  const props = r3f.Props_Props();
  r3f.Props_set_object(props, object);
  r3f.Props_set_dispose_automatic(props, false);
  const node = r3f.primitive(props);
  assert.equal(node.props.object, object);
  assert.equal(node.props.dispose, null);
  r3f.Props_set_dispose_automatic(props, true);
  assert.equal(Object.hasOwn(props, 'dispose'), false);
  assert.equal(node.props.dispose, null);
});

test('core companion entry does not pull in React or Fiber', async () => {
  const { metafile } = await build({
    entryPoints: ['js/constructors.js'], bundle: true, platform: 'browser',
    format: 'esm', write: false, metafile: true,
  });
  assert.equal(Object.keys(metafile.inputs).some(path =>
    /node_modules\/(react|react-dom|@react-three)\//.test(path)), false);
});
