///|
fn read_pixel(
  renderer : @three.WebGLRenderer,
  target : @three.WebGLRenderTarget,
  x : Int,
  y : Int,
) -> Bytes {
  let bytes = Bytes::new(4)
  renderer.read_render_target_pixels(target, x, y, 1, 1, bytes)
  bytes
}

///|
pub fn render_ubo() -> Bytes {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  let geometry = @three.PlaneGeometry(2, 2).as_buffer_geometry()
  defer geometry.dispose()
  let value = @three.Uniform::from_vector4(@three.Vector4(1, 0, 0, 1))
  let group = @three.UniformsGroup().set_name("Settings").add(value)
  defer group.dispose()
  let material = @three.ShaderMaterial(
    "void main() { gl_Position = vec4(position, 1.0); }",
    "layout(std140) uniform Settings { vec4 tint; }; out vec4 result; void main() { result = tint; }",
    @three.Uniforms(),
  )
  defer material.as_material().dispose()
  material.set_glsl_version(Some(@three.GLSL3))
  material.set_uniforms_groups([group])
  let scene = @three.Scene()
  scene
  .as_object3d()
  .add(@three.Mesh(geometry, material.as_material()).as_object3d())
  |> ignore
  let camera = @three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.as_object3d().position().set_z(2) |> ignore
  let target = @three.WebGLRenderTarget(1, 1)
  defer target.dispose()
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera.as_camera())
  let before = read_pixel(renderer, target, 0, 0)
  value.set_vector4(@three.Vector4(0, 1, 0, 1))
  renderer.render(scene, camera.as_camera())
  before + read_pixel(renderer, target, 0, 0)
}

///|
pub fn render_copies() -> Bytes {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  let scene = @three.Scene()
  scene.set_background(Some(@three.Color::from_hex(0x00ff00)))
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 10).as_camera()
  let target = @three.WebGLRenderTarget(1, 1)
  defer target.dispose()
  let framebuffer = @three.FramebufferTexture(1, 1).as_texture()
  defer framebuffer.dispose()
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera)
  renderer.copy_framebuffer_to_texture(framebuffer, @three.Vector2(0, 0), 0)
  let result = @three.WebGLRenderTarget(1, 1)
  defer result.dispose()
  renderer.init_render_target(result)
  renderer.copy_texture(framebuffer, result.texture())
  let first = read_pixel(renderer, result, 0, 0)
  let volume = @three.WebGL3DRenderTarget(1, 1, 2)
  defer volume.as_render_target().dispose()
  renderer.set_3d_render_target(volume, 1, 0)
  renderer.render(scene, camera)
  let region = @three.Box3().set(
    @three.Vector3(0, 0, 1),
    @three.Vector3(1, 1, 2),
  )
  renderer.copy_texture_3d(
    volume.texture().as_texture(),
    result.texture(),
    region,
    @three.Vector3(0, 0, 0),
    0,
    0,
  )
  let second = read_pixel(renderer, result, 0, 0)
  let layers = @three.WebGLArrayRenderTarget(1, 1, 2)
  defer layers.as_render_target().dispose()
  renderer.set_array_render_target(layers, 1, 0)
  renderer.render(scene, camera)
  renderer.copy_texture_3d(
    layers.texture().as_texture(),
    result.texture(),
    region,
    @three.Vector3(0, 0, 0),
    0,
    0,
  )
  first + second + read_pixel(renderer, result, 0, 0)
}

///|
extern "js" fn wait_images(pass : @three.SMAAPass) -> @js_async.Promise[Unit] =
  #| pass => Promise.all([pass._areaTexture.image.decode(), pass._searchTexture.image.decode()]).then(() => {})

