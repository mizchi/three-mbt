///|
let rings : @signals.Signal[Int] = @reactivity.signal(5)

///|
let radius : @signals.Signal[Double] = @reactivity.signal(1.2)

///|
let warm : @signals.Signal[Bool] = @reactivity.signal(false)

///|
let visible : @signals.Signal[Bool] = @reactivity.signal(true)

///|
let mounted : Ref[@lt.Root?] = Ref(None)

///|
fn sculpture() -> @lt.Node {
  @lt.group(
    [
      @lt.mesh(
        geometry=Cylinder(0.8, 1, 0.3, 64),
        material=Standard(0x334155, 0.65, 0.3),
        props=[@lt.prop(Name("base")), @lt.prop(Position(0, -1.5, 0))],
      ),
      @luna.for_each(fn() {
        Array::makei(rings.get(), fn(index) {
          @lt.mesh(
            key="ring-\{index}",
            geometry=Torus(1.2, 0.09, 16, 64),
            material=Standard(0x49c6bb, 0.25, 0.65),
            props=[
              @lt.prop(Name("ring-\{index}")),
              @lt.prop(Position(0, index.to_double() * 0.32 - 1, 0)),
              @lt.prop(
                Rotation(1.5707963267948966, index.to_double() * 0.12, 0),
              ),
              @lt.dynamic(fn() { Geometry(Torus(radius.get(), 0.09, 16, 64)) }),
              @lt.dynamic(fn() {
                Material(
                  Standard(
                    if warm.get() {
                      0xffb86b
                    } else {
                      0x49c6bb
                    },
                    0.25,
                    0.65,
                  ),
                )
              }),
            ],
          )
        })
      }),
      @lt.mesh(
        geometry=Sphere(0.42, 32, 24),
        material=Standard(0xf2f5f9, 0.2, 0.4),
      ),
    ],
    props=[@lt.prop(Name("sculpture"))],
  )
}

///|
pub fn mount(scene : @three.Scene) -> Unit {
  unmount()
  rings.set(5)
  radius.set(1.2)
  warm.set(false)
  visible.set(true)
  mounted.val = Some(
    @lt.mount(
      scene.as_object3d(),
      @luna.fragment([
        @lt.ambient_light(intensity=2),
        @lt.directional_light(intensity=4, props=[@lt.prop(Position(3, 5, 4))]),
        @lt.directional_light(color=0x88aaff, intensity=3, props=[
          @lt.prop(Position(-4, 1, -2)),
        ]),
        @luna.show(fn() { visible.get() }, fn() { @luna.component(sculpture) }),
      ]),
    ),
  )
}

///|
pub fn set_ring_count(count : Int) -> Unit {
  rings.set(count.clamp(min=2, max=9))
}

///|
pub fn set_radius(value : Double) -> Unit {
  radius.set(value.clamp(min=0.7, max=1.6))
}

///|
pub fn toggle_palette() -> Unit {
  warm.set(!warm.get())
}

///|
pub fn toggle_visible() -> Unit {
  visible.set(!visible.get())
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
