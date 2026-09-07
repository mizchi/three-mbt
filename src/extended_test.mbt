///|
test "Normal matrices, planes, rays, and frustums" {
  let normal = @three.Matrix3().get_normal_matrix(
    @three.Matrix4().make_scale(2, 4, 8),
  )
  let value = @three.Vector3(2, 4, 8).apply_matrix3(normal)
  assert_true(value.equals(@three.Vector3(1, 1, 1)))
  let plane = @three.Plane(@three.Vector3(0, 0, 1), 0)
  let ray = @three.Ray(@three.Vector3(0, 0, 5), @three.Vector3(0, 0, -1))
  let hit = ray.intersect_plane(plane, @three.Vector3(0, 0, 0)).unwrap()
  assert_true(hit.equals(@three.Vector3(0, 0, 0)))
  ray.set(@three.Vector3(0, 0, 5), @three.Vector3(0, 0, 1)) |> ignore
  assert_true(ray.intersect_plane(plane, hit) is None)
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  let frustum = @three.Frustum().set_from_projection_matrix(
    camera.as_camera().projection_matrix(),
  )
  assert_true(frustum.contains_point(@three.Vector3(0, 0, -2)))
  assert_false(frustum.contains_point(@three.Vector3(0, 0, 2)))
}

///|
test "Shader uniforms preserve typed values and distinguish missing keys" {
  let uniforms = @three.Uniforms()
  uniforms.set_float("time", 1.5)
  uniforms.set_color("tint", @three.Color::from_hex(0xff0000))
  uniforms.set_float("large", 2147483648)
  uniforms.set_int("zero", 0)
  uniforms.set_bool("disabled", false)
  assert_true(uniforms.get_int("large") is None)
  assert_eq(uniforms.get_int("zero"), Some(0))
  assert_eq(uniforms.get_bool("disabled"), Some(false))
  assert_eq(uniforms.get_float("time"), Some(1.5))
  assert_true(uniforms.get_float("absent") is None)
  assert_true(uniforms.get_float("tint") is None)
  assert_eq(uniforms.get_color("tint").unwrap().get_hex(), 0xff0000)
  let shader = @three.ShaderMaterial(
    "void main() {}", "void main() {}", uniforms,
  )
  uniforms.set_float("time", 2)
  assert_eq(shader.uniforms().get_float("time"), Some(2))
  shader.as_material().dispose()
}

///|
test "Instancing, skinning and user-authored keyframes" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let mesh = @three.InstancedMesh(geometry, material, 2)
  mesh.set_matrix_at(1, @three.Matrix4().make_translation(3, 0, 0))
  mesh.mark_needs_update()
  let matrix = @three.Matrix4()
  mesh.get_matrix_at(1, matrix)
  assert_eq(matrix.elements()[12], 3)
  let bone = @three.Bone()
  bone.as_object3d().set_name("root")
  let skeleton = @three.Skeleton([bone])
  assert_eq(
    skeleton.get_bone_by_name("root").unwrap().as_object3d().name(),
    "root",
  )
  assert_true(skeleton.get_bone_by_name("absent") is None)
  skeleton.dispose()
  let track = @three.NumberKeyframeTrack(".position[x]", [0, 1], [0, 10])
  let clip = @three.AnimationClip("move", 1, [track.as_keyframe_track()])
  assert_true(clip.validate())
  let node = @three.Object3D()
  let mixer = @three.AnimationMixer(node)
  mixer.clip_action(clip).set_loop(LoopOnce, 1).play() |> ignore
  mixer.update(0.5) |> ignore
  assert_eq(node.position().x(), 5)
  mixer.stop_all_action() |> ignore
  mixer.uncache_root(node)
  mesh.dispose()
  geometry.dispose()
  material.dispose()
}

///|
test "Loading manager and compressed model decoder configuration" {
  let manager = @three.LoadingManager()
  manager.set_on_load(fn() {  })
  manager.set_on_progress(fn(_url, _loaded, _total) {  })
  manager.set_on_error(fn(_url) {  })
  manager.set_url_modifier(fn(url) { url }) |> ignore
  let loader = @three.GLTFLoader::with_manager(manager)
  let draco = @three.DRACOLoader()
    .set_decoder_path("/draco/")
    .set_worker_limit(2)
  loader.set_draco_loader(draco).enable_meshopt() |> ignore
  draco.dispose() |> ignore
}
