///|
fn cut_block(
  csg : @three.CSG,
  body : @three.Material,
  wall : @three.Material,
) -> @three.Mesh raise {
  let block = @three.BoxGeometry(2, 2, 2).as_buffer_geometry()
  let cylinder = @three.CylinderGeometry(0.4, 0.4, 3, 24).as_buffer_geometry()
  defer block.dispose()
  defer cylinder.dispose()
  cylinder.rotate_x(1.5707963267948966) |> ignore
  csg.subtract_mesh(@three.Mesh(block, body), @three.Mesh(cylinder, wall))
}

///|
pub fn render_cut(wasm_url : String) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let csg = @three.CSG()
    csg.initialize_from_url(wasm_url)
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(64, 64)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    let scene = @three.Scene()
    scene.set_background(Some(@three.Color::from_hex(0x0000ff)))
    let camera = @three.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 10)
    camera.as_object3d().position().set_z(4) |> ignore
    let red = @three.MeshBasicMaterial(0xff0000).as_material()
    let green = @three.MeshBasicMaterial(0x00ff00).as_material()
    defer red.dispose()
    defer green.dispose()
    let source = @three.BoxGeometry(2, 2, 2).as_buffer_geometry()
    defer source.dispose()
    let mesh = @three.Mesh(source, red)
    scene.as_object3d().add(mesh.as_object3d()) |> ignore
    renderer.render(scene, camera.as_camera())
    let before = Bytes::new(4)
    renderer.read_render_target_pixels(target, 32, 32, 1, 1, before)
    let cut = cut_block(csg, red, green)
    defer cut.geometry().dispose()
    mesh.set_geometry(cut.geometry())
    mesh.set_materials(cut.materials())
    renderer.render(scene, camera.as_camera())
    let after = Bytes::new(4)
    renderer.read_render_target_pixels(target, 32, 32, 1, 1, after)
    camera.as_object3d().position().set_x(0.8) |> ignore
    camera.as_object3d().look_at(@three.Vector3(0, 0, 0))
    renderer.render(scene, camera.as_camera())
    let angled = Bytes::new(64 * 64 * 4)
    renderer.read_render_target_pixels(target, 0, 0, 64, 64, angled)
    before + after + angled
  })
}

///|
pub fn export_cut(wasm_url : String) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let csg = @three.CSG()
    csg.initialize_from_url(wasm_url)
    let material = @three.MeshBasicMaterial(0xffffff).as_material()
    defer material.dispose()
    let cut = cut_block(csg, material, material)
    defer cut.geometry().dispose()
    @three.STLExporter().export_binary(cut.as_object3d())
  })
}

///|
pub fn export_glb(wasm_url : String) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let csg = @three.CSG()
    csg.initialize_from_url(wasm_url)
    let red = @three.MeshBasicMaterial(0xff0000).as_material()
    let green = @three.MeshBasicMaterial(0x00ff00).as_material()
    defer red.dispose()
    defer green.dispose()
    let cut = cut_block(csg, red, green)
    defer cut.geometry().dispose()
    @three.GLTFExporter().export_glb(cut.as_object3d())
  })
}

///|
pub fn load_failure(wasm_url : String) -> @js_async.Promise[Bool] {
  @js_async.Promise::from_async(async fn() {
    let csg = @three.CSG()
    try csg.initialize_from_url(wasm_url) catch {
      @three.ModelingError(_) => !csg.ready()
    } noraise {
      _ => false
    }
  })
}

///|
fn main {
  println("Import the CSG example exports and pass the manifold.wasm URL.")
}
