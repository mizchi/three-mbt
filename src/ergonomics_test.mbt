///|
test "named material parameters preserve defaults and live base properties" {
  let material = @three.MeshStandardMaterial(
    0x123456,
    roughness=0.4,
    metalness=0.2,
    flat_shading=true,
  )
  defer material.dispose()
  assert_eq(material.roughness(), 0.4)
  assert_eq(material.metalness(), 0.2)
  assert_true(material.flat_shading())
  material.set_opacity(0.5)
  assert_eq(material.as_material().opacity(), 0.5)
  let defaults = @three.MeshStandardMaterial(0xffffff)
  defer defaults.dispose()
  assert_eq(defaults.roughness(), 1.0)
  assert_eq(defaults.metalness(), 0.0)
  assert_false(defaults.flat_shading())
  let physical = @three.MeshPhysicalMaterial(0xffffff, roughness=0.3)
  defer physical.dispose()
  assert_eq(physical.roughness(), 0.3)
}

///|
test "inherited operations preserve identity, aliasing, and mutation returns" {
  let geometry = @three.BoxGeometry(1, 1, 1)
  defer geometry.dispose()
  assert_true(
    geometry.scale(2, 3, 4).same_reference(geometry.as_buffer_geometry()),
  )
  let material = @three.MeshStandardMaterial(0xffffff)
  defer material.dispose()
  let mesh = @three.Mesh(geometry.as_buffer_geometry(), material.as_material())
  assert_true(mesh.position().same_reference(mesh.as_object3d().position()))
  mesh.position().set(1, 2, 3) |> ignore
  assert_eq(mesh.as_object3d().position().x(), 1.0)
  assert_true(mesh.rotate_y(0.5).same_reference(mesh.as_object3d()))
  let group = @three.Group()
  assert_true(group.add(mesh.as_object3d()).same_reference(group.as_object3d()))
  assert_true(group.children()[0].same_reference(mesh.as_object3d()))
  let copy = mesh.position().clone()
  copy.set_x(99) |> ignore
  assert_eq(mesh.position().x(), 1.0)
}

///|
test "curve optional targets allocate per call and explicit targets are reused" {
  let curve = @three.CatmullRomCurve3(
    [@three.Vector3(0, 0, 0), @three.Vector3(1, 0, 0), @three.Vector3(2, 0, 0)],
    closed=false,
    curve_type=@three.Centripetal,
    tension=0.5,
  )
  let a = curve.get_point(0.5)
  let b = curve.get_point(0.5)
  assert_true(a.equals(b))
  assert_false(a.same_reference(b))
  let target = @three.Vector3(9, 9, 9)
  assert_true(curve.get_point(0.5, target~).same_reference(target))
  assert_true(target.equals(a))
  assert_true(curve.get_tangent(0.5, target~).same_reference(target))
  let line = @three.LineCurve(@three.Vector2(0, 0), @three.Vector2(2, 0))
  assert_eq(line.get_point_at(0.5).x(), 1.0)
}

///|
test "named loft options preserve the existing defaults and independent state" {
  let defaults = @three.LoftOptions()
  let capped = @three.LoftOptions(cap_start=true, cap_end=true)
  assert_true(defaults.closed())
  assert_false(defaults.cap_start())
  assert_false(defaults.cap_end())
  assert_true(capped.closed())
  assert_true(capped.cap_start())
  assert_true(capped.cap_end())
  capped.set_closed(false)
  assert_true(defaults.closed())
}
