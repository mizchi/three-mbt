///|
test "Batched meshes keep geometry and instance IDs distinct and update independently" {
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let batch = @three.BatchedMesh(4, 100, 200, material)
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let geometry_id = batch.add_geometry(geometry)
  let first = batch.add_instance(geometry_id)
  let second = batch.add_instance(geometry_id)
  batch.set_matrix_at(second, @three.Matrix4().make_translation(3, 0, 0))
  |> ignore
  let matrix = batch.get_matrix_at(second, @three.Matrix4())
  assert_eq(matrix.elements()[12], 3)
  batch.set_color_at(first, @three.Color::from_hex(0xff0000)) |> ignore
  assert_eq(
    batch.get_color_at(first, @three.Color::from_hex(0)).get_hex(),
    0xff0000,
  )
  batch.set_visible_at(second, false) |> ignore
  assert_false(batch.get_visible_at(second))
  assert_true(batch.get_visible_at(first))
  assert_eq(batch.instance_count(), 2)
  batch.delete_instance(first) |> ignore
  assert_eq(batch.instance_count(), 1)
  batch.delete_geometry(geometry_id) |> ignore
  assert_eq(batch.instance_count(), 0)
  batch.dispose()
  material.dispose()
  geometry.dispose()
}

///|
test "Line2 and skeleton helpers expose live geometry and independent configuration" {
  let geometry = @three.LineGeometry().set_positions([0, 0, 0, 1, 0, 0, 1, 1, 0])
  let material = @three.LineMaterial(0xff0000, 4)
  material.resolution().set(800, 600) |> ignore
  material.set_world_units(false)
  let line = @three.Line2(geometry, material)
  line.compute_line_distances() |> ignore
  assert_true(
    geometry.as_buffer_geometry().has_attribute("instanceDistanceStart"),
  )
  assert_eq(material.linewidth(), 4)
  let root = @three.Bone().as_object3d()
  let child = @three.Bone().as_object3d()
  child.position().set(0, 2, 0) |> ignore
  root.add(child) |> ignore
  let helper = @three.SkeletonHelper(root)
  root.update_matrix_world(true)
  helper.as_object3d().update_matrix_world(true)
  assert_eq(helper.geometry().get_attribute("position").unwrap().get_y(0), 2)
  helper.dispose()
  geometry.as_buffer_geometry().dispose()
  material.as_material().dispose()
}
