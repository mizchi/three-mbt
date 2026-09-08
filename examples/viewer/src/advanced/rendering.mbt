///|
pub fn render_regions() -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(16, 16)
    let target = @three.WebGLRenderTarget(16, 16)
    target.set_samples(4)
    defer target.dispose()
    let scene = @three.Scene()
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    let geometry = @three.PlaneGeometry(4, 4).as_buffer_geometry()
    let material = @three.MeshBasicMaterial(0xff0000).as_material()
    defer geometry.dispose()
    defer material.dispose()
    scene.as_object3d().add(@three.Mesh(geometry, material).as_object3d())
    |> ignore
    renderer.compile_async(scene, camera.as_camera())
    renderer.set_render_target(Some(target))
    renderer.set_clear_color(@three.Color::from_hex(0), 1)
    renderer.clear(true, true, true)
    renderer.set_viewport(0, 0, 16, 16)
    renderer.set_scissor(0, 0, 8, 16)
    renderer.set_scissor_test(true)
    renderer.render(scene, camera.as_camera())
    renderer.set_render_target(None)
    let left = Bytes::new(4)
    let right = Bytes::new(4)
    renderer.read_render_target_pixels_async(target, 4, 8, 1, 1, left)
    renderer.read_render_target_pixels_async(target, 12, 8, 1, 1, right)
    let failed = try {
      renderer.read_render_target_pixels_async(target, 20, 0, 1, 1, right)
      0
    } catch {
      @three.RenderError(_) => 1
    }
    [
      left[0].to_int(),
      right[0].to_int(),
      renderer.info().calls(),
      renderer.info().triangles(),
      renderer.capabilities().max_texture_size(),
      failed,
    ]
  })
}

///|
pub fn render_dynamic() -> FixedArray[Int] {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  renderer.set_size(16, 16)
  let target = @three.WebGLRenderTarget(16, 16)
  defer target.dispose()
  renderer.set_render_target(Some(target))
  let position = @three.BufferAttribute::from_floats(
    [-1, -1, 0, 1, -1, 0, 0, 1, 0],
    3,
  )
  position.set_usage(DynamicDraw) |> ignore
  let geometry = @three.BufferGeometry().set_attribute("position", position)
  let material = @three.MeshBasicMaterial(0xff0000).as_material()
  defer geometry.dispose()
  defer material.dispose()
  let scene = @three.Scene()
  scene.as_object3d().add(@three.Mesh(geometry, material).as_object3d())
  |> ignore
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 3) |> ignore
  renderer.render(scene, camera.as_camera())
  let before = Bytes::new(4)
  renderer.read_render_target_pixels(target, 8, 8, 1, 1, before)
  for i in 0..<3 {
    position.set_component(i, 0, position.get_x(i) + 10) |> ignore
  }
  position.add_update_range(0, 9)
  position.mark_needs_update()
  renderer.render(scene, camera.as_camera())
  let after = Bytes::new(4)
  renderer.read_render_target_pixels(target, 8, 8, 1, 1, after)
  renderer.set_render_target(None)
  [before[0].to_int(), after[0].to_int()]
}
