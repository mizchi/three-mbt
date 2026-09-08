///|
/// Load a model and report scene/animation/camera counts, vertex count, and the
/// first mesh's world X position after half a second of animation.
pub fn load_model(url : String) -> @js_async.Promise[FixedArray[Double]] {
  @js_async.Promise::from_async(async fn() {
    let gltf = @three.GLTFLoader().load(url)
    let root = gltf.scene().unwrap().as_object3d()
    let meshes : Array[@three.Mesh] = []
    root.traverse(fn(node) {
      if node.as_mesh() is Some(mesh) {
        meshes.push(mesh)
      }
    })
    let mixer = @three.AnimationMixer(root)
    for clip in gltf.animations() {
      mixer.clip_action(clip).play() |> ignore
    }
    mixer.update(0.5) |> ignore
    let position = @three.Vector3(0, 0, 0)
    let vertices = if meshes.length() > 0 {
      meshes[0].as_object3d().get_world_position(position) |> ignore
      meshes[0].geometry().get_attribute("position").unwrap().count()
    } else {
      0
    }
    let result : FixedArray[Double] = [
      meshes.length().to_double(),
      gltf.animations().length().to_double(),
      gltf.cameras().length().to_double(),
      vertices.to_double(),
      position.x(),
    ]
    mixer.stop_all_action() |> ignore
    mixer.uncache_root(root)
    for mesh in meshes {
      mesh.geometry().dispose()
      for material in mesh.materials() {
        material.dispose()
      }
    }
    result
  })
}

///|
/// Render into a target and return its center pixel. No application globals.
pub fn render_triangle() -> Bytes {
  let renderer = @three.WebGLRenderer(antialias=false)
  defer {
    renderer.dispose()
    renderer.force_context_loss()
  }
  renderer.set_size(64, 64)
  let scene = @three.Scene()
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 3) |> ignore
  let geometry = @three.BufferGeometry()
  defer geometry.dispose()
  geometry.set_attribute(
    "position",
    @three.BufferAttribute::from_floats([-1, -1, 0, 1, -1, 0, 0, 1, 0], 3),
  )
  |> ignore
  let material = @three.MeshBasicMaterial(0xff0000).as_material()
  defer material.dispose()
  scene.as_object3d().add(@three.Mesh(geometry, material).as_object3d())
  |> ignore
  let target = @three.WebGLRenderTarget(64, 64)
  defer target.dispose()
  let controls = @three.OrbitControls(
    camera.as_camera(),
    renderer.dom_element(),
  )
  controls.update(0) |> ignore
  controls.dispose()
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera.as_camera())
  let pixel = Bytes::new(4)
  renderer.read_render_target_pixels(target, 32, 32, 1, 1, pixel)
  renderer.set_render_target(None)
  pixel
}

///|
pub fn load_texture(url : String) -> @js_async.Promise[Bool] {
  @js_async.Promise::from_async(async fn() {
    let texture = @three.TextureLoader().load(url)
    defer texture.dispose()
    texture.set_color_space(SRGB)
    texture.repeat().set(2, 2) |> ignore
    texture.repeat().x() == 2
  })
}

///|
fn main {

}

///|
/// End-to-end model loading and rendering. A real app retains these resources
/// for subsequent frames and disposes them when the model is removed.
pub fn render_model(url : String) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    let gltf = @three.GLTFLoader().load(url)
    let root = gltf.scene().unwrap().as_object3d()
    defer root.traverse(fn(node) {
      if node.as_mesh() is Some(mesh) {
        mesh.geometry().dispose()
        for material in mesh.materials() {
          if material.as_standard_material() is Some(standard) {
            if standard.map() is Some(texture) {
              texture.dispose()
            }
          }
          material.dispose()
        }
      }
    })
    let scene = @three.Scene()
    scene.as_object3d().add(root) |> ignore
    scene.as_object3d().add(@three.AmbientLight(0xffffff, 3).as_object3d())
    |> ignore
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(64, 64)
    let target = @three.WebGLRenderTarget(64, 64)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    let pixel = Bytes::new(4)
    renderer.read_render_target_pixels(target, 32, 32, 1, 1, pixel)
    renderer.set_render_target(None)
    pixel
  })
}
