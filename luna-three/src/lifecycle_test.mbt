///|
extern "js" fn on_geometry_dispose(
  value : @three.BufferGeometry,
  callback : () -> Unit,
) -> Unit =
  #| (value, callback) => { value.addEventListener('dispose', callback); }

///|
extern "js" fn on_material_dispose(
  value : @three.Material,
  callback : () -> Unit,
) -> Unit =
  #| (value, callback) => { value.addEventListener('dispose', callback); }

///|
test "geometry replacement disposes once and material values update in place" {
  let width = @reactivity.signal(1.0)
  let color = @reactivity.signal(0xff0000)
  let basic = @reactivity.signal(false)
  let renders = Ref(0)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.component(fn() {
      renders.val += 1
      @luna_three.mesh(geometry=Box(1, 1, 1), material=Normal, props=[
        @luna_three.dynamic(fn() { Geometry(Box(width.get(), 1, 1)) }),
        @luna_three.dynamic(fn() {
          Material(
            if basic.get() {
              Basic(color.get())
            } else {
              Standard(color.get(), 0.6, 0.2)
            },
          )
        }),
      ])
    }),
  )
  let mesh = scene.children()[0].as_mesh().unwrap()
  let old_geometry = mesh.geometry()
  let old_material = mesh.materials()[0]
  let disposed = Ref(0)
  on_geometry_dispose(old_geometry, fn() { disposed.val += 1 })
  on_material_dispose(old_material, fn() { disposed.val += 1 })
  color.set(0x00ff00)
  assert_eq(mesh.materials()[0].id(), old_material.id())
  assert_eq(
    old_material.as_standard_material().unwrap().color().get_hex(),
    0x00ff00,
  )
  assert_eq(mesh.geometry().id(), old_geometry.id())
  width.set(2)
  assert_eq(disposed.val, 1)
  assert_true(mesh.geometry().id() != old_geometry.id())
  basic.set(true)
  assert_eq(disposed.val, 2)
  assert_true(mesh.materials()[0].as_basic_material() is Some(_))
  on_geometry_dispose(mesh.geometry(), fn() { disposed.val += 1 })
  on_material_dispose(mesh.materials()[0], fn() { disposed.val += 1 })
  root.unmount()
  root.unmount()
  assert_eq(disposed.val, 4)
  assert_eq(renders.val, 1)
}

///|
test "borrowed resources and primitive descendants remain caller-owned" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  let object = @three.Mesh(geometry, material).as_object3d()
  let external_child = @three.Object3D()
  object.add(external_child) |> ignore
  let disposed = Ref(0)
  on_geometry_dispose(geometry, fn() { disposed.val += 1 })
  on_material_dispose(material, fn() { disposed.val += 1 })
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.fragment([
      @luna_three.primitive(object, children=[@luna_three.group([])]),
      @luna_three.mesh(geometry=Borrowed(geometry), material=Borrowed(material)),
    ]),
  )
  assert_eq(object.children().length(), 2)
  root.unmount()
  assert_eq(disposed.val, 0)
  assert_eq(object.children().length(), 1)
  assert_true(object.children()[0].same_reference(external_child))
  geometry.dispose()
  material.dispose()
  assert_eq(disposed.val, 2)
}

///|
test "invalid reactive properties and duplicate keys retain valid state and recover" {
  let invalid = @reactivity.signal(false)
  let duplicate = @reactivity.signal(false)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.for_each(fn() {
      let node = @luna_three.group([], key="a", props=[
        @luna_three.dynamic(fn() {
          if invalid.get() {
            Geometry(Box(1, 1, 1))
          } else {
            Position(2, 0, 0)
          }
        }),
      ])
      if duplicate.get() {
        [node, node]
      } else {
        [node]
      }
    }),
  )
  let object = scene.children()[0]
  invalid.set(true)
  assert_true(root.error() is Some(_))
  assert_eq(object.position().x(), 2)
  invalid.set(false)
  assert_true(root.error() is None)
  duplicate.set(true)
  assert_true(root.error() is Some(_))
  assert_eq(scene.children().length(), 1)
  duplicate.set(false)
  assert_true(root.error() is None)
  assert_true(scene.children()[0].same_reference(object))
  root.unmount()
}

///|
test "root follows its Luna owner and removes all signal subscriptions" {
  let x = @reactivity.signal(1.0)
  let reads = Ref(0)
  let scene = @three.Scene().as_object3d()
  let (_, dispose) = @reactivity.create_root_with_dispose(fn() {
    @luna_three.mount(
      scene,
      @luna_three.group([], props=[
        @luna_three.dynamic(fn() {
          reads.val += 1
          Position(x.get(), 0, 0)
        }),
      ]),
    )
  })
  x.set(2)
  assert_eq(reads.val, 2)
  dispose()
  assert_eq(scene.children().length(), 0)
  x.set(3)
  assert_eq(reads.val, 2)
}

///|
test "one primitive cannot occupy two slots or contain its host" {
  let scene = @three.Scene().as_object3d()
  let object = @three.Object3D()
  let root = @luna_three.mount(
    scene,
    @luna.fragment([
      @luna_three.primitive(object),
      @luna_three.primitive(object),
    ]),
  )
  assert_true(root.error() is Some(_))
  root.unmount()
  let cycle = @luna_three.mount(scene, @luna_three.primitive(scene))
  assert_true(cycle.error() is Some(_))
  assert_eq(scene.children().length(), 0)
  cycle.unmount()
}

///|
test "changing a primitive key releases the previous slot before mounting" {
  let key = @reactivity.signal("a")
  let scene = @three.Scene().as_object3d()
  let object = @three.Object3D()
  let root = @luna_three.mount(
    scene,
    @luna.for_each(fn() { [@luna_three.primitive(object, key=key.get())] }),
  )
  key.set("b")
  assert_true(root.error() is None)
  assert_eq(scene.children().length(), 1)
  assert_true(scene.children()[0].same_reference(object))
  root.unmount()
}

///|
test "a corrected initial property mounts its deferred children" {
  let valid = @reactivity.signal(false)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.h(
      "mesh",
      [
        ("material", @luna_three.prop(Material(Normal))),
        (
          "geometry",
          @luna_three.dynamic(fn() {
            if valid.get() {
              Geometry(Box(1, 1, 1))
            } else {
              Visible(true)
            }
          }),
        ),
      ],
      [@luna_three.group([], props=[@luna_three.prop(Name("child"))])],
    ),
  )
  assert_true(root.error() is Some(_))
  assert_eq(scene.children().length(), 0)
  valid.set(true)
  assert_true(root.error() is None)
  assert_true(scene.get_object_by_name("child") is Some(_))
  root.unmount()
}

///|
test "host invalidation does not subscribe element effects to host signals" {
  let x = @reactivity.signal(0.0)
  let host = @reactivity.signal(0)
  let reads = Ref(0)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna_three.group([], props=[
      @luna_three.dynamic(fn() {
        reads.val += 1
        Position(x.get(), 0, 0)
      }),
    ]),
    on_change=fn() { host.get() |> ignore },
  )
  x.set(1)
  assert_eq(reads.val, 2)
  host.set(2)
  assert_eq(reads.val, 2)
  root.unmount()
}
