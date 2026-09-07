///|
test "Cameras project and unproject points" {
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 5) |> ignore
  camera.as_object3d().update_world_matrix(true, false)
  let point = @three.Vector3(1, 2, 0)
  let restored = point
    .clone()
    .project(camera.as_camera())
    .unproject(camera.as_camera())
  assert_true(restored.distance_to(point) < 0.000001)
  camera.set_aspect(2)
  camera.update_projection_matrix()
  assert_eq(camera.aspect(), 2)
  let ortho = @three.OrthographicCamera(-2, 2, 2, -2, 0.1, 100)
  assert_eq(ortho.left(), -2)
  assert_true(ortho.as_camera().as_object3d().as_camera() is Some(_))
}

///|
test "Geometry, materials, mesh, and bounding volumes" {
  let geometry = @three.BoxGeometry(2, 4, 6).as_buffer_geometry()
  let material = @three.MeshStandardMaterial(0xff0000, 0.25, 0.75)
  let mesh = @three.Mesh(geometry, material.as_material())
  assert_eq(mesh.geometry().get_attribute("position").unwrap().count(), 24)
  assert_eq(material.color().get_hex(), 0xff0000)
  assert_eq(material.roughness(), 0.25)
  assert_eq(material.metalness(), 0.75)
  material.as_material().set_side(DoubleSide)
  assert_eq(material.as_material().side(), @three.Side::DoubleSide)
  mesh.as_object3d().position().set(10, 0, 0) |> ignore
  let bounds = @three.Box3().set_from_object(mesh.as_object3d())
  assert_true(bounds.min().equals(@three.Vector3(9, -2, -3)))
  assert_true(bounds.max().equals(@three.Vector3(11, 2, 3)))
  assert_true(
    mesh
    .as_object3d()
    .as_mesh()
    .unwrap()
    .as_object3d()
    .same_reference(mesh.as_object3d()),
  )
  assert_true(@three.Object3D().as_mesh() is None)
  geometry.dispose()
  material.as_material().dispose()
}

///|
test "Custom attributes, indices, normals and geometry transformations" {
  let geometry = @three.BufferGeometry()
  let positions = @three.BufferAttribute::from_floats(
    [-1, -1, 0, 1, -1, 0, 0, 1, 0],
    3,
  )
  geometry.set_attribute("position", positions) |> ignore
  geometry.set_indices([0, 1, 2]) |> ignore
  geometry.compute_vertex_normals()
  assert_eq(geometry.get_attribute("normal").unwrap().get_z(0), 1)
  assert_eq(geometry.get_index().unwrap().count(), 3)
  assert_true(geometry.get_attribute("absent") is None)
  positions.set_xyz(0, -2, -2, 0) |> ignore
  positions.mark_needs_update()
  assert_eq(positions.get_x(0), -2)
  geometry.translate(1, 0, 0) |> ignore
  assert_eq(positions.get_x(0), -1)
  geometry.dispose()
}

///|
test "Raycasting returns sorted typed intersections" {
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let mesh = @three.Mesh(
    @three.BoxGeometry(2, 2, 2).as_buffer_geometry(),
    material,
  )
  mesh.as_object3d().update_world_matrix(true, false)
  let ray = @three.Raycaster(@three.Vector3(0, 0, 5), @three.Vector3(0, 0, -1))
  let hits = ray.intersect_object(mesh.as_object3d(), true)
  assert_true(hits.length() > 0)
  assert_eq(hits[0].distance(), 4)
  assert_true(hits[0].object().same_reference(mesh.as_object3d()))
  assert_true(hits[0].point().equals(@three.Vector3(0, 0, 1)))
  assert_true(hits[0].uv() is Some(_))
  mesh.geometry().dispose()
  material.dispose()
}

///|
test "Lights, shadows, fog, and texture properties" {
  let light = @three.DirectionalLight(0xffffff, 2)
  light.as_light().set_intensity(3)
  light.as_object3d().set_cast_shadow(true)
  assert_eq(light.as_light().intensity(), 3)
  assert_true(light.as_object3d().cast_shadow())
  light.shadow().map_size().set(1024, 1024) |> ignore
  assert_eq(light.shadow().map_size().x(), 1024)
  let scene = @three.Scene()
  scene.set_fog(Some(@three.Fog(0x808080, 1, 100)))
  assert_eq(scene.fog().unwrap().far(), 100)
  scene.set_fog(None)
  assert_true(scene.fog() is None)
  let texture = @three.DataTexture::from_rgba(b"\xff\x00\x00\xff", 1, 1).as_texture()
  texture.set_color_space(SRGB)
  texture.set_wrap_s(RepeatWrapping)
  texture.repeat().set(2, 3) |> ignore
  scene.set_background_texture(Some(texture))
  assert_true(scene.background() is None)
  assert_true(scene.background_texture().unwrap().same_reference(texture))
  scene.set_background(None)
  assert_true(scene.background_texture() is None)
  texture.dispose()
}
