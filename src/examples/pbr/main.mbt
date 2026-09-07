///|
pub fn render_environment(url : String) -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let hdr = @three.HDRLoader().load(url)
    defer hdr.as_texture().dispose()
    hdr.as_texture().set_mapping(EquirectangularReflection)
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(32, 32)
    let generator = @three.PMREMGenerator(renderer)
    defer generator.dispose()
    generator.compile_equirectangular_shader()
    let environment = generator.from_equirectangular(hdr.as_texture())
    defer environment.dispose()
    let scene = @three.Scene()
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    let geometry = @three.BoxGeometry(2, 2, 2).as_buffer_geometry()
    defer geometry.dispose()
    let material = @three.MeshStandardMaterial(0xffffff, 1, 0)
    defer material.as_material().dispose()
    scene
    .as_object3d()
    .add(@three.Mesh(geometry, material.as_material()).as_object3d())
    |> ignore
    let target = @three.WebGLRenderTarget(32, 32)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    let dark = Bytes::new(4)
    renderer.render(scene, camera.as_camera())
    renderer.read_render_target_pixels(target, 16, 16, 1, 1, dark)
    scene.set_environment(Some(environment.texture()))
    let lit = Bytes::new(4)
    renderer.render(scene, camera.as_camera())
    renderer.read_render_target_pixels(target, 16, 16, 1, 1, lit)
    scene.set_environment(None)
    renderer.set_render_target(None)
    let sky = @three.Scene()
    sky.set_background(Some(@three.Color::from_rgb(0.5, 0.5, 0.5)))
    let captured = generator.from_scene(sky, size=16)
    defer captured.dispose()
    [
      dark[0].to_int(),
      dark[1].to_int(),
      dark[2].to_int(),
      lit[0].to_int(),
      lit[1].to_int(),
      lit[2].to_int(),
      environment.width(),
      captured.height(),
    ]
  })
}

///|
fn main {

}

///|
pub fn render_transmission(url : String) -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let model = @three.GLTFLoader().load(url)
    let root = model.scene().unwrap().as_object3d()
    let mesh = root.children()[0].as_mesh().unwrap()
    let material = mesh.materials()[0].as_physical_material().unwrap()
    defer mesh.geometry().dispose()
    defer material.as_material().dispose()
    let scene = @three.Scene()
    scene.as_object3d().add(root) |> ignore
    let backdrop_geometry = @three.PlaneGeometry(4, 4).as_buffer_geometry()
    let backdrop_material = @three.MeshBasicMaterial(0x0000ff).as_material()
    defer backdrop_geometry.dispose()
    defer backdrop_material.dispose()
    let backdrop = @three.Mesh(backdrop_geometry, backdrop_material).as_object3d()
    backdrop.position().set(0, 0, -1) |> ignore
    scene.as_object3d().add(backdrop) |> ignore
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(32, 32)
    let target = @three.WebGLRenderTarget(32, 32)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    material.set_transmission(0)
    let solid = Bytes::new(4)
    renderer.render(scene, camera.as_camera())
    renderer.read_render_target_pixels(target, 16, 16, 1, 1, solid)
    material.set_transmission(1)
    material.set_thickness(0)
    material.set_ior(1)
    let glass = Bytes::new(4)
    renderer.render(scene, camera.as_camera())
    renderer.read_render_target_pixels(target, 16, 16, 1, 1, glass)
    renderer.set_render_target(None)
    [
      solid[0].to_int(),
      solid[1].to_int(),
      solid[2].to_int(),
      glass[0].to_int(),
      glass[1].to_int(),
      glass[2].to_int(),
    ]
  })
}
