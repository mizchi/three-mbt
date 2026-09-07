///|
#module("node:fs")
extern "js" fn read_skin_fixture(path : String) -> Bytes = "readFileSync"

///|
async test "SkeletonUtils clone remaps loaded bones and animates instances independently" {
  let gltf = @three.GLTFLoader().parse_glb(
    read_skin_fixture("tests/fixtures/skinned.glb"),
  )
  let original = gltf.scene().unwrap().as_object3d()
  let copy = @three.clone_skinned(original)
  let original_mesh = original
    .get_object_by_name("Character")
    .unwrap()
    .as_skinned_mesh()
    .unwrap()
  let copy_mesh = copy
    .get_object_by_name("Character")
    .unwrap()
    .as_skinned_mesh()
    .unwrap()
  let original_bone = original_mesh.skeleton().unwrap().bones()[0].as_object3d()
  let copy_bone = copy_mesh.skeleton().unwrap().bones()[0].as_object3d()
  assert_false(copy_bone.same_reference(original_bone))
  assert_true(
    copy_bone.same_reference(copy.get_object_by_name("Joint").unwrap()),
  )
  assert_true(
    copy_mesh
    .as_mesh()
    .geometry()
    .same_reference(original_mesh.as_mesh().geometry()),
  )
  assert_true(
    copy_mesh.as_mesh().materials()[0].same_reference(
      original_mesh.as_mesh().materials()[0],
    ),
  )
  let first = @three.AnimationMixer(original)
  let second = @three.AnimationMixer(copy)
  first.clip_action(gltf.animations()[0]).play() |> ignore
  second.clip_action(gltf.animations()[0]).play() |> ignore
  first.update(0.25) |> ignore
  second.update(0.75) |> ignore
  original.update_matrix_world(true)
  copy.update_matrix_world(true)
  assert_eq(original_bone.position().x(), 0.5)
  assert_eq(copy_bone.position().x(), 1.5)
  assert_eq(
    original_mesh.as_mesh().get_vertex_position(0, @three.Vector3(0, 0, 0)).x(),
    -0.5,
  )
  assert_eq(
    copy_mesh.as_mesh().get_vertex_position(0, @three.Vector3(0, 0, 0)).x(),
    0.5,
  )
  first.stop_all_action() |> ignore
  second.stop_all_action() |> ignore
  first.uncache_root(original)
  second.uncache_root(copy)
  original_mesh.skeleton().unwrap().dispose()
  copy_mesh.skeleton().unwrap().dispose()
  original_mesh.as_mesh().geometry().dispose()
  original_mesh.as_mesh().materials()[0].dispose()
}
