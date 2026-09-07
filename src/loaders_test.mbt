///|
#module("node:fs")
extern "js" fn read_fixture(path : String) -> Bytes = "readFileSync"

///|
async test "GLB parsing exposes meshes, materials, cameras, and animation" {
  let loader = @three.GLTFLoader()
  let gltf = loader.parse_glb(read_fixture("tests/fixtures/triangle.glb"))
  let root = gltf.scene().unwrap().as_object3d()
  assert_eq(gltf.scenes().length(), 1)
  assert_eq(gltf.cameras().length(), 1)
  let mesh = root.get_object_by_name("Triangle").unwrap().as_mesh().unwrap()
  assert_eq(mesh.geometry().get_attribute("position").unwrap().count(), 3)
  assert_eq(mesh.materials().length(), 1)
  assert_eq(
    mesh.materials()[0].as_standard_material().unwrap().color().get_hex(),
    0xff0000,
  )
  let clips = gltf.animations()
  assert_eq(clips.length(), 1)
  assert_eq(clips[0].name(), "Move")
  let mixer = @three.AnimationMixer(root)
  let action = mixer.clip_action(clips[0]).play()
  assert_true(action.is_running())
  mixer.update(0.5) |> ignore
  assert_true((mesh.as_object3d().position().x() - 1).abs() < 0.000001)
  mixer.stop_all_action() |> ignore
  mixer.uncache_root(root)
}

///|
async test "Malformed GLB and glTF reject through a typed error" {
  let loader = @three.GLTFLoader()
  try loader.parse_glb(b"invalid") catch {
    @three.LoadError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("expected invalid GLB to fail")
  }
  try loader.parse_gltf("{invalid") catch {
    @three.LoadError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("expected invalid JSON to fail")
  }
  try loader.parse_gltf("{\"asset\":{\"version\":\"1.0\"}}") catch {
    @three.LoadError(message) =>
      assert_true(message.contains("Unsupported asset"))
  } noraise {
    _ => fail("expected glTF 1.0 to fail")
  }
}

///|
async test "Inline glTF works without binary buffers" {
  let gltf = @three.GLTFLoader().parse_gltf(
    (
      #| {"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"name":"Empty"}]}
    ),
  )
  assert_eq(gltf.scene().unwrap().as_object3d().children()[0].name(), "Empty")
  assert_eq(gltf.animations().length(), 0)
}

///|
async test "Valid glTF without a scene returns None" {
  let gltf = @three.GLTFLoader().parse_gltf("{\"asset\":{\"version\":\"2.0\"}}")
  assert_true(gltf.scene() is None)
  assert_eq(gltf.scenes().length(), 0)
}
