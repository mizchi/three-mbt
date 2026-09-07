///|
test "Flow baking produces exportable vertices without changing the live mesh" {
  let source = @three.BoxGeometry(0.4, 0.4, 0.4).as_buffer_geometry()
  let original_x = source.get_attribute("position").unwrap().get_x(0)
  let flow = @three.Flow(
    @three.Mesh(source, @three.MeshBasicMaterial(0xff0000).as_material()),
    1,
  )
  let curve = @three.LineCurve3(
    @three.Vector3(-2, 0, 0),
    @three.Vector3(2, 0, 0),
  ).as_curve3()
  flow.update_curve(0, curve)
  flow.uniforms().set_spine_offset(2)
  flow.move_along_curve(0.25)
  let baked = @three.bake_flow_geometry(flow)
  assert_true(!baked.same_reference(source))
  let bounds = baked.bounding_box().unwrap()
  assert_true((bounds.min().x() - 0.8).abs() < 0.01)
  assert_true((bounds.max().x() - 1.2).abs() < 0.01)
  source.compute_bounding_box()
  near(source.bounding_box().unwrap().max().x(), original_x)
  let mesh = @three.Mesh(
    baked,
    @three.MeshBasicMaterial(0xff0000).as_material(),
  ).as_object3d()
  mesh.update_matrix_world(true)
  let stl = @three.STLExporter().export_binary(mesh)
  let restored = @three.STLLoader().parse(stl)
  restored.compute_bounding_box()
  near(restored.bounding_box().unwrap().max().x(), bounds.max().x())
}

///|
test "Rotated bounds and octree collisions report typed misses and penetration" {
  let obb = @three.OBB(
    @three.Vector3(0, 0, 0),
    @three.Vector3(2, 0.25, 0.25),
    @three.Matrix3(),
  )
  obb.apply_matrix4(@three.Matrix4().make_rotation_z(1.5707963267948966))
  |> ignore
  assert_true(obb.contains_point(@three.Vector3(0, 1, 0)))
  assert_true(!obb.contains_point(@three.Vector3(1, 0, 0)))
  assert_true(
    obb.intersect_ray(
      @three.Ray(@three.Vector3(5, 0, 1), @three.Vector3(0, 0, -1)),
      @three.Vector3(0, 0, 0),
    )
    is None,
  )
  let tree = @three.Octree()
  tree
  .add_triangle(
    @three.Triangle(
      @three.Vector3(-5, 0, -5),
      @three.Vector3(0, 0, 5),
      @three.Vector3(5, 0, -5),
    ),
  )
  .build()
  |> ignore
  let hit = tree
    .ray_intersect(
      @three.Ray(@three.Vector3(0, 2, 0), @three.Vector3(0, -1, 0)),
    )
    .unwrap()
  near(hit.distance(), 2)
  let overlap = tree
    .sphere_intersect(@three.Sphere(@three.Vector3(0, 0.25, 0), 0.5))
    .unwrap()
  near(overlap.depth(), 0.25)
  assert_true(
    tree.sphere_intersect(@three.Sphere(@three.Vector3(0, 2, 0), 0.5)) is None,
  )
  let capsule = @three.Capsule(
    @three.Vector3(0, 0.2, 0),
    @three.Vector3(0, 1, 0),
    0.5,
  )
  assert_true(tree.capsule_intersect(capsule) is Some(_))
}

///|
test "Surface sampling honors weights and interpolates attributes" {
  let geometry = @three.BufferGeometry()
  geometry.set_attribute(
    "position",
    @three.BufferAttribute::from_floats(
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 10, 0, 0, 11, 0, 0, 10, 1, 0],
      3,
    ),
  )
  |> ignore
  geometry.set_attribute(
    "weight",
    @three.BufferAttribute::from_floats([0, 0, 0, 1, 1, 1], 1),
  )
  |> ignore
  geometry.set_attribute(
    "color",
    @three.BufferAttribute::from_floats(
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      3,
    ),
  )
  |> ignore
  let sampler = @three.MeshSurfaceSampler(
    @three.Mesh(geometry, @three.MeshBasicMaterial(0xffffff).as_material()),
  )
  sampler.set_weight_attribute(Some("weight"))
  sampler.set_random_generator(fn() { 0.25 }) |> ignore
  sampler.build() |> ignore
  let position = @three.Vector3(0, 0, 0)
  let normal = @three.Vector3(0, 0, 0)
  let color = @three.Color::from_hex(0)
  sampler.sample_full(position, normal, color, @three.Vector2(0, 0)) |> ignore
  assert_true(position.x() >= 10 && position.x() <= 11)
  near(normal.z(), 1)
  near(color.g(), 1)
}

