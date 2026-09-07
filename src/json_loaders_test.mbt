///|
async test "Object JSON roundtrip preserves hierarchy, material sharing and animations" {
  let material = @three.MeshStandardMaterial(0xff0000, 0.4, 0.2).as_material()
  let geometry = @three.BoxGeometry(1, 2, 3).as_buffer_geometry()
  let root = @three.Group().as_object3d()
  root.set_name("root")
  let a = @three.Mesh(geometry, material).as_object3d()
  a.set_name("a")
  a.position().set(2, 3, 4) |> ignore
  let b = @three.Mesh(geometry, material).as_object3d()
  b.set_name("b")
  root.add(a).add(b) |> ignore
  let track = @three.NumberKeyframeTrack("a.position[x]", [0, 1], [2, 6]).as_keyframe_track()
  root.set_animations([@three.AnimationClip("move", 1, [track])])
  root.update_matrix_world(true)
  let restored = @three.ObjectLoader().parse_json(root.to_json())
  assert_eq(restored.name(), "root")
  let ra = restored.get_object_by_name("a").unwrap().as_mesh().unwrap()
  let rb = restored.get_object_by_name("b").unwrap().as_mesh().unwrap()
  assert_true(ra.materials()[0].same_reference(rb.materials()[0]))
  assert_true(ra.geometry().same_reference(rb.geometry()))
  assert_true(ra.as_object3d().position().equals(@three.Vector3(2, 3, 4)))
  assert_eq(restored.animations()[0].name(), "move")
  let mixer = @three.AnimationMixer(restored)
  mixer.clip_action(restored.animations()[0]).play() |> ignore
  mixer.update(0.5) |> ignore
  near(ra.as_object3d().position().x(), 4)
}

///|
test "Geometry and material JSON loaders reconstruct typed resources" {
  let geometry = @three.BufferGeometry()
  geometry.set_attribute(
    "position",
    @three.BufferAttribute::from_floats([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
  )
  |> ignore
  geometry.set_indices([0, 1, 2]) |> ignore
  geometry.compute_bounding_sphere()
  let restored = @three.BufferGeometryLoader().parse_json(geometry.to_json())
  assert_eq(restored.get_attribute("position").unwrap().count(), 3)
  near(restored.get_attribute("position").unwrap().get_x(1), 1)
  assert_eq(restored.get_index().unwrap().get_x(2), 2)
  let texture = @three.Texture()
  let textures = @three.TextureDictionary()
  textures.set(texture.uuid(), texture)
  let material = @three.MeshStandardMaterial(0x123456, 0.4, 0.2)
  material.set_map(Some(texture))
  let loader = @three.MaterialLoader()
  loader.set_textures(textures) |> ignore
  let copied = loader
    .parse_json(material.as_material().to_json())
    .as_standard_material()
    .unwrap()
  assert_eq(copied.color().get_hex(), 0x123456)
  near(copied.roughness(), 0.4)
  assert_true(copied.map().unwrap().same_reference(texture))
  assert_true(textures.get("missing") is None)
}

///|
test "Animation JSON preserves string tracks and typed errors report invalid input" {
  let track = @three.StringKeyframeTrack(".name", [0, 1], ["before", "after"]).as_keyframe_track()
  let clip = @three.AnimationClip("labels", 2, [track])
  let clips = @three.AnimationLoader().parse_json(Json::array([clip.to_json()]))
  assert_eq(clips[0].name(), "labels")
  assert_true(clips[0].tracks()[0].number_values() is None)
  try @three.MaterialLoader().parse_json_string("{invalid") catch {
    @three.LoadError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("invalid JSON should fail")
  }
  try @three.BufferGeometryLoader().parse_json_string("{}") catch {
    @three.LoadError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("invalid geometry should fail")
  }
  let root = @three.Object3D()
  root.user_data().set_object("cycle", root.user_data())
  try root.to_json() catch {
    @three.SerializationError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("circular user data should fail")
  }
}

///|
test "Loader configuration and manager handler ownership are typed" {
  let manager = @three.LoadingManager()
  let loader = @three.ObjectLoader().as_loader()
  loader.set_manager(manager)
  loader.set_path("/models/").set_resource_path("/images/") |> ignore
  let headers = @three.RequestHeaders()
  headers.set("X-Asset-Version", "test")
  loader.set_request_header(headers) |> ignore
  assert_eq(loader.path(), "/models/")
  assert_eq(loader.request_header().get("X-Asset-Version").unwrap(), "test")
  let handler = manager.add_handler("[.]json$", "i", loader)
  assert_true(manager.get_handler("model.JSON").unwrap().same_reference(loader))
  handler.remove()
  handler.remove()
  assert_true(manager.get_handler("model.JSON") is None)
  try manager.add_handler("[", "", loader) catch {
    @three.LoadError(_) => ()
  } noraise {
    _ => fail("invalid regex should fail")
  }
  let mut loaded = 0
  manager.set_on_load(fn() { loaded += 1 })
  manager.item_start("test")
  manager.item_end("test")
  assert_eq(loaded, 1)
}
