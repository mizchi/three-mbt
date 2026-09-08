///|
pub fn create_file_loader() -> @three.FileLoader {
  let loader = @three.FileLoader()
  let headers = @three.RequestHeaders()
  headers.set("X-Asset-Version", "test")
  loader.as_loader().set_request_header(headers) |> ignore
  loader
}

///|
pub fn load_file_text(
  loader : @three.FileLoader,
  url : String,
) -> @js_async.Promise[String] {
  @js_async.Promise::from_async(async fn() { loader.load_text(url) })
}

///|
pub fn load_file_bytes(
  loader : @three.FileLoader,
  url : String,
) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() { loader.load_bytes(url) })
}

///|
pub fn load_file_json(
  loader : @three.FileLoader,
  url : String,
) -> @js_async.Promise[String] {
  @js_async.Promise::from_async(async fn() { loader.load_json(url).stringify() })
}

///|
pub fn abort_file(loader : @three.FileLoader) -> Unit {
  loader.abort() |> ignore
}

///|
pub fn load_geometry(url : String) -> @js_async.Promise[Int] {
  @js_async.Promise::from_async(async fn() {
    let geometry = @three.BufferGeometryLoader().load(url)
    defer geometry.dispose()
    geometry.get_attribute("position").unwrap().count()
  })
}

///|
pub fn load_material(url : String) -> @js_async.Promise[Int] {
  @js_async.Promise::from_async(async fn() {
    let material = @three.MaterialLoader().load(url)
    defer material.dispose()
    material.as_basic_material().unwrap().color().get_hex()
  })
}

///|
pub fn load_animation(url : String) -> @js_async.Promise[String] {
  @js_async.Promise::from_async(async fn() {
    @three.AnimationLoader().load(url)[0].name()
  })
}

///|
pub fn parse_object(text : String) -> @js_async.Promise[String] {
  @js_async.Promise::from_async(async fn() {
    @three.ObjectLoader().parse_json_string(text).name()
  })
}

///|
pub fn render_object(url : String) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let root = @three.ObjectLoader().load(url)
    let mesh = root.as_mesh().unwrap()
    defer mesh.geometry().dispose()
    let materials = mesh.materials()
    defer (for material in materials {
      if material.as_basic_material() is Some(basic) {
        if basic.map() is Some(texture) {
          texture.dispose()
        }
      }
      material.dispose()
    })
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(32, 32)
    let target = @three.WebGLRenderTarget(32, 32)
    defer target.dispose()
    let scene = @three.Scene()
    scene.as_object3d().add(root) |> ignore
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    let pixels = Bytes::new(4)
    renderer.read_render_target_pixels(target, 16, 16, 1, 1, pixels)
    pixels
  })
}

///|
fn main {

}
