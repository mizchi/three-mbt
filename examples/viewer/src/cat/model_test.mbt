///|
test "declarative cat has a low-poly silhouette and independently named features" {
  let container = @three.Group().as_object3d()
  let root = @lt.mount(container, @cat.view())
  assert_true(root.error() is None)
  for
    name in [
      "cat", "cat-body", "cat-head", "ear-left", "ear-right", "eye-left", "eye-right",
      "nose", "muzzle-left", "muzzle-right", "paw-front-left", "paw-front-right",
      "paw-back-left", "paw-back-right", "cat-tail", "tail-tip", "whisker-left-0",
      "whisker-right-2",
    ] {
    assert_true(container.get_object_by_name(name) is Some(_), msg=name)
  }
  let triangles = Ref(0)
  container.traverse(fn(object) {
    if object.as_mesh() is Some(mesh) {
      let geometry = mesh.geometry()
      triangles.val += match geometry.get_index() {
        Some(index) => index.count() / 3
        None => geometry.get_attribute("position").unwrap().count() / 3
      }
    }
  })
  assert_true(triangles.val > 500 && triangles.val < 2000)
  root.unmount()
  assert_eq(container.children().length(), 0)
}

///|
test "cat pose and coat react without rebuilding mesh resources" {
  let tilt = @reactivity.signal(0.0)
  let palette = @reactivity.signal(0)
  let container = @three.Group().as_object3d()
  let root = @lt.mount(
    container,
    @cat.view(head_tilt=fn() { tilt.get() }, palette=fn() { palette.get() }),
  )
  let head = container.get_object_by_name("cat-head").unwrap()
  let body = container
    .get_object_by_name("cat-body")
    .unwrap()
    .as_mesh()
    .unwrap()
  let geometry = body.geometry().id()
  let material = body.materials()[0]
  let color = material.as_standard_material().unwrap().color().get_hex()
  tilt.set(0.2)
  palette.set(1)
  assert_eq(head.rotation().z(), 0.2)
  assert_eq(body.geometry().id(), geometry)
  assert_eq(body.materials()[0].id(), material.id())
  assert_true(
    material.as_standard_material().unwrap().color().get_hex() != color,
  )
  root.unmount()
  tilt.set(0.4)
  assert_eq(head.rotation().z(), 0.2)
}
