///|
test "UserData provides typed live access and preserves JSON values" {
  let object = @three.Object3D()
  let data = object.user_data()
  data.set_string("name", "model")
  data.set_int("zero", 0)
  data.set_bool("enabled", false)
  data.set_double("weight", 0.5)
  assert_eq(object.user_data().get_string("name"), Some("model"))
  assert_eq(data.get_int("zero"), Some(0))
  assert_eq(data.get_bool("enabled"), Some(false))
  assert_true(data.get_int("weight") is None)
  assert_true(data.get_string("toString") is None)
  assert_true(data.get_string("zero") is None)
  let json : Json = { "nested": [1, true, null] }
  data.set_json("metadata", json)
  assert_eq(data.get_json("metadata"), Some(json))
  let child = @three.UserData()
  child.set_string("author", "three-mbt")
  data.set_object("details", child)
  assert_eq(
    data.get_object("details").unwrap().get_string("author"),
    Some("three-mbt"),
  )
  data.set_string("__proto__", "safe")
  assert_eq(data.get_string("__proto__"), Some("safe"))
  assert_true(data.remove("__proto__"))
  assert_false(data.remove("__proto__"))
  assert_true(data.has("metadata"))
  let clone = object.clone().user_data()
  clone.set_string("name", "copy")
  assert_eq(data.get_string("name"), Some("model"))
}

///|
#module("node:fs")
extern "js" fn read_extras_fixture(path : String) -> Bytes = "readFileSync"

///|
async test "glTF extras are available as typed UserData" {
  let gltf = @three.GLTFLoader().parse_glb(
    read_extras_fixture("tests/fixtures/morph.glb"),
  )
  let data = gltf.scene().unwrap().as_object3d().children()[0].user_data()
  assert_eq(data.get_string("category"), Some("face"))
  assert_eq(data.get_bool("selectable"), Some(false))
  assert_eq(data.get_int("priority"), Some(0))
  assert_eq(
    data.get_object("metadata").unwrap().get_string("author"),
    Some("three-mbt"),
  )
  assert_eq(gltf.asset().get_string("version"), Some("2.0"))
}

///|
test "Subscriptions detach the exact listener and unsubscribe is idempotent" {
  let root = @three.Object3D()
  let child = @three.Object3D()
  let added = Ref(0)
  let removed = Ref(0)
  let first = child.on_added(fn() { added.val += 1 })
  let second = child.on_added(fn() { added.val += 10 })
  let detach = child.on_removed(fn() { removed.val += 1 })
  root.add(child) |> ignore
  assert_eq(added.val, 11)
  first.unsubscribe()
  first.unsubscribe()
  root.remove(child).add(child) |> ignore
  assert_eq(added.val, 21)
  assert_eq(removed.val, 1)
  second.unsubscribe()
  detach.unsubscribe()
  root.remove(child).add(child) |> ignore
  assert_eq(added.val, 21)
  assert_eq(removed.val, 1)
}

///|
test "Animation finished and loop events expose action and direction" {
  let object = @three.Object3D()
  let clip = @three.AnimationClip("move", 1, [
    @three.NumberKeyframeTrack(".position[x]", [0, 1], [0, 1]).as_keyframe_track(),
  ])
  let mixer = @three.AnimationMixer(object)
  let action = mixer.clip_action(clip).set_loop(LoopOnce, 1).play()
  let events : Array[Int] = []
  let finished = mixer.on_finished(fn(event_action, direction) {
    event_action.set_paused(true)
    events.push(direction)
  })
  mixer.update(1.1) |> ignore
  assert_eq(events, [1])
  assert_true(action.paused())
  finished.unsubscribe()
  action.reset().set_loop(LoopRepeat, 3).play() |> ignore
  let loop_events : Array[Int] = []
  let loop_listener = mixer.on_loop(fn(_action, count) {
    loop_events.push(count)
  })
  mixer.update(1.1) |> ignore
  assert_eq(loop_events, [1])
  loop_listener.unsubscribe()
  mixer.update(1) |> ignore
  assert_eq(loop_events, [1])
  mixer.stop_all_action() |> ignore
  mixer.uncache_root(object)
}

///|
test "Layers and disposal events integrate with existing objects" {
  let first = @three.Object3D().layers()
  let second = @three.Object3D().layers()
  first.set(3)
  assert_false(first.intersects(second))
  second.enable(3)
  assert_true(first.intersects(second))
  first.enable(31)
  assert_true(first.is_enabled(31))
  first.disable_all()
  assert_eq(first.mask(), 0U)
  let texture = @three.Texture()
  let count = Ref(0)
  let subscription = texture.on_dispose(fn() { count.val += 1 })
  texture.dispose()
  assert_eq(count.val, 1)
  subscription.unsubscribe()
  texture.dispose()
  assert_eq(count.val, 1)
}
