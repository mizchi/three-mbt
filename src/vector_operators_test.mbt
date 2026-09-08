///|
test "Vector2 arithmetic returns fresh values and preserves operands" {
  let a = @three.Vector2(2, 4)
  let b = @three.Vector2(1, 2)
  let sum = a + b
  assert_true(sum.equals(@three.Vector2(3, 6)))
  assert_false(sum.same_reference(a))
  assert_false(sum.same_reference(b))
  assert_true((a - b).equals(b))
  assert_true((a * b).equals(@three.Vector2(2, 8)))
  assert_true((a / b).equals(@three.Vector2(2, 2)))
  assert_true((-a).equals(@three.Vector2(-2, -4)))
  assert_true(a.scaled(0.5).equals(b))
  assert_true(a.divided_by(2).equals(b))
  assert_true((a + b.scaled(2) - b).equals(sum))
  assert_true((a - a).equals(@three.Vector2(0, 0)))
  assert_false((a + a).same_reference(a))
  assert_false(a.scaled(1).same_reference(a))
  assert_false(a.divided_by(1).same_reference(a))
  assert_true(a.equals(@three.Vector2(2, 4)))
  assert_true(b.equals(@three.Vector2(1, 2)))
  // Inherent methods keep the native Three.js mutation and identity semantics.
  assert_true(a.add(b).same_reference(a))
  assert_true(a.equals(sum))
}

///|
test "Vector3 arithmetic returns fresh values and preserves operands" {
  let a = @three.Vector3(2, 4, 6)
  let b = @three.Vector3(1, 2, 3)
  let sum = a + b
  assert_true(sum.equals(@three.Vector3(3, 6, 9)))
  assert_false(sum.same_reference(a))
  assert_false(sum.same_reference(b))
  assert_true((a - b).equals(b))
  assert_true((a * b).equals(@three.Vector3(2, 8, 18)))
  assert_true((a / b).equals(@three.Vector3(2, 2, 2)))
  assert_true((-a).equals(@three.Vector3(-2, -4, -6)))
  assert_true(a.scaled(0.5).equals(b))
  assert_true(a.divided_by(2).equals(b))
  assert_true((a + b.scaled(2) - b).equals(sum))
  assert_true((a - a).equals(@three.Vector3(0, 0, 0)))
  assert_false((a + a).same_reference(a))
  assert_false(a.scaled(1).same_reference(a))
  assert_false(a.divided_by(1).same_reference(a))
  assert_true(a.equals(@three.Vector3(2, 4, 6)))
  assert_true(b.equals(@three.Vector3(1, 2, 3)))
  // Inherent methods keep the native Three.js mutation and identity semantics.
  assert_true(a.add(b).same_reference(a))
  assert_true(a.equals(sum))
}

///|
test "Vector4 arithmetic returns fresh values and preserves operands" {
  let a = @three.Vector4(2, 4, 6, 8)
  let b = @three.Vector4(1, 2, 3, 4)
  let sum = a + b
  assert_true(sum.equals(@three.Vector4(3, 6, 9, 12)))
  assert_false(sum.same_reference(a))
  assert_false(sum.same_reference(b))
  assert_true((a - b).equals(b))
  assert_true((a * b).equals(@three.Vector4(2, 8, 18, 32)))
  assert_true((a / b).equals(@three.Vector4(2, 2, 2, 2)))
  assert_true((-a).equals(@three.Vector4(-2, -4, -6, -8)))
  assert_true(a.scaled(0.5).equals(b))
  assert_true(a.divided_by(2).equals(b))
  assert_true((a + b.scaled(2) - b).equals(sum))
  assert_true((a - a).equals(@three.Vector4(0, 0, 0, 0)))
  assert_false((a + a).same_reference(a))
  assert_false(a.scaled(1).same_reference(a))
  assert_false(a.divided_by(1).same_reference(a))
  assert_true(a.equals(@three.Vector4(2, 4, 6, 8)))
  assert_true(b.equals(@three.Vector4(1, 2, 3, 4)))
  // Inherent methods keep the native Three.js mutation and identity semantics.
  assert_true(a.add(b).same_reference(a))
  assert_true(a.equals(sum))
}

///|
test "vector arithmetic does not mutate a scene node's live position" {
  let object = @three.Object3D()
  object.position().set(2, 4, 6) |> ignore
  let origin = object.position()
  let next = origin + @three.Vector3(2, 0, -2).scaled(0.5)
  assert_true(origin.same_reference(object.position()))
  assert_true(object.position().equals(@three.Vector3(2, 4, 6)))
  assert_true(next.equals(@three.Vector3(3, 4, 5)))
  object.position().copy(next) |> ignore
  assert_true(origin.equals(@three.Vector3(3, 4, 5)))
  let mut local_position = object.position()
  local_position += @three.Vector3(1, 1, 1)
  assert_true(local_position.equals(@three.Vector3(4, 5, 6)))
  assert_false(local_position.same_reference(object.position()))
  assert_true(object.position().equals(@three.Vector3(3, 4, 5)))
}
