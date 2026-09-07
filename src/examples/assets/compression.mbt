///|
pub fn load_compressed(
  url : String,
  decoder_base : String,
) -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(32, 32)
    let draco = @three.DRACOLoader().set_decoder_path(decoder_base + "draco/")
    let basis = @three.KTX2Loader().set_transcoder_path(decoder_base + "basis/")
    defer draco.dispose() |> ignore
    defer basis.dispose()
    basis.detect_support(renderer) |> ignore
    let loader = @three.GLTFLoader()
      .set_draco_loader(draco)
      .set_ktx2_loader(basis)
      .enable_meshopt()
    let model = loader.load(url)
    let root = model.scene().unwrap().as_object3d()
    let mesh = root.children()[0].as_mesh().unwrap()
    defer mesh.geometry().dispose()
    defer (for material in mesh.materials() {
      if material.as_basic_material() is Some(basic) {
        if basic.map() is Some(texture) {
          texture.dispose()
        }
      }
      material.dispose()
    })
    let scene = @three.Scene()
    scene.as_object3d().add(root) |> ignore
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    let target = @three.WebGLRenderTarget(32, 32)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    let pixels = Bytes::new(32 * 32 * 4)
    renderer.read_render_target_pixels(target, 0, 0, 32, 32, pixels)
    renderer.set_render_target(None)
    let mut sum = 0
    for i in 0..<1024 {
      sum += pixels[i * 4].to_int() +
        pixels[i * 4 + 1].to_int() +
        pixels[i * 4 + 2].to_int()
    }
    let center = (16 * 32 + 16) * 4
    [
      mesh.geometry().get_attribute("position").unwrap().count(),
      pixels[center].to_int(),
      pixels[center + 1].to_int(),
      pixels[center + 2].to_int(),
      pixels[center + 3].to_int(),
      sum,
    ]
  })
}

///|
pub fn reject_invalid_assets(
  base : String,
) -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let results : FixedArray[Int] = [0, 0, 0, 0, 0]
    for i, name in ["draco.glb", "meshopt.glb", "basis.glb"] {
      results[i] = try {
        @three.GLTFLoader().load(base + name) |> ignore
        0
      } catch {
        @three.LoadError(_) => 1
      }
    }
    let video = @three.Video(base + "colors.webm")
    defer video.dispose()
    results[3] = try {
      video.seek(-1)
      0
    } catch {
      @three.MediaError(_) => 1
    }
    let missing = @three.Video(base + "missing.webm")
    defer missing.dispose()
    results[4] = try {
      missing.ready()
      0
    } catch {
      @three.MediaError(_) => 1
    }
    results
  })
}
