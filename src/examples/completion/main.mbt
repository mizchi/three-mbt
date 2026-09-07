///|
pub fn render_patch() -> FixedArray[Int] {
  let geometry = @three.PlaneGeometry(2, 2).as_buffer_geometry()
  defer geometry.dispose()
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  defer material.dispose()
  let defines = @three.ShaderDefines()
  defines.set_int("GREEN", 1)
  material.set_defines(defines)
  material.set_on_before_compile(
    fn(shader, _renderer) {
      shader.uniforms().set_float("strength", 1)
      let source =
        #|uniform float strength;
        #|void main() {
        #|#ifdef GREEN
        #|gl_FragColor = vec4(0., strength, 0., 1.);
        #|#else
        #|gl_FragColor = vec4(1., 0., 0., 1.);
        #|#endif
        #|}
      shader.set_fragment_shader(source)
    },
    "green-v1",
  )
  let before = Ref(0)
  let after = Ref(0)
  material.set_on_before_render(fn(context) {
    if context.geometry().same_reference(geometry) {
      before.val += 1
    }
  })
  let mesh = @three.Mesh(geometry, material).as_object3d()
  mesh.set_on_after_render(fn(_context) { after.val += 1 })
  let scene = @three.Scene()
  scene.as_object3d().add(mesh) |> ignore
  let camera = @three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.as_object3d().position().set_z(2) |> ignore
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  let target = @three.WebGLRenderTarget(1, 1)
  defer target.dispose()
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera.as_camera())
  let pixel = Bytes::new(4)
  renderer.read_render_target_pixels(target, 0, 0, 1, 1, pixel)
  [
    pixel[0].to_int(),
    pixel[1].to_int(),
    pixel[2].to_int(),
    pixel[3].to_int(),
    before.val,
    after.val,
  ]
}

///|
pub fn render_partial() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let texture = @three.DataTexture::from_rgba(b"\xff\x00\x00\xff", 1, 1).as_texture()
    defer texture.dispose()
    texture.mark_needs_update()
    let material = @three.MeshBasicMaterial(0xffffff)
    defer material.as_material().dispose()
    material.set_map(Some(texture))
    let geometry = @three.PlaneGeometry(2, 2).as_buffer_geometry()
    defer geometry.dispose()
    let scene = @three.Scene()
    scene
    .as_object3d()
    .add(@three.Mesh(geometry, material.as_material()).as_object3d())
    |> ignore
    let camera = @three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.as_object3d().position().set_z(2) |> ignore
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(1, 1)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    let before = Bytes::new(4)
    renderer.read_render_target_pixels(target, 0, 0, 1, 1, before)
    texture.write_rgba(0, b"\x00\xff\x00\xff")
    renderer.render(scene, camera.as_camera())
    let after = Bytes::new(4)
    renderer.read_render_target_pixels(target, 0, 0, 1, 1, after)
    before + after
  })
}

///|

///|
pub fn render_mipmaps() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let base = b"\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff\x00\xff"
    let texture = @three.DataTexture::from_rgba(base, 4, 4).as_texture()
    defer texture.dispose()
    texture.set_rgba_mipmaps([
      @three.TextureMipLevel(base, 4, 4),
      @three.TextureMipLevel(
        b"\xff\x00\x00\xff\xff\x00\x00\xff\xff\x00\x00\xff\xff\x00\x00\xff", 2, 2,
      ),
      @three.TextureMipLevel(b"\x00\x00\xff\xff", 1, 1),
    ])
    texture.set_min_filter(@three.NearestMipmapNearest)
    texture.set_mag_filter(@three.Nearest)
    let material = @three.MeshBasicMaterial(0xffffff)
    defer material.as_material().dispose()
    material.set_map(Some(texture))
    let geometry = @three.PlaneGeometry(2, 2).as_buffer_geometry()
    defer geometry.dispose()
    let scene = @three.Scene()
    scene
    .as_object3d()
    .add(@three.Mesh(geometry, material.as_material()).as_object3d())
    |> ignore
    let camera = @three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.as_object3d().position().set_z(2) |> ignore
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(1, 1)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    let pixel = Bytes::new(4)
    renderer.read_render_target_pixels(target, 0, 0, 1, 1, pixel)
    pixel
  })
}

///|
pub fn load_3mf(url : String) -> @js_async.Promise[Int] {
  @js_async.Promise::from_async(async fn() {
    let group = @three.ThreeMFLoader().load(url)
    let count = Ref(0)
    group
    .as_object3d()
    .traverse(fn(node) {
      if node.as_mesh() is Some(mesh) {
        count.val += mesh.geometry().get_attribute("position").unwrap().count()
        mesh.geometry().dispose()
        for material in mesh.materials() {
          material.dispose()
        }
      }
    })
    count.val
  })
}

///|
pub fn usdz_roundtrip() -> @js_async.Promise[FixedArray[Double]] {
  @js_async.Promise::from_async(async fn() {
    let geometry = @three.BoxGeometry(1, 2, 3).as_buffer_geometry()
    defer geometry.dispose()
    let material = @three.MeshStandardMaterial(0xff0000, 0.5, 0).as_material()
    defer material.dispose()
    let root = @three.Mesh(geometry, material).as_object3d()
    root.update_matrix_world(true)
    let bytes = @three.USDZExporter().export_usdz(
      root,
      @three.USDZExportOptions(),
    )
    let restored = @three.USDLoader().parse(bytes, "").as_object3d()
    let size = @three.Box3()
      .set_from_object(restored)
      .get_size(@three.Vector3(0, 0, 0))
    restored.traverse(fn(node) {
      if node.as_mesh() is Some(mesh) {
        mesh.geometry().dispose()
        for material in mesh.materials() {
          material.dispose()
        }
      }
    })
    [
      bytes[0].to_int().to_double(),
      bytes[1].to_int().to_double(),
      size.x(),
      size.y(),
      size.z(),
    ]
  })
}

///|
pub fn export_draco(encoder_url : String) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let exporter = @three.DRACOExporter()
    exporter.load_encoder(encoder_url)
    let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
    defer geometry.dispose()
    let material = @three.MeshBasicMaterial(0xffffff).as_material()
    defer material.dispose()
    exporter.export_mesh(
      @three.Mesh(geometry, material),
      @three.DRACOExportOptions(),
    )
  })
}

///|
fn main {

}
