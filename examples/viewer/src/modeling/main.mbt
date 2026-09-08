///|
/// A plate with a through-hole and beveled edges, suitable for mesh export.
fn make_part() -> @three.Mesh {
  let shape = @three.Shape::from_points([
    @three.Vector2(-1, -1),
    @three.Vector2(1, -1),
    @three.Vector2(1, 1),
    @three.Vector2(-1, 1),
  ])
  shape.as_path().close_path() |> ignore
  let hole = @three.Path::from_points([
    @three.Vector2(-0.35, -0.35),
    @three.Vector2(-0.35, 0.35),
    @three.Vector2(0.35, 0.35),
    @three.Vector2(0.35, -0.35),
  ])
  hole.close_path() |> ignore
  shape.set_holes([hole])
  let options = @three.ExtrudeOptions()
  options.set_depth(0.3)
  options.set_bevel_enabled(true)
  options.set_bevel_thickness(0.05)
  options.set_bevel_size(0.05)
  options.set_bevel_segments(2)
  let geometry = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
  geometry.compute_bounding_box()
  let material = @three.MeshBasicMaterial(0x00ff00).as_material()
  let mesh = @three.Mesh(geometry, material)
  mesh.as_object3d().update_matrix_world(true)
  mesh
}

///|
pub fn render_part() -> Bytes {
  let mesh = make_part()
  defer mesh.geometry().dispose()
  defer mesh.materials()[0].dispose()
  let scene = @three.Scene()
  scene.as_object3d().add(mesh.as_object3d()) |> ignore
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  renderer.set_size(64, 64)
  let camera = @three.PerspectiveCamera(45, 1, 0.1, 10)
  camera.as_object3d().position().set(0, 0, 4) |> ignore
  let target = @three.WebGLRenderTarget(64, 64)
  defer target.dispose()
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera.as_camera())
  let hole_pixel = Bytes::new(4)
  let solid_pixel = Bytes::new(4)
  renderer.read_render_target_pixels(target, 32, 32, 1, 1, hole_pixel)
  renderer.read_render_target_pixels(target, 48, 32, 1, 1, solid_pixel)
  hole_pixel + solid_pixel
}

///|
pub fn export_part() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let mesh = make_part()
    defer mesh.geometry().dispose()
    defer mesh.materials()[0].dispose()
    @three.STLExporter().export_binary(mesh.as_object3d())
  })
}

///|
fn main {

}