///|
pub fn render_effect(kind : Int) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(16, 16)
    let scene = @three.Scene()
    let geometry = @three.PlaneGeometry(4, 4).as_buffer_geometry()
    defer geometry.dispose()
    let material = @three.MeshBasicMaterial(0xff0000).as_material()
    defer material.dispose()
    scene.as_object3d().add(@three.Mesh(geometry, material).as_object3d())
    |> ignore
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 10)
    camera.as_object3d().position().set_z(2) |> ignore
    let composer = @three.EffectComposer(renderer)
    defer composer.dispose()
    composer.set_size(16, 16)
    composer.set_render_to_screen(false)
    let render = @three.RenderPass(scene, camera.as_camera()).as_pass()
    defer render.dispose()
    composer.add_pass(render)
    let effect = match kind {
      0 => {
        let uniforms = @three.Uniforms()
        uniforms.set_texture("tDiffuse", @three.Texture())
        let shader = @three.ShaderMaterial(
          "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
          "uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = vec4(1. - texture2D(tDiffuse, vUv).rgb, 1.); }",
          uniforms,
        )
        @three.ShaderPass(shader, "tDiffuse").as_pass()
      }
      1 => {
        let smaa = @three.SMAAPass()
        wait_images(smaa).wait()
        smaa.as_pass()
      }
      2 => {
        let gtao = @three.GTAOPass(scene, camera.as_camera(), 16, 16)
        let settings = @three.GTAOSettings()
        settings.set_radius(0.25)
        settings.set_samples(8)
        gtao.update_gtao(settings)
        gtao.as_pass()
      }
      _ => @three.BokehPass(scene, camera, 2, 0.01, 0.1).as_pass()
    }
    defer effect.dispose()
    composer.add_pass(effect)
    // Composer buffers are half-float; copy the result through an RGBA8 target.
    composer.render(0.016)
    let target = @three.WebGLRenderTarget(1, 1)
    defer target.dispose()
    material
    .as_basic_material()
    .unwrap()
    .set_map(Some(composer.read_buffer().texture()))
    material.as_basic_material().unwrap().color().set_hex(0xffffff) |> ignore
    material.mark_needs_update()
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    read_pixel(renderer, target, 0, 0)
  })
}

///|
pub fn plugin_roundtrip() -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let root = @three.Object3D()
    root.set_name("extension-node")
    let exporter = @three.GLTFExporter()
    let registration = exporter.register(fn(writer) {
      let plugin = @three.GLTFExporterPlugin()
      plugin.set_write_node(fn(_node, definition) {
        definition.as_user_data().set_string("name", "extended")
        definition
        .as_user_data()
        .set_json("extensions", { "EXT_test": { "value": 1 } })
        writer.mark_extension("EXT_test", false)
      })
      plugin
    })
    let json = exporter.export_gltf(root)
    registration.unregister()
    let ordinary = exporter.export_gltf(root)
    let loaded = Ref(0)
    let loader = @three.GLTFLoader()
    let hook = loader.register(fn(parser) {
      let plugin = @three.GLTFLoaderPlugin("EXT_test")
      plugin.set_load_node(fn(index) { index == 0 }, fn(_index) {
        @js_async.Promise::from_async(() => {
          let node = @three.Object3D()
          node.set_name("overridden")
          node
        })
      })
      plugin.set_after_root(fn(result) {
        if parser.node_definition(0).unwrap().as_user_data().get_string("name") ==
          Some("extended") {
          loaded.val += 1
        }
        result
        .scene()
        .unwrap()
        .as_object3d()
        .user_data()
        .set_bool("processed", true)
      })
      plugin
    })
    let result = loader.parse_gltf(json)
    hook.unregister()
    let unmodified = loader.parse_gltf(ordinary)
    assert_true(
      result.scene().unwrap().as_object3d().get_object_by_name("overridden")
      is Some(_),
    )
    assert_true(
      unmodified.scene().unwrap().as_object3d().get_object_by_name("overridden")
      is None,
    )
    [
      if json.contains("EXT_test") {
        1
      } else {
        0
      },
      if ordinary.contains("EXT_test") {
        1
      } else {
        0
      },
      if loaded.val == 1 &&
        result.scene().unwrap().as_object3d().user_data().get_bool("processed") ==
        Some(true) {
        1
      } else {
        0
      },
    ]
  })
}

///|
pub fn render_helpers() -> FixedArray[Int] {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  renderer.set_size(8, 8)
  renderer.set_shadows_enabled(true)
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer geometry.dispose()
  let canvas = @three.SceneUtils().uv_debug(geometry, 64) catch {
    _ => @three.Canvas()
  }
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  defer material.dispose()
  let mesh = @three.Mesh(geometry, material).as_object3d()
  mesh.set_cast_shadow(true)
  let before = Ref(0)
  let after = Ref(0)
  mesh.set_on_before_shadow(fn(_context) { before.val += 1 })
  mesh.set_on_after_shadow(fn(_context) { after.val += 1 })
  let light = @three.DirectionalLight(0xffffff, 1)
  light.as_object3d().position().set(0, 2, 3) |> ignore
  light.as_object3d().set_cast_shadow(true)
  let scene = @three.Scene()
  scene.as_object3d().add(mesh).add(light.as_object3d()) |> ignore
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 10)
  camera.as_object3d().position().set_z(3) |> ignore
  renderer.render(scene, camera.as_camera())
  [canvas.width(), before.val, after.val]
}

