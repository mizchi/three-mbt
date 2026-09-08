///|
let control_session : Ref[
  (
    @three.OrbitControls,
    @three.TransformControls,
    @three.PointerLockControls,
    @three.EventSubscription,
  )?,
] = Ref(None)

///|
let control_changes : Ref[Int] = Ref(0)

///|
pub fn setup_controls() -> Unit {
  let canvas = @three.Canvas()
  canvas.append_to_body()
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 3) |> ignore
  let orbit = @three.MapControls(camera.as_camera(), canvas).as_orbit_controls()
  orbit.set_max_distance(4)
  let transform = @three.TransformControls(camera.as_camera(), canvas)
  let node = @three.Object3D()
  let scene = @three.Scene()
  scene.as_object3d().add(node).add(transform.get_helper()) |> ignore
  scene.as_object3d().update_matrix_world(true)
  transform.attach(node) |> ignore
  let subscription = transform.on_change(fn() { control_changes.val += 1 })
  transform.set_mode(Rotate)
  transform.set_space(Local)
  transform.set_rotation_snap(Some(0.5))
  let pointer = @three.PointerLockControls(camera.as_camera(), canvas)
  control_session.val = Some((orbit, transform, pointer, subscription))
}

///|
pub fn controls_state() -> FixedArray[Double] {
  let (orbit, transform, pointer, _) = control_session.val.unwrap()
  [
    orbit.get_distance(),
    if transform.object() is Some(_) {
      1
    } else {
      0
    },
    control_changes.val.to_double(),
    if pointer.is_locked() {
      1
    } else {
      0
    },
  ]
}

///|
pub fn lock_pointer() -> Unit {
  let (orbit, _, pointer, _) = control_session.val.unwrap()
  orbit.set_enabled(false)
  pointer.lock(false)
}

///|
pub fn unlock_pointer() -> Unit {
  let (_, _, pointer, _) = control_session.val.unwrap()
  pointer.unlock()
}

///|
pub fn dispose_controls() -> Unit {
  let (orbit, transform, pointer, subscription) = control_session.val.unwrap()
  subscription.unsubscribe()
  transform.detach() |> ignore
  transform.dispose()
  orbit.dispose()
  pointer.dispose()
  control_session.val = None
}
