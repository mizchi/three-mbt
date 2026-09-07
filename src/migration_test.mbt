///|
test "instance expansion and triangle interpolation preserve editable values" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let instances = @three.InstancedMesh(geometry, material, 2)
  instances.set_matrix_at(1, @three.Matrix4().make_translation(3, 0, 0))
  let parts = @three.SceneUtils().meshes_from_instances(instances)
  assert_eq(parts.as_object3d().children().length(), 2)
  near(parts.as_object3d().children()[1].position().x(), 3)
  let triangle = @three.Triangle(
    @three.Vector3(0, 0, 0),
    @three.Vector3(1, 0, 0),
    @three.Vector3(0, 1, 0),
  )
  let uv = triangle
    .interpolate_vector2(
      @three.Vector3(0.25, 0.25, 0),
      @three.Vector2(0, 0),
      @three.Vector2(1, 0),
      @three.Vector2(0, 1),
      @three.Vector2(0, 0),
    )
    .unwrap()
  near(uv.x(), 0.25)
  near(uv.y(), 0.25)
}

///|
test "uniform groups and layered render targets retain their typed resources" {
  let value = @three.Uniform(0.5)
  let group = @three.UniformsGroup().set_name("Settings").add(value)
  value.set_float(0.75)
  near(group.uniforms()[0].float_value().unwrap(), 0.75)
  let target = @three.WebGLArrayRenderTarget(4, 4, 3)
  assert_eq(target.depth(), 3)
  assert_eq(target.texture().depth(), 3)
  target.set_size(2, 2, 4)
  assert_eq(target.texture().depth(), 4)
  target.as_render_target().dispose()
  group.dispose()
}

///|
test "glTF registrations remove only their own callback" {
  let loader = @three.GLTFLoader()
  let registration = loader.register(fn(_parser) {
    @three.GLTFLoaderPlugin("EXT_test")
  })
  assert_true(registration.active())
  loader.unregister(registration)
  assert_true(!registration.active())
  registration.unregister()
}
