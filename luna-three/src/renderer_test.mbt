///|
test "Luna nodes build a typed scene and reactive props preserve the mesh" {
  let x = @reactivity.signal(1.0)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.component(fn() {
      @luna_three.group(
        [
          @luna_three.mesh(
            geometry=Box(2, 3, 4),
            material=Standard(0xff0000, 0.5, 0.0),
            props=[
              @luna_three.prop(Name("box")),
              @luna_three.dynamic(fn() { Position(x.get(), 0, 0) }),
            ],
          ),
        ],
        props=[@luna_three.prop(Position(10, 0, 0))],
      )
    }),
  )
  let box = scene.get_object_by_name("box").unwrap()
  assert_eq(box.get_world_position(@three.Vector3(0, 0, 0)).x(), 11)
  let mesh = box.as_mesh().unwrap()
  let geometry_id = mesh.geometry().id()
  x.set(4)
  assert_true(scene.get_object_by_name("box").unwrap().same_reference(box))
  assert_eq(box.position().x(), 4)
  assert_eq(mesh.geometry().id(), geometry_id)
  root.unmount()
  root.unmount()
  assert_eq(scene.children().length(), 0)
  x.set(8)
  assert_eq(box.position().x(), 4)
}

///|
test "keyed Luna lists reorder objects and reset removed props" {
  let order = @reactivity.signal(["a", "b"])
  let shifted = @reactivity.signal(true)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.for_each(fn() {
      order
      .get()
      .map(fn(key) {
        let props = [@luna_three.prop(Name(key))]
        if shifted.get() {
          props.push(@luna_three.prop(Position(3, 0, 0)))
        }
        @luna_three.mesh(
          key~,
          geometry=Box(1, 1, 1),
          material=Basic(0xffffff),
          props~,
        )
      })
    }),
  )
  let a = scene.children()[0]
  let b = scene.children()[1]
  order.set(["b", "a"])
  assert_true(scene.children()[0].same_reference(b))
  assert_true(scene.children()[1].same_reference(a))
  shifted.set(false)
  assert_eq(a.position().x(), 0)
  order.set(["a"])
  assert_eq(scene.children().length(), 1)
  assert_true(b.parent() is None)
  root.unmount()
}

///|
test "Show owns component cleanup and preserves unrelated scene children" {
  let visible = @reactivity.signal(true)
  let scene = @three.Scene().as_object3d()
  let external = @three.Object3D()
  scene.add(external) |> ignore
  let cleanups = Ref(0)
  let root = @luna_three.mount(
    scene,
    @luna.show(fn() { visible.get() }, fn() {
      @luna.component(fn() {
        @reactivity.on_cleanup(fn() { cleanups.val += 1 })
        @luna_three.group([])
      })
    }),
  )
  assert_eq(scene.children().length(), 2)
  visible.set(false)
  assert_eq(cleanups.val, 1)
  assert_eq(scene.children().length(), 1)
  visible.set(true)
  root.unmount()
  assert_eq(cleanups.val, 2)
  assert_true(scene.children()[0].same_reference(external))
}

///|
test "cached Luna components retain their scopes across list updates" {
  let renders = Ref(0)
  let extra = @reactivity.signal(false)
  let cached = @luna.component(fn() {
    renders.val += 1
    @luna_three.group([])
  })
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.for_each(fn() {
      if extra.get() {
        [cached, @luna_three.group([])]
      } else {
        [cached]
      }
    }),
  )
  let object = scene.children()[0]
  extra.set(true)
  assert_eq(renders.val, 1)
  assert_true(scene.children()[0].same_reference(object))
  root.unmount()
}

///|
test "Switch preserves its branch and camera properties update the projection" {
  let selected = @reactivity.signal(1)
  let aspect = @reactivity.signal(1.0)
  let mounts = Ref(0)
  let scene = @three.Scene().as_object3d()
  let root = @luna_three.mount(
    scene,
    @luna.switch_(
      cases=[
        @luna.match_case(when=fn() { selected.get() > 0 }, render=fn() {
          mounts.val += 1
          @luna_three.perspective_camera(props=[
            @luna_three.dynamic(fn() { Perspective(60, aspect.get(), 0.2, 100) }),
          ])
        }),
      ],
      fallback=Some(fn() {
        @luna_three.ambient_light(color=0xff0000, intensity=3)
      }),
    ),
  )
  let object = scene.children()[0]
  let camera = object.as_camera().unwrap().as_perspective_camera().unwrap()
  assert_eq(camera.aspect(), 1)
  aspect.set(2)
  assert_eq(camera.aspect(), 2)
  assert_eq(camera.fov(), 60)
  selected.set(2)
  assert_eq(mounts.val, 1)
  assert_true(scene.children()[0].same_reference(object))
  selected.set(0)
  assert_eq(scene.children()[0].as_light().unwrap().intensity(), 3)
  assert_true(object.parent() is None)
  root.unmount()
}
