///|
test "Bezier curves sample endpoints and arc lengths with typed vectors" {
  let curve = @three.QuadraticBezierCurve(
    @three.Vector2(0, 0),
    @three.Vector2(1, 2),
    @three.Vector2(2, 0),
  ).as_curve2()
  let middle = curve.get_point(0.5, @three.Vector2(0, 0))
  assert_eq(middle.x(), 1)
  assert_eq(middle.y(), 1)
  assert_eq(curve.get_points(4).length(), 5)
  assert_true(curve.get_length() > 2)
  let path = @three.CatmullRomCurve3(
    [@three.Vector3(0, 0, 0), @three.Vector3(0, 0, 2), @three.Vector3(2, 0, 2)],
    false,
    Centripetal,
    0.5,
  ).as_curve3()
  assert_true(
    path.get_point(1, @three.Vector3(0, 0, 0)).equals(@three.Vector3(2, 0, 2)),
  )
  let tube = @three.TubeGeometry(path, 16, 0.1, 8, false).as_buffer_geometry()
  assert_eq(tube.get_attribute("position").unwrap().count(), 17 * 9)
}

///|
test "Shapes with holes triangulate and extrude with typed options" {
  let shape = @three.Shape()
  shape
  .as_path()
  .move_to(0, 0)
  .line_to(4, 0)
  .line_to(4, 4)
  .line_to(0, 4)
  .close_path()
  |> ignore
  let hole = @three.Path()
  hole.move_to(1, 1).line_to(1, 3).line_to(3, 3).line_to(3, 1).close_path()
  |> ignore
  shape.set_holes([hole])
  let flat = @three.ShapeGeometry([shape], 12).as_buffer_geometry()
  let position = flat.get_attribute("position").unwrap()
  let index = flat.get_index().unwrap()
  let mut area = 0.0
  for i in 0..<(index.count() / 3) {
    let a = index.get_x(i * 3).to_int()
    let b = index.get_x(i * 3 + 1).to_int()
    let c = index.get_x(i * 3 + 2).to_int()
    area += ((position.get_x(b) - position.get_x(a)) *
      (position.get_y(c) - position.get_y(a)) -
      (position.get_y(b) - position.get_y(a)) *
      (position.get_x(c) - position.get_x(a))).abs() /
      2
  }
  assert_eq(area, 12)
  let options = @three.ExtrudeOptions()
  options.set_depth(3)
  options.set_bevel_enabled(false)
  options.set_extrude_path(None)
  let solid = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
  solid.compute_bounding_box()
  assert_eq(solid.bounding_box().unwrap().max().z(), 3)
  assert_eq(solid.groups().length(), 2)
  let lathe = @three.LatheGeometry(
    [@three.Vector2(1, 0), @three.Vector2(1, 2)],
    8,
    0,
    6.283185307179586,
  ).as_buffer_geometry()
  lathe.compute_bounding_box()
  assert_eq(lathe.bounding_box().unwrap().max().y(), 2)
}
