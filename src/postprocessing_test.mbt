///|
test "Postprocessing passes preserve selection references and expose controls" {
  let scene = @three.Scene()
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  let outline = @three.OutlinePass(
    @three.Vector2(32, 32),
    scene,
    camera.as_camera(),
  )
  let object = @three.Object3D()
  outline.set_selected_objects([object])
  let snapshot = outline.selected_objects()
  snapshot[0] = @three.Object3D()
  assert_true(outline.selected_objects()[0].same_reference(object))
  outline.set_edge_strength(5)
  outline.visible_edge_color().set_rgb(1, 0, 0) |> ignore
  assert_eq(outline.edge_strength(), 5)
  outline.as_pass().set_enabled(false)
  assert_false(outline.as_pass().enabled())
  let bloom = @three.UnrealBloomPass(@three.Vector2(32, 32), 2, 0.5, 0.8)
  assert_eq(bloom.threshold(), 0.8)
  bloom.as_pass().set_size(16, 16)
  bloom.as_pass().dispose()
  outline.as_pass().dispose()
}
