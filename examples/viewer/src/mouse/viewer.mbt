///|
enum Character {
  Mouse
  Rabbit
  Purple
}

///|
suberror ViewerError {
  ViewerError(String)
} derive(Debug)

///|
pub struct Viewer {
  renderer : @three.WebGLRenderer
  scene : @three.Scene
  camera : @three.PerspectiveCamera
  controls : @three.OrbitControls
  mut model : @three.Object3D
  mut character : Character
  mut wireframe : Bool
  shadow : @three.LightShadow
  mut disposed : Bool
}

///|
pub fn create_viewer(canvas : @three.Canvas) -> @js_async.Promise[Viewer] {
  @js_async.Promise::from_async(() => {
    let model = @rabbit.create()
    let renderer = @three.WebGLRenderer::with_canvas(canvas, antialias=true)
    renderer.set_clear_color(@three.Color::from_hex(0xeeeae3), 1)
    renderer.set_shadows_enabled(true)
    renderer.set_shadow_map_type(@three.PCF)
    renderer.set_tone_mapping(@three.ACESFilmicToneMapping)
    renderer.set_tone_mapping_exposure(1.2)
    let scene = @three.Scene()
    scene.add(model) |> ignore
    let floor_material = @three.ShadowMaterial().as_material()
    floor_material.set_opacity(0.13)
    let floor = @three.Mesh(
      @three.PlaneGeometry(200, 200).as_buffer_geometry(),
      floor_material,
    ).as_object3d()
    floor.set_name("studio-floor")
    floor.position().set_y(-0.012) |> ignore
    floor.set_receive_shadow(true)
    scene.add(floor) |> ignore
    floor.rotate_x(-@math.PI / 2) |> ignore
    floor.set_cast_shadow(false)
    let sky = @three.HemisphereLight(0xffffff, 0xb1a394, 2.5)
    scene.add(sky.as_object3d()) |> ignore
    let key = @three.DirectionalLight(0xfff2df, 3.5)
    key.position().set(-3, 7, 5) |> ignore
    key.set_cast_shadow(true)
    let shadow = key.shadow()
    shadow.map_size().set(2048, 2048) |> ignore
    shadow.set_normal_bias(0.035)
    if shadow.camera().as_orthographic_camera() is Some(camera) {
      camera.set_left(-4)
      camera.set_right(4)
      camera.set_top(4)
      camera.set_bottom(-4)
      camera.update_projection_matrix()
    }
    scene.add(key.as_object3d()) |> ignore
    let camera = @three.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position().set(4.6, 3.2, 5.8) |> ignore
    let controls = @three.OrbitControls(camera.as_camera(), canvas)
    controls.target().set(0.15, 1.0, -0.25) |> ignore
    controls.set_enable_pan(false)
    controls.set_min_distance(4)
    controls.set_max_distance(13)
    controls.set_max_polar_angle(@math.PI / 2 - 0.04)
    controls.update(0) |> ignore
    controls.save_state()
    let viewer = {
      renderer,
      scene,
      camera,
      controls,
      model,
      character: Rabbit,
      wireframe: false,
      shadow,
      disposed: false,
    }
    fit_view(viewer)
    viewer
  })
}

///|
fn fit_view(viewer : Viewer) -> Unit {
  match viewer.character {
    Mouse => {
      viewer.renderer.set_tone_mapping_exposure(1.2)
      viewer.camera.position().set(4.6, 3.2, 5.8) |> ignore
      viewer.controls.target().set(0.15, 1.0, -0.25) |> ignore
    }
    Purple => {
      viewer.renderer.set_tone_mapping_exposure(0.75)
      viewer.camera.position().set(1.4, 2.35, 9.8) |> ignore
      viewer.controls.target().set(0, 1.9, 0) |> ignore
    }
    Rabbit => {
      viewer.renderer.set_tone_mapping_exposure(0.65)
      viewer.camera.position().set(2.7, 2.4, 9.0) |> ignore
      viewer.controls.target().set(0, 1.83, 0) |> ignore
    }
  }
  viewer.controls.update(0) |> ignore
  viewer.controls.save_state()
}

///|
fn build_character(character : Character) -> @three.Object3D raise {
  match character {
    Mouse => make_mouse()
    Rabbit => @rabbit.create()
    Purple => @purple.create()
  }
}

