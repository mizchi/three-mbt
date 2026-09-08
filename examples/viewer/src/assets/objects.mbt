///|
pub fn render_objects() -> FixedArray[Int] {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  renderer.set_size(32, 32)
  let target = @three.WebGLRenderTarget(32, 32)
  defer target.dispose()
  let scene = @three.Scene()
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 3) |> ignore
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let geometry = @three.BoxGeometry(0.8, 0.8, 0.8).as_buffer_geometry()
  defer material.dispose()
  defer geometry.dispose()
  let batch = @three.BatchedMesh(2, 100, 200, material)
  defer batch.dispose()
  let id = batch.add_geometry(geometry)
  let first = batch.add_instance(id)
  let second = batch.add_instance(id)
  batch
  .set_matrix_at(first, @three.Matrix4().make_translation(-0.7, 0, 0))
  .set_matrix_at(second, @three.Matrix4().make_translation(0.7, 0, 0))
  |> ignore
  batch
  .set_color_at(first, @three.Color::from_hex(0xff0000))
  .set_color_at(second, @three.Color::from_hex(0x0000ff))
  |> ignore
  scene.as_object3d().add(batch.as_object3d()) |> ignore
  let line_geometry = @three.LineGeometry().set_positions([-1, -1, 0, 1, -1, 0])
  let line_material = @three.LineMaterial(0x00ff00, 3)
  defer line_geometry.as_buffer_geometry().dispose()
  defer line_material.as_material().dispose()
  line_material.resolution().set(32, 32) |> ignore
  let line = @three.Line2(line_geometry, line_material)
  scene.as_object3d().add(line.as_object3d()) |> ignore
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera.as_camera())
  let pixels = Bytes::new(32 * 32 * 4)
  renderer.read_render_target_pixels(target, 0, 0, 32, 32, pixels)
  let mut green = 0
  for i in 0..<1024 {
    green += pixels[i * 4 + 1].to_int()
  }
  batch.set_visible_at(second, false) |> ignore
  renderer.render(scene, camera.as_camera())
  let hidden = Bytes::new(4)
  renderer.read_render_target_pixels(target, 23, 16, 1, 1, hidden)
  scene.as_object3d().remove(batch.as_object3d()).remove(line.as_object3d())
  |> ignore
  @three.init_area_lights()
  let area = @three.RectAreaLight(0xff0000, 5, 2, 2)
  area.as_object3d().position().set(0, 0, 2) |> ignore
  let surface = @three.MeshStandardMaterial(0xffffff, roughness=1, metalness=0).as_material()
  let plane = @three.PlaneGeometry(4, 4).as_buffer_geometry()
  defer surface.dispose()
  defer plane.dispose()
  scene
  .as_object3d()
  .add(area.as_object3d())
  .add(@three.Mesh(plane, surface).as_object3d())
  |> ignore
  renderer.render(scene, camera.as_camera())
  let lit = Bytes::new(4)
  renderer.read_render_target_pixels(target, 16, 16, 1, 1, lit)
  renderer.set_render_target(None)
  [
    pixels[(16 * 32 + 8) * 4].to_int(),
    pixels[(16 * 32 + 23) * 4 + 2].to_int(),
    hidden[2].to_int(),
    green,
    lit[0].to_int(),
  ]
}
