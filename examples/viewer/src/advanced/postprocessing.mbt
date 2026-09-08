///|
pub fn render_effects() -> FixedArray[Int] {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  renderer.set_size(32, 32)
  let scene = @three.Scene()
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 3) |> ignore
  let geometry = @three.PlaneGeometry(0.5, 0.5).as_buffer_geometry()
  let material = @three.MeshBasicMaterial(0xff0000)
  material.color().set_rgb(4, 0, 0) |> ignore
  defer geometry.dispose()
  defer material.as_material().dispose()
  let object = @three.Mesh(geometry, material.as_material()).as_object3d()
  scene.as_object3d().add(object) |> ignore
  let composer = @three.EffectComposer::with_render_target(
    renderer,
    @three.WebGLRenderTarget(32, 32),
  )
  defer composer.dispose()
  composer.set_render_to_screen(false)
  let render = @three.RenderPass(scene, camera.as_camera()).as_pass()
  let bloom = @three.UnrealBloomPass(@three.Vector2(32, 32), 4, 0.5, 0)
  let outline = @three.OutlinePass(
    @three.Vector2(32, 32),
    scene,
    camera.as_camera(),
  )
  outline.set_selected_objects([object])
  outline.visible_edge_color().set_rgb(0, 1, 0) |> ignore
  outline.set_edge_strength(5)
  let output = @three.OutputPass().as_pass()
  defer render.dispose()
  defer bloom.as_pass().dispose()
  defer outline.as_pass().dispose()
  defer output.dispose()
  composer.add_pass(render)
  composer.add_pass(bloom.as_pass())
  composer.add_pass(outline.as_pass())
  composer.add_pass(output)
  bloom.as_pass().set_enabled(false)
  outline.as_pass().set_enabled(false)
  composer.render(0)
  let plain = Bytes::new(4)
  renderer.read_render_target_pixels(
    composer.read_buffer(),
    21,
    16,
    1,
    1,
    plain,
  )
  bloom.as_pass().set_enabled(true)
  composer.render(0)
  let glow = Bytes::new(4)
  renderer.read_render_target_pixels(composer.read_buffer(), 21, 16, 1, 1, glow)
  outline.as_pass().set_enabled(true)
  composer.render(0)
  let pixels = Bytes::new(32 * 32 * 4)
  renderer.read_render_target_pixels(
    composer.read_buffer(),
    0,
    0,
    32,
    32,
    pixels,
  )
  let mut green = 0
  for i in 0..<1024 {
    green = green + pixels[i * 4 + 1].to_int()
  }
  composer.remove_pass(outline.as_pass())
  [plain[0].to_int(), glow[0].to_int(), green, composer.passes().length()]
}
