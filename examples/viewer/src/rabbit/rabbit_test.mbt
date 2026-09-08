///|
test "rabbit has folded tall ears, a white visor, and geometric code marks" {
  let rabbit = @rabbit.create()
  defer @parts.dispose(rabbit)
  let head = rabbit.get_object_by_name("rabbit-head").unwrap()
  let head_bounds = @three.Box3().set_from_object(head)
  for name in ["rabbit-ear-left", "rabbit-ear-right"] {
    let bounds = @three.Box3().set_from_object(
      rabbit.get_object_by_name(name).unwrap(),
    )
    assert_true(bounds.max().y() > head_bounds.max().y() + 1)
  }
  let visor = rabbit.get_object_by_name("visor").unwrap().as_mesh().unwrap()
  assert_eq(
    visor.materials()[0].as_standard_material().unwrap().color().get_hex(),
    0xffffff,
  )
  for name in ["glyph-zero", "glyph-one", "glyph-code-left", "glyph-code-right"] {
    assert_true(rabbit.get_object_by_name(name) is Some(_))
  }
  let mut triangles = 0
  rabbit.traverse(fn(object) {
    if object.as_mesh() is Some(mesh) {
      let geometry = mesh.geometry()
      let position = geometry.get_attribute("position").unwrap()
      if geometry.get_index() is Some(index) {
        triangles += index.count() / 3
      } else {
        triangles += position.count() / 3
      }
    }
  })
  assert_true(triangles > 300 && triangles < 3000)
}
