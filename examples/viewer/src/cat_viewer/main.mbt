///|
let head_tilt : @signals.Signal[Double] = @reactivity.signal(0)

///|
let tail_angle : @signals.Signal[Double] = @reactivity.signal(0)

///|
let eyes_open : @signals.Signal[Double] = @reactivity.signal(1)

///|
let palette : @signals.Signal[Int] = @reactivity.signal(0)

///|
let base_tail : Ref[Double] = Ref(0)

///|
let motion : Ref[Bool] = Ref(true)

///|
let mounted : Ref[@lt.Root?] = Ref(None)

///|
pub fn mount(scene : @three.Scene) -> Unit {
  unmount()
  head_tilt.set(-5 * @math.PI / 180)
  tail_angle.set(0)
  eyes_open.set(1)
  palette.set(0)
  base_tail.val = 0
  motion.val = true
  mounted.val = Some(
    @lt.mount(
      scene.as_object3d(),
      @luna.fragment([
        @lt.ambient_light(color=0xfff4e5, intensity=1.6),
        @lt.directional_light(color=0xfff4e9, intensity=3, props=[
          @lt.prop(Name("key-light")),
          @lt.prop(Position(-3, 7, 5)),
          @lt.prop(CastShadow(true)),
        ]),
        @lt.directional_light(color=0xe3edff, intensity=2, props=[
          @lt.prop(Position(4, 3, -3)),
        ]),
        @lt.mesh(
          geometry=Cylinder(1.70, 1.70, 0.20, 48),
          material=Standard(0xe0d0b9, 0.95, 0),
          props=[
            @lt.prop(Name("studio-plinth")),
            @lt.prop(Position(0, -0.11, 0)),
            @lt.prop(ReceiveShadow(true)),
            @lt.prop(CastShadow(true)),
          ],
        ),
        @lt.mesh(geometry=Plane(200, 200), material=Standard(0xf0e6d7, 1, 0), props=[
          @lt.prop(Name("studio-floor")),
          @lt.prop(Position(0, -0.22, 0)),
          @lt.prop(Rotation(-@math.PI / 2, 0, 0)),
          @lt.prop(ReceiveShadow(true)),
        ]),
        @cat.view(
          head_tilt=fn() { head_tilt.get() },
          tail_angle=fn() { tail_angle.get() },
          eyes_open=fn() { eyes_open.get() },
          palette=fn() { palette.get() },
        ),
      ]),
    ),
  )
}

///|
pub fn set_palette(value : Int) -> Unit {
  palette.set(value.clamp(min=0, max=2))
}

///|
pub fn set_head_tilt(degrees : Double) -> Unit {
  head_tilt.set(degrees.clamp(min=-18, max=18) * @math.PI / 180)
}

///|
pub fn set_tail_angle(degrees : Double) -> Unit {
  base_tail.val = degrees.clamp(min=-35, max=35) * @math.PI / 180
  tail_angle.set(base_tail.val)
}

///|
pub fn set_motion(enabled : Bool) -> Unit {
  motion.val = enabled
  if !enabled {
    eyes_open.set(1)
  }
}

///|
pub fn tick(seconds : Double) -> Unit {
  if !motion.val {
    return
  }
  let phase = seconds - (seconds / 4.8).floor() * 4.8
  tail_angle.set(base_tail.val + @math.sin(seconds * 1.5) * 0.18)
  eyes_open.set(if phase < 0.18 { (phase - 0.09).abs() / 0.09 } else { 1 })
}

///|
pub fn error() -> String {
  match mounted.val {
    Some(root) => root.error().unwrap_or("")
    None => ""
  }
}

///|
pub fn unmount() -> Unit {
  if mounted.val is Some(root) {
    root.unmount()
  }
  mounted.val = None
}

///|
fn main {

}