///|
test "Texture UV transforms and curve JSON preserve editable state" {
  let texture = @three.Texture()
  texture.set_flip_y(false)
  texture.offset().set(0.1, 0.2) |> ignore
  texture.repeat().set(2, 3) |> ignore
  texture.update_matrix()
  let uv = texture.transform_uv(@three.Vector2(0.2, 0.2))
  near(uv.x(), 0.5)
  near(uv.y(), 0.8)
  texture.set_channel(1)
  assert_eq(texture.channel(), 1)
  let shape = @three.Shape::from_points([
    @three.Vector2(0, 0),
    @three.Vector2(2, 0),
    @three.Vector2(0, 2),
  ])
  let restored = @three.Shape().from_json(shape.to_json())
  near(@three.ShapeUtils::area(restored.extract_points(4).shape()).abs(), 2)
  let curve = @three.NURBSCurve(1, [0, 0, 1, 1], [
    @three.Vector4(0, 0, 0, 1),
    @three.Vector4(2, 0, 0, 1),
  ])
  curve.from_json(curve.to_json()) |> ignore
  near(curve.as_curve3().get_point(0.5, @three.Vector3(0, 0, 0)).x(), 1)
  let geometry = @three.BoxGeometry::segmented(2, 3, 4, 2, 3, 4)
  near(curve.as_curve3().get_length(), 2)
  let longer = @three.NURBSCurve(1, [0, 0, 1, 1], [
    @three.Vector4(0, 0, 0, 1),
    @three.Vector4(8, 0, 0, 1),
  ])
  curve.from_json(longer.to_json()) |> ignore
  near(curve.as_curve3().get_length(), 8)
  assert_eq(
    geometry.parameters_json().stringify().contains("widthSegments"),
    true,
  )
}

///|
test "Workflow failures stay inside typed errors" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let mesh = @three.Mesh(
    geometry,
    @three.MeshBasicMaterial(0xffffff).as_material(),
  )
  let flow = @three.Flow(mesh, 1)
  try @three.bake_flow_geometry(flow) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("uninitialized Flow must reject")
  }
  geometry.set_attribute(
    "weight",
    @three.BufferAttribute::from_floats(FixedArray::make(24, 0.0), 1),
  )
  |> ignore
  let sampler = @three.MeshSurfaceSampler(mesh)
  sampler.set_weight_attribute(Some("weight"))
  try sampler.build() catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("zero weight surface must reject")
  }
  try @three.Shape().from_json_string("{") catch {
    @three.SerializationError(_) => ()
  } noraise {
    _ => fail("malformed shape JSON must reject")
  }
}

///|
test "Batched geometry replacement updates individual bounds and capacity" {
  let batch = @three.BatchedMesh(
    2,
    100,
    300,
    @three.MeshBasicMaterial(0xffffff).as_material(),
  )
  let id = batch.add_geometry(@three.BoxGeometry(1, 1, 1).as_buffer_geometry())
  let instance = batch.add_instance(id)
  batch.set_geometry_at(id, @three.BoxGeometry(2, 2, 2).as_buffer_geometry())
  |> ignore
  let box = batch.get_bounding_box_at(id, @three.Box3()).unwrap()
  near(box.max().x(), 1)
  assert_eq(batch.get_geometry_range_at(id).unwrap().vertex_count(), 24)
  batch.set_geometry_size(200, 600)
  batch.set_instance_count(4)
  assert_true(batch.get_visible_at(instance))
  batch.delete_geometry(id) |> ignore
  assert_true(batch.get_geometry_range_at(id) is None)
  assert_true(batch.get_bounding_box_at(id, @three.Box3()) is None)
  assert_true(
    batch.get_bounding_sphere_at(id, @three.Sphere(@three.Vector3(0, 0, 0), 0))
    is None,
  )
}
