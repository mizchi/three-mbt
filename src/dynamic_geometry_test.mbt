///|
test "Dynamic and interleaved attributes share data and track partial updates" {
  let colors = @three.BufferAttribute::from_uint8([255, 0, 128], 3, true)
  assert_eq(colors.get_x(0), 1)
  assert_true((colors.get_z(0) - 128.0 / 255.0).abs() < 0.000001)
  let buffer = @three.InterleavedBuffer([1, 2, 3, 10, 20, 30], 3)
  let position = @three.InterleavedBufferAttribute(buffer, 2, 0, false).as_buffer_attribute()
  let weight = @three.InterleavedBufferAttribute(buffer, 1, 2, false).as_buffer_attribute()
  position.set_component(1, 0, 40) |> ignore
  assert_eq(buffer.values()[3], 40)
  assert_eq(weight.get_x(1), 30)
  buffer.set_usage(DynamicDraw) |> ignore
  buffer.add_update_range(3, 3)
  assert_eq(buffer.update_ranges()[0].start(), 3)
  assert_eq(buffer.update_ranges()[0].count(), 3)
  buffer.clear_update_ranges()
  assert_eq(buffer.update_ranges().length(), 0)
  let instances = @three.InstancedBufferAttribute([1, 2, 3, 4], 2, false, 1)
  instances.as_buffer_attribute().set_usage(StreamDraw) |> ignore
  assert_eq(instances.as_buffer_attribute().usage(), StreamDraw)
  let geometry = @three.InstancedBufferGeometry()
  geometry
  .as_buffer_geometry()
  .set_attribute("offset", instances.as_buffer_attribute())
  |> ignore
  geometry.set_instance_count(2)
  assert_eq(geometry.instance_count(), 2)
}

///|
test "Geometry utilities merge groups and weld equivalent vertices" {
  let first = @three.PlaneGeometry(1, 1).as_buffer_geometry()
  let second = first.clone().translate(2, 0, 0)
  let merged = @three.merge_geometries([first, second], true).unwrap()
  assert_eq(merged.groups().length(), 2)
  assert_eq(merged.groups()[1].material_index(), 1)
  assert_eq(merged.get_attribute("position").unwrap().count(), 8)
  let expanded = first.to_non_indexed()
  let welded = @three.merge_vertices(expanded, 0.0001)
  assert_eq(welded.get_attribute("position").unwrap().count(), 4)
  assert_eq(welded.get_index().unwrap().count(), 6)
  let normals = @three.to_creased_normals(first.clone(), 1)
  assert_true(normals.has_attribute("normal"))
}
