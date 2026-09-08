// Cascade-friendly configuration contracts. Each operation updates the native
// object immediately and returns Unit; no builder state or shadow scene exists.
// Existing methods and their return types are left intact.
export function extendDSL(bindings) {
  const object = bindings.find(binding => binding.type === 'Object3D');
  const configure = (name, args, expression, doc) => ({
    name, args, returns: 'Unit', expression: `{ ${expression}; }`, doc,
    cascade: true,
  });
  const methods = [
    configure('set_position', 'position : Vector3', 'self.position.copy(position)',
      'Copies coordinates into the live position vector; does not retain the input vector.'),
    configure('set_position_xyz', 'x : Double, y : Double, z : Double', 'self.position.set(x, y, z)',
      'Sets local position coordinates while preserving the live position reference.'),
    configure('set_rotation', 'rotation : Euler', 'self.rotation.copy(rotation)',
      'Copies Euler angles and order; native quaternion synchronization is preserved.'),
    configure('set_rotation_xyz', 'x : Double, y : Double, z : Double', 'self.rotation.set(x, y, z)',
      'Sets local Euler angles in radians, retaining the current Euler order.'),
    configure('set_quaternion', 'quaternion : Quaternion', 'self.quaternion.copy(quaternion)',
      'Copies quaternion components; native Euler synchronization is preserved. Does not normalize.'),
    configure('set_scale', 'scale : Vector3', 'self.scale.copy(scale)',
      'Copies local scale components into the existing live scale vector.'),
    configure('set_scale_xyz', 'x : Double, y : Double, z : Double', 'self.scale.set(x, y, z)',
      'Sets the three local scale components.'),
    configure('set_uniform_scale', 'scale : Double', 'self.scale.setScalar(scale)',
      'Sets all local scale components to the supplied value.'),
    configure('add_child', 'child : Object3D', 'self.add(child)',
      'Adds a child using native reparenting and event behavior.'),
    configure('add_children', 'children : FixedArray[Object3D]', 'if (children.length > 0) { self.add(...children); }',
      'Adds children in order using native reparenting and event behavior. An empty list is a no-op.'),
    configure('add_to', 'parent : Object3D', 'parent.add(self)',
      'Adds this object to the parent, retaining this object as the cascade receiver.'),
    configure('remove_child', 'child : Object3D', 'self.remove(child)',
      'Removes a child using native event behavior. Does not dispose resources.'),
  ];
  for (const method of methods) {
    if (object.methods.some(existing => existing.name === method.name)) {
      throw new Error(`DSL contract conflicts with native ${object.type}::${method.name}`);
    }
    object.methods.push(method);
  }
}