///|
pub fn select_model(viewer : Viewer, name : String) -> @js_async.Promise[Unit] {
  @js_async.Promise::from_async(() => {
    if viewer.disposed {
      raise ViewerError("Viewer is disposed")
    }
    let character = match name {
      "mouse" => Mouse
      "rabbit" => Rabbit
      "purple" => Purple
      _ => raise ViewerError("Unknown character: \{name}")
    }
    // Build before removing the current model, so a failure leaves it usable.
    let model = build_character(character)
    viewer.scene.remove(viewer.model) |> ignore
    @parts.dispose(viewer.model)
    viewer.model = model
    viewer.character = character
    viewer.scene.add(model) |> ignore
    set_wireframe(viewer, viewer.wireframe)
    fit_view(viewer)
  })
}

///|
pub fn resize(
  viewer : Viewer,
  width : Int,
  height : Int,
  pixel_ratio : Double,
) -> Unit {
  if viewer.disposed || width <= 0 || height <= 0 {
    return
  }
  viewer.renderer.set_pixel_ratio(pixel_ratio.clamp(min=1, max=2))
  viewer.renderer.set_size(width, height, update_style=false)
  viewer.camera.set_aspect(width.to_double() / height.to_double())
  viewer.camera.update_projection_matrix()
}

///|
pub fn render(viewer : Viewer) -> Unit {
  if viewer.disposed {
    return
  }
  viewer.controls.update(0) |> ignore
  viewer.renderer.render(viewer.scene, viewer.camera.as_camera())
}

///|
pub fn reset_view(viewer : Viewer) -> Unit {
  if !viewer.disposed {
    viewer.controls.reset()
  }
}

///|
/// Keyboard navigation shares the orbit target and distance limits with the mouse.
pub fn navigate(viewer : Viewer, key : String) -> Bool {
  if viewer.disposed {
    return false
  }
  let offset = viewer.camera
    .as_object3d()
    .position()
    .clone()
    .sub(viewer.controls.target())
  let spherical = @three.Spherical(1, 0, 0).set_from_vector3(offset)
  match key {
    "ArrowLeft" => spherical.set_theta(spherical.theta() - 0.12)
    "ArrowRight" => spherical.set_theta(spherical.theta() + 0.12)
    "ArrowUp" =>
      spherical.set_phi(
        (spherical.phi() - 0.10).clamp(min=0.05, max=@math.PI / 2 - 0.04),
      )
    "ArrowDown" =>
      spherical.set_phi(
        (spherical.phi() + 0.10).clamp(min=0.05, max=@math.PI / 2 - 0.04),
      )
    "+" | "=" =>
      spherical.set_radius((spherical.radius() * 0.9).clamp(min=4, max=13))
    "-" => spherical.set_radius((spherical.radius() / 0.9).clamp(min=4, max=13))
    "r" | "R" => {
      reset_view(viewer)
      return true
    }
    _ => return false
  }
  viewer.camera
  .as_object3d()
  .position()
  .set_from_spherical(spherical)
  .add(viewer.controls.target())
  |> ignore
  viewer.controls.update(0) |> ignore
  true
}

///|
pub fn set_wireframe(viewer : Viewer, enabled : Bool) -> Unit {
  if viewer.disposed {
    return
  }
  viewer.wireframe = enabled
  viewer.model.traverse(fn(object) {
    if object.as_mesh() is Some(mesh) {
      for material in mesh.materials() {
        if material.as_standard_material() is Some(standard) {
          standard.set_wireframe(enabled)
        }
      }
    }
  })
}

///|
pub fn triangle_count(viewer : Viewer) -> Int {
  let mut count = 0
  viewer.model.traverse(fn(object) {
    if object.as_mesh() is Some(mesh) {
      let geometry = mesh.geometry()
      if geometry.get_index() is Some(index) {
        count += index.count() / 3
      } else if geometry.get_attribute("position") is Some(position) {
        count += position.count() / 3
      }
    }
  })
  count
}

///|
pub fn export_mouse() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(async fn() {
    // A fresh model keeps export independent of wireframe and viewer disposal.
    let mouse = make_mouse()
    defer @parts.dispose(mouse)
    @three.GLTFExporter().export_glb(mouse)
  })
}

///|
pub fn export_model(viewer : Viewer) -> @js_async.Promise[Bytes] {
  let character = viewer.character
  @js_async.Promise::from_async(async fn() {
    let model = build_character(character)
    defer @parts.dispose(model)
    @three.GLTFExporter().export_glb(model)
  })
}

///|
pub fn dispose(viewer : Viewer) -> Unit {
  if viewer.disposed {
    return
  }
  viewer.disposed = true
  viewer.controls.dispose()
  @parts.dispose(viewer.scene.as_object3d())
  viewer.shadow.dispose()
  viewer.renderer.dispose()
  viewer.renderer.force_context_loss()
}

///|
fn main {

}
