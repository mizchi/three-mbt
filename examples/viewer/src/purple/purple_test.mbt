///|
test "purple character has a volumetric continuous body and a geometric smile" {
  let model = @purple.create()
  defer @parts.dispose(model)
  let body = model.get_object_by_name("purple-body").unwrap()
  let bounds = @three.Box3().set_from_object(body)
  assert_true(bounds.min().y() >= -0.03)
  assert_true(bounds.max().y() > 3.5)
  assert_true(bounds.max().x() - bounds.min().x() > 2.5)
  assert_true(bounds.max().z() - bounds.min().z() > 0.9)
  for name in ["smile-patch", "smile-mouth", "eye-left", "eye-right", "nose"] {
    assert_true(model.get_object_by_name(name) is Some(_))
  }
  let mesh = body.as_mesh().unwrap()
  assert_eq(
    mesh.materials()[0].as_standard_material().unwrap().color().get_hex(),
    0xa43af0,
  )
  let positions = mesh.geometry().get_attribute("position").unwrap()
  let normals = mesh.geometry().get_attribute("normal").unwrap()
  assert_true(positions.count() > 1000)
  assert_eq(normals.count(), positions.count())
  for i in 0..<normals.count() {
    let length = @three.Vector3(
      normals.get_x(i),
      normals.get_y(i),
      normals.get_z(i),
    ).length()
    assert_true(length > 0.9 && length < 1.1)
  }
}
