// Convenience APIs preserve native methods; value arithmetic clones its receiver.
export function extendErgonomics(bindings) {
  const types = new Map(bindings.map(binding => [binding.type, binding]));
  for (const type of ['Vector2', 'Vector3', 'Vector4']) {
    const binding = types.get(type);
    if (!binding.methods.some(method => method.name === 'same_reference')) {
      binding.methods.push({ name: 'same_reference', args: `other : ${type}`, returns: 'Bool', expression: 'self === other' });
    }
    binding.operators = [
      { trait: 'Add', method: 'add', target: 'add' },
      { trait: 'Sub', method: 'sub', target: 'sub' },
      { trait: 'Mul', method: 'mul', target: 'multiply' },
      { trait: 'Div', method: 'div', target: 'divide' },
      { trait: 'Neg', method: 'neg', target: 'negate', unary: true },
    ];
    for (const [name, js] of [['scaled', 'multiplyScalar'], ['divided_by', 'divideScalar']]) {
      binding.methods.push({
        name, args: 'scalar : Double', returns: type, js,
        expression: `self.clone().${js}(scalar)`,
        doc: 'Returns a fresh vector; leaves the receiver unchanged. Numeric behavior follows three.js.',
      });
    }
  }
  for (const type of ['MeshStandardMaterial', 'MeshPhysicalMaterial']) {
    Object.assign(types.get(type).factory, {
      args: 'color : Int, roughness : Double, metalness : Double, flat_shading : Bool',
      defaults: { roughness: '1', metalness: '0', flat_shading: 'false' },
      jsDefaults: { roughness: '1', metalness: '0', flat_shading: 'false' },
      options: { flat_shading: 'flatShading' },
    });
  }
  types.get('CatmullRomCurve3').factory.defaults = {
    closed: 'false', curve_type: 'Centripetal', tension: '0.5',
  };
  Object.assign(types.get('LoftOptions').factory, {
    args: 'closed : Bool, cap_start : Bool, cap_end : Bool',
    defaults: { closed: 'true', cap_start: 'false', cap_end: 'false' },
  });
  for (const dim of [2, 3]) {
    for (const method of types.get(`Curve${dim}`).methods) {
      if (['get_point', 'get_point_at', 'get_tangent', 'get_tangent_at'].includes(method.name)) {
        method.defaults = { target: `Vector${dim}(${Array(dim).fill('0').join(', ')})` };
        method.doc = 'Passes target to the native method and preserves its return value. An omitted target is allocated per call.';
      }
    }
  }
  for (const method of types.get('Object3D').methods) {
    if (['position', 'rotation', 'quaternion', 'scale', 'up', 'matrix', 'matrix_world'].includes(method.name)) {
      method.doc = 'Returns the live three.js reference, not a copy.';
    }
  }

  // Copy explicitly selected base contracts, including transitive upcasts.
  // A subtype's own method always wins; self-returning methods retain the base
  // return type instead of introducing a new fluent API or discarding results.
  const inherited = {
    Object3D: 'id uuid kind name set_name position rotation quaternion scale up matrix matrix_world visible set_visible set_cast_shadow set_receive_shadow cast_shadow receive_shadow children parent add remove remove_from_parent attach look_at rotate_x rotate_y rotate_z translate_x translate_y translate_z apply_matrix4 apply_quaternion update_matrix update_matrix_world update_world_matrix get_world_position get_world_quaternion get_world_scale get_world_direction local_to_world world_to_local traverse traverse_visible get_object_by_name',
    Material: 'id kind name set_name opacity set_opacity transparent set_transparent visible set_visible depth_test set_depth_test depth_write set_depth_write dispose mark_needs_update',
    MeshStandardMaterial: 'color roughness set_roughness metalness set_metalness flat_shading set_flat_shading wireframe set_wireframe',
    BufferGeometry: 'id name set_name get_attribute has_attribute get_index set_attribute set_indices compute_vertex_normals compute_bounding_box compute_bounding_sphere bounding_box bounding_sphere translate scale rotate_x rotate_y rotate_z apply_matrix4 center dispose',
    Curve2: 'get_point get_point_at get_tangent get_tangent_at get_points get_spaced_points get_length update_arc_lengths',
    Curve3: 'get_point get_point_at get_tangent get_tangent_at get_points get_spaced_points get_length update_arc_lengths compute_frenet_frames',
  };
  const allowed = new Map(Object.entries(inherited).map(([base, names]) => [base, new Set(names.split(' '))]));
  const complete = new Set();
  const active = new Set();
  function extend(binding) {
    if (complete.has(binding.type)) return;
    if (active.has(binding.type)) throw new Error(`Cyclic binding inheritance: ${binding.type}`);
    active.add(binding.type);
    const bases = binding.methods.filter(method => method.identity).map(method => method.returns);
    if (['Group', 'Scene'].includes(binding.type)) bases.push('Object3D');
    const names = new Set(binding.methods.map(method => method.name));
    for (const base of bases) {
      const parent = types.get(base);
      if (!parent) continue;
      extend(parent);
      for (const method of parent.methods) {
        if (!(allowed.get(base)?.has(method.name) || method.inheritedFrom || method.cascade) || names.has(method.name)) continue;
        binding.methods.push({ ...method, inheritedFrom: method.inheritedFrom ?? base });
        names.add(method.name);
      }
    }
    active.delete(binding.type);
    complete.add(binding.type);
  }
  for (const binding of bindings) extend(binding);
}