///|
pub fn load_formats(kind : Int, url : String) -> @js_async.Promise[Int] {
  @js_async.Promise::from_async(async fn() {
    let root = match kind {
      0 => @three.FBXLoader().load(url).as_object3d()
      1 => @three.ColladaLoader().load(url).scene()
      _ => {
        let loader = @three.Rhino3dmLoader()
          .set_library_path("/rhino/")
          .set_worker_limit(1)
        defer loader.dispose() |> ignore
        loader.load(url)
      }
    }
    let count = Ref(0)
    root.traverse(fn(node) {
      if node.as_mesh() is Some(mesh) {
        count.val += mesh.geometry().get_attribute("position").unwrap().count()
        mesh.geometry().dispose()
        for material in mesh.materials() {
          material.dispose()
        }
      } else if node.as_points() is Some(points) {
        count.val += points
          .geometry()
          .get_attribute("position")
          .unwrap()
          .count()
        points.geometry().dispose()
        points.material().dispose()
      }
    })
    count.val
  })
}

///|
pub fn texture_exports() -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let texture = @three.DataTexture::from_rgba_float([0.25, 0.5, 1, 1], 1, 1)
    defer texture.as_texture().dispose()
    let exr = @three.EXRExporter().export_texture(
      texture,
      @three.EXRExportOptions(),
    )
    let ktx = @three.KTX2Exporter().export_texture(texture)
    [
      exr[0].to_int(),
      exr[1].to_int(),
      exr[2].to_int(),
      exr[3].to_int(),
      ktx[0].to_int(),
      ktx[1].to_int(),
      ktx[2].to_int(),
      ktx[3].to_int(),
    ]
  })
}

///|
pub fn rig_clip(text : String) -> @js_async.Promise[Double] {
  @js_async.Promise::from_async(() => {
    let source = @three.BVHLoader().parse(text)
    let hip = @three.Bone()
    hip.as_object3d().set_name("hip")
    let skeleton = @three.Skeleton([hip])
    defer skeleton.dispose()
    let geometry = @three.BufferGeometry()
    defer geometry.dispose()
    let material = @three.MeshBasicMaterial(0xffffff).as_material()
    defer material.dispose()
    let target = @three.SkinnedMesh(geometry, material)
    target.as_object3d().add(hip.as_object3d()) |> ignore
    target.bind(skeleton, @three.Matrix4())
    let options = @three.RetargetOptions()
    options.map_bone("hip", "hip")
    options.set_fps(Some(3))
    let clip = @three.SkeletonUtils().retarget_clip_from_skeleton(
      target,
      source.skeleton(),
      source.clip(),
      options,
    )
    let mixer = @three.AnimationMixer(target.as_object3d())
    defer {
      mixer.stop_all_action() |> ignore
      mixer.uncache_root(target.as_object3d())
    }
    mixer.clip_action(clip).play() |> ignore
    mixer.update(0.5) |> ignore
    hip.as_object3d().position().x()
  })
}

///|
pub fn decompress_texture(url : String) -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let loader = @three.KTX2Loader()
      .set_transcoder_path("/basis/")
      .detect_support(renderer)
    defer loader.dispose()
    let compressed = loader.load(url)
    defer compressed.dispose()
    let readable = @three.WebGLTextureUtils().decompress(compressed, 32)
    defer readable.dispose()
    let size = readable.source().get_size(@three.Vector3(0, 0, 0))
    let scene = @three.Scene()
    scene.set_background_texture(Some(readable))
    let target = @three.WebGLRenderTarget(1, 1)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    renderer.render(scene, @three.PerspectiveCamera(60, 1, 0.1, 10).as_camera())
    let pixel = read_pixel(renderer, target, 0, 0)
    [size.x().to_int(), size.y().to_int(), pixel[3].to_int()]
  })
}

///|
fn main {

}
