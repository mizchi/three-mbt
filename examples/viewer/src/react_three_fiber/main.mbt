///|
let current_state : Ref[@r3f.RootState?] = Ref(None)

///|
let frames : Ref[Int] = Ref(0)

///|
let cleanups : Ref[Int] = Ref(0)

///|
fn spinning_box() -> @r3f.Node {
  let mesh = @r3f.use_object_ref()
  let clicks = @r3f.use_state(0)
  let width = @r3f.use_three_select(fn(state) { state.size().width() })
  @r3f.use_effect(fn() { fn() { cleanups.val += 1 } }, [])
  @r3f.use_frame(fn(_state, delta) {
    frames.val += 1
    if mesh.current() is Some(object) {
      object.rotate_y(delta * 0.5) |> ignore
    }
  })
  let props = @r3f.Props()
    ..set_name("fiber-box")
    ..set_ref(mesh)
    ..set_uniform_scale(if width < 300 { 0.8 } else { 1.0 })
    ..on_click(fn(event) {
      event.stop_propagation()
      clicks.update(fn(value) { value + 1 })
    })
  let geometry = @r3f.Props()..set_args([
    @r3f.Arg::number(1),
    @r3f.Arg::number(1),
    @r3f.Arg::number(1),
  ])
  let material = @r3f.Props()..set_color(
    if clicks.value() % 2 == 0 {
      0xad207b
    } else {
      0x33aa66
    },
  )
  @r3f.mesh(props, [
    @r3f.box_geometry(geometry),
    @r3f.mesh_basic_material(material),
  ])
}

///|
/// React calls this beneath Suspense. useLoader owns the cache, not GPU disposal.
fn loaded_asset(url : String) -> @r3f.Node {
  let gltf = @r3f.use_loader(@r3f.Loader::gltf(), url)
  let object = gltf.scene().unwrap().as_object3d()
  @r3f.primitive(
    @r3f.Props()
    ..set_object(object)
    ..set_name("loaded-asset")
    ..set_position_xyz(3, 0, 0)
    ..set_dispose_automatic(false),
  )
}

///|
/// Called once by the JS host. Component types stay stable across React renders.
pub fn app(asset_url : String) -> @r3f.Node {
  let box = @r3f.component(spinning_box)
  let asset = @r3f.component(fn() { loaded_asset(asset_url) })
  let camera = @r3f.CameraProps()..set_position_xyz(0, 0, 5)..set_fov(45)
  let props = @r3f.CanvasProps()
    ..set_camera_options(camera)
    ..set_dpr(1)
    ..set_frameloop(Always)
    ..set_style_size("100%", "100%")
    ..on_created(fn(state) { current_state.val = Some(state) })
  @r3f.canvas(props, [
    box.element(),
    @r3f.suspense(@r3f.empty(), [asset.element()]),
  ])
}

///|
pub fn state() -> @r3f.RootState {
  current_state.val.unwrap()
}

///|
pub fn frame_count() -> Int {
  frames.val
}

///|
pub fn cleanup_count() -> Int {
  cleanups.val
}

///|
pub fn clear_asset_cache(url : String) -> Unit {
  @r3f.Loader::gltf().clear(url)
}

///|
fn main {

}

///|
/// Demonstrates typed memo/ref/function state and manual rendering ownership.
fn manual_box() -> @r3f.Node {
  let value = @r3f.use_state(fn() { 1 })
  let updates = @r3f.use_ref(0)
  let calculate = value.value()
  let doubled = @r3f.use_memo(fn() { calculate() * 2 }, [
    @r3f.Dependency::of(calculate),
  ])
  @r3f.use_frame(
    fn(state, _delta) {
      frames.val += 1
      state.gl().render(state.scene(), state.camera())
    },
    priority=1,
  )
  @r3f.mesh(
    @r3f.Props()
    ..set_name("value-\{calculate()}-memo-\{doubled}-ref-\{updates.current()}")
    ..on_click(fn(_event) {
      updates.set(updates.current() + 1)
      value.set(fn() { 7 })
    }),
    [
      @r3f.box_geometry(@r3f.Props()),
      @r3f.mesh_basic_material(@r3f.Props()..set_color(0x33aa66)),
    ],
  )
}

///|
pub fn mount_manual(
  canvas : @three.Canvas,
) -> @js_async.Promise[@r3f.FiberRoot] {
  @js_async.Promise::from_async(async fn() {
    @r3f.register_three()
    let root = @r3f.create_root(canvas)
    let camera = @r3f.CameraProps()..set_position_xyz(0, 0, 5)
    let options = @r3f.RootOptions()
      ..set_camera_options(camera)
      ..set_size(200, 200, 0, 0)
      ..set_dpr(1)
      ..set_pointer_events()
      ..set_frameloop(Never)
      ..on_created(fn(state) { current_state.val = Some(state) })
    root.configure(options).wait()
    root.render(@r3f.component(manual_box).element()) |> ignore
    root
  })
}
