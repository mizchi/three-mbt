///|
test "Relative morphs change vertex positions and snapshots do not mutate weights" {
  let geometry = @three.BufferGeometry()
  geometry.set_attribute(
    "position",
    @three.BufferAttribute::from_floats([0, 0, 0], 3),
  )
  |> ignore
  let delta = @three.BufferAttribute::from_floats([2, 0, 0], 3)
  delta.set_name("Smile")
  geometry.set_morph_attributes("position", [delta])
  geometry.set_morph_targets_relative(true)
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let mesh = @three.Mesh(geometry, material)
  assert_eq(mesh.morph_target_names().length(), 1)
  assert_eq(mesh.morph_target_index("Smile"), Some(0))
  assert_true(mesh.set_morph_weight("Smile", 0.75))
  let target = @three.Vector3(0, 0, 0)
  assert_true(mesh.get_vertex_position(0, target).same_reference(target))
  assert_eq(target.x(), 1.5)
  let weights = mesh.morph_target_influences()
  weights[0] = 0
  assert_eq(mesh.morph_influence(0), Some(0.75))
  assert_true(mesh.set_morph_influence(0, -0.5))
  assert_eq(mesh.get_vertex_position(0, target).x(), -1)
  assert_false(mesh.set_morph_influence(-1, 1))
  assert_false(mesh.set_morph_influence(1, 1))
  assert_false(mesh.set_morph_weight("missing", 1))
  assert_true(mesh.morph_target_index("toString") is None)
  mesh.update_morph_targets()
  assert_eq(mesh.morph_influence(0), Some(0))
  assert_eq(geometry.morph_attributes("position").length(), 1)
  assert_eq(geometry.morph_attributes("normal").length(), 0)
  geometry.dispose()
  material.dispose()
}

///|
test "Meshes without morphs have empty snapshots and optional lookup" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let mesh = @three.Mesh(geometry, material)
  assert_eq(mesh.morph_target_influences().length(), 0)
  assert_true(mesh.morph_influence(0) is None)
  assert_false(mesh.set_morph_weight("Smile", 1))
  geometry.dispose()
  material.dispose()
}

///|
#module("node:fs")
extern "js" fn read_morph_fixture(path : String) -> Bytes = "readFileSync"

///|
async test "GLB morph target names and initial weights survive loading" {
  let model = @three.GLTFLoader().parse_glb(
    read_morph_fixture("tests/fixtures/morph.glb"),
  )
  let mesh = model.scene().unwrap().as_object3d().children()[0]
    .as_mesh()
    .unwrap()
  assert_eq(mesh.morph_target_index("Smile"), Some(0))
  assert_eq(mesh.morph_influence(0), Some(0.25))
  assert_true(mesh.set_morph_weight("Smile", 1))
  assert_eq(mesh.get_vertex_position(0, @three.Vector3(0, 0, 0)).x(), 1)
}
