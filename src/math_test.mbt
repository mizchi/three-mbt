///|
test "Vector3 constructs and mutates a real three.js vector" {
  let v = @three.Vector3(3, 4, 0)
  assert_eq(v.length(), 5)
  let result = v.set(1, 2, 3).add(@three.Vector3(3, 2, 1))
  assert_true(v.same_reference(result))
  assert_eq(v.x(), 4)
  assert_eq(v.y(), 4)
  assert_eq(v.z(), 4)
}

///|
fn near(actual : Double, expected : Double) -> Unit raise {
  assert_true((actual - expected).abs() < 0.000000001)
}

///|
test "Vector2 arithmetic, clone, and zero normalization" {
  let v = @three.Vector2(3, 4)
  near(v.length(), 5)
  let copy = v.clone().normalize().multiply_scalar(10)
  near(copy.x(), 6)
  near(copy.y(), 8)
  assert_eq(v.x(), 3)
  assert_false(v.same_reference(copy))
  near(v.dot(@three.Vector2(2, 1)), 10)
  near(v.distance_to(@three.Vector2(0, 0)), 5)
  assert_true(@three.Vector2(0, 0).normalize().equals(@three.Vector2(0, 0)))
  assert_true(v.copy(copy).same_reference(v))
  assert_true(v.sub(copy).equals(@three.Vector2(0, 0)))
}

///|
test "Vector3 cross products, interpolation, and clone independence" {
  let x = @three.Vector3(1, 0, 0)
  let y = @three.Vector3(0, 1, 0)
  let z = x.clone().cross(y)
  assert_true(z.equals(@three.Vector3(0, 0, 1)))
  assert_eq(x.dot(y), 0)
  assert_eq(x.length_squared(), 1)
  assert_false(x.same_reference(x.clone()))
  assert_true(x.clone().lerp(y, 0.5).equals(@three.Vector3(0.5, 0.5, 0)))
  near(@three.Vector3(0, 3, 4).normalize().length(), 1)
  assert_eq(x.distance_to(@three.Vector3(4, 4, 0)), 5)
  assert_true(x.clone().multiply_scalar(2).sub(x).equals(x))
}

///|
test "Euler order is typed and survives updates" {
  let e = @three.Euler(0.1, 0.2, 0.3, order=ZYX)
  assert_eq(e.order(), @three.EulerOrder::ZYX)
  assert_true(e.set(0.4, 0.5, 0.6, order=YXZ).same_reference(e))
  near(e.x(), 0.4)
  near(e.y(), 0.5)
  near(e.z(), 0.6)
  assert_eq(e.order(), @three.EulerOrder::YXZ)
  assert_false(e.same_reference(e.clone()))
}

///|
test "Quaternion rotations, multiplication, inverse, and slerp" {
  let axis = @three.Vector3(0, 0, 1)
  let q = @three.Quaternion().set_from_axis_angle(axis, 3.141592653589793 / 2)
  let v = @three.Vector3(1, 0, 0).apply_quaternion(q)
  near(v.x(), 0)
  near(v.y(), 1)
  near(q.length(), 1)
  let identity = q.clone().multiply(q.clone().invert())
  near(identity.w(), 1)
  near(identity.x(), 0)
  near(identity.y(), 0)
  near(identity.z(), 0)
  let half = @three.Quaternion().slerp(q, 0.5)
  near(half.angle_to(q), 3.141592653589793 / 4)
  near(@three.Quaternion::from_xyzw(0, 0, 0, 2).normalize().w(), 1)
}

///|
test "Euler and Quaternion roundtrip for every rotation order" {
  for order in [@three.EulerOrder::XYZ, YXZ, ZXY, ZYX, YZX, XZY] {
    let e = @three.Euler(0.2, 0.3, 0.4, order~)
    let q = @three.Quaternion().set_from_euler(e)
    let restored = @three.Euler(0, 0, 0, order~).set_from_quaternion(q)
    near(restored.x(), e.x())
    near(restored.y(), e.y())
    near(restored.z(), e.z())
    assert_eq(restored.order(), order)
  }
}

///|
test "Matrix4 composition, inversion, and decomposition" {
  let position = @three.Vector3(10, 20, 30)
  let rotation = @three.Quaternion()
  let scale = @three.Vector3(2, 3, 4)
  let matrix = @three.Matrix4().compose(position, rotation, scale)
  let v = @three.Vector3(1, 2, 3).apply_matrix4(matrix)
  assert_true(v.equals(@three.Vector3(12, 26, 42)))
  assert_true(
    v.apply_matrix4(matrix.clone().invert()).equals(@three.Vector3(1, 2, 3)),
  )
  near(matrix.determinant(), 24)
  let p = @three.Vector3(0, 0, 0)
  let q = @three.Quaternion()
  let s = @three.Vector3(0, 0, 0)
  matrix.decompose(p, q, s) |> ignore
  assert_true(p.equals(position))
  assert_true(s.equals(scale))
  near(q.w(), 1)
}

///|
test "Matrix4 multiplication order and column-major snapshot" {
  let translation = @three.Matrix4().make_translation(10, 0, 0)
  let scale = @three.Matrix4().make_scale(2, 2, 2)
  let post = translation.clone().multiply(scale)
  let pre = translation.clone().premultiply(scale)
  assert_eq(@three.Vector3(1, 0, 0).apply_matrix4(post).x(), 12)
  assert_eq(@three.Vector3(1, 0, 0).apply_matrix4(pre).x(), 22)
  let elements = translation.elements()
  assert_eq(elements.length(), 16)
  assert_eq(elements[12], 10)
  elements[12] = 99
  assert_eq(translation.elements()[12], 10)
  assert_true(translation.identity().equals(@three.Matrix4()))
}

///|
test "Color distinguishes sRGB hex from linear RGB" {
  let color = @three.Color::from_hex(0x808080)
  assert_eq(color.get_hex(), 0x808080)
  assert_true(color.r() > 0.21 && color.r() < 0.22)
  let linear = @three.Color::from_rgb(0.5, 0.25, 0.75)
  near(linear.r(), 0.5)
  near(linear.g(), 0.25)
  near(linear.b(), 0.75)
  let copy = color.clone().set_hex(0xff0000)
  assert_eq(color.get_hex(), 0x808080)
  assert_eq(copy.get_hex(), 0xff0000)
  assert_true(copy.set_rgb(0, 1, 0).same_reference(copy))
  assert_eq(copy.get_hex(), 0x00ff00)
}
