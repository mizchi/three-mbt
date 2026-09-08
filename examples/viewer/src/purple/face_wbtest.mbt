///|
test "facial surfaces stay above the curved skin between boundary vertices" {
  let model = create()
  defer @parts.dispose(model)
  let face = model
    .get_object_by_name("smile-patch")
    .unwrap()
    .as_mesh()
    .unwrap()
    .geometry()
  let positions = face.get_attribute("position").unwrap()
  let normals = face.get_attribute("normal").unwrap()
  for i = 0; i < positions.count(); i = i + 3 {
    if normals.get_z(i) < 0.5 {
      continue
    }
    let x = (
        positions.get_x(i) + positions.get_x(i + 1) + positions.get_x(i + 2)
      ) /
      3
    let y = (
        positions.get_y(i) + positions.get_y(i + 1) + positions.get_y(i + 2)
      ) /
      3
    let z = (
        positions.get_z(i) + positions.get_z(i + 1) + positions.get_z(i + 2)
      ) /
      3
    assert_true(z > face_depth(x, y) + 0.006)
  }
}
