///|
test "Typed integer buffers preserve raw storage and normalized component access" {
  let attribute = @three.Uint8BufferAttribute([255, 0, 128, 64], 2, true)
  let packed = attribute.as_packed_buffer_attribute()
  let base = packed.as_buffer_attribute()
  near(base.get_x(0), 1)
  near(base.get_y(1), 64.0 / 255.0)
  assert_eq(packed.raw_values()[0], 255)
  packed.copy_array([0, 255, 64, 128]) |> ignore
  near(base.get_y(0), 1)
  base.set_xy(0, 0.5, 0.25) |> ignore
  assert_eq(packed.raw_values()[0], 128)
  assert_eq(packed.raw_values()[1], 64)
  let clone = packed.clone()
  clone.set([1, 2], 0) |> ignore
  assert_eq(packed.raw_values()[0], 128)
  let source = @three.Uint8BufferAttribute([7, 8], 2, false).as_packed_buffer_attribute()
  clone.copy_at(1, source, 0) |> ignore
  assert_eq(clone.raw_values()[2], 7)
  assert_eq(clone.raw_values()[3], 8)
}

///|
test "Interleaved attributes expose shared updates but cannot become packed" {
  let data = @three.InterleavedBuffer([1, 2, 3, 10, 20, 30], 3)
  let xy = @three.InterleavedBufferAttribute(data, 2, 0, false)
  let base = xy.as_buffer_attribute()
  assert_true(base.as_packed() is None)
  base.set_xy(1, 4, 5) |> ignore
  assert_eq(data.values()[3], 4)
  assert_eq(data.values()[4], 5)
  assert_eq(data.values()[5], 30)
  let version = data.version()
  base.mark_needs_update()
  assert_eq(data.version(), version + 1)
  let clone = data.clone()
  clone.set([99], 0) |> ignore
  assert_eq(data.values()[0], 1)
  assert_eq(clone.values()[0], 99)
  let instanced = @three.InstancedInterleavedBuffer([1, 2, 3, 4], 2, 3)
  assert_eq(instanced.mesh_per_attribute(), 3)
  assert_eq(instanced.as_interleaved_buffer().count(), 2)
}

///|
test "Half floats encode numeric input and ordinary buffers transform and clone" {
  let half = @three.Float16BufferAttribute::from_floats([0.5, -2, 1], 3)
  let base = half.as_buffer_attribute()
  near(base.get_x(0), 0.5)
  near(base.get_y(0), -2)
  base.set_z(0, 0.25) |> ignore
  near(base.get_z(0), 0.25)
  let ordinary = @three.Float32BufferAttribute([1, 2, 3], 3, false).as_packed_buffer_attribute()
  ordinary.apply_matrix3(@three.Matrix3().make_scale(2, 3)) |> ignore
  near(ordinary.as_buffer_attribute().get_x(0), 2)
  near(ordinary.as_buffer_attribute().get_y(0), 6)
  let copy = ordinary.clone()
  copy.as_buffer_attribute().set_xyz(0, 0, 0, 0) |> ignore
  near(ordinary.as_buffer_attribute().get_z(0), 3)
  ordinary.set_gpu_type(Int)
  assert_eq(ordinary.gpu_type(), @three.AttributeGPUType::Int)
  assert_true(ordinary.as_buffer_attribute().as_packed() is Some(_))
}
