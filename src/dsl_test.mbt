///|
test "cascade builds a concrete mesh in order and evaluates the receiver once" {
  let geometry = @three.BoxGeometry(1, 2, 3)
  defer geometry.dispose()
  let material = @three.MeshStandardMaterial(0xad207b)
    ..set_transparent(true)
    ..set_opacity(0.5)
  defer material.dispose()
  let parent = @three.Group()
  let offset = @three.Vector3(1, 2, 3)
  let mut calls = 0
  let make_mesh = fn() {
    calls += 1
    @three.Mesh(geometry.as_buffer_geometry(), material.as_material())
  }
  let mesh : @three.Mesh = make_mesh()
    ..set_name("cascade-mesh")
    ..set_position(offset + @three.Vector3(1, 0, -1))
    ..set_scale_xyz(2, 3, 4)
    ..set_uniform_scale(0.5)
    ..set_cast_shadow(true)
    ..add_to(parent.as_object3d())
  assert_eq(calls, 1)
  assert_eq(mesh.name(), "cascade-mesh")
  assert_true(mesh.position().equals(@three.Vector3(2, 2, 2)))
  assert_true(mesh.scale().equals(@three.Vector3(0.5, 0.5, 0.5)))
  assert_true(mesh.cast_shadow())
  assert_true(parent.children()[0].same_reference(mesh.as_object3d()))
  assert_true(offset.equals(@three.Vector3(1, 2, 3)))
  assert_eq(material.opacity(), 0.5)
}

///|
test "transform setters copy values while preserving live references and Euler order" {
  let node = @three.Object3D()
  let position = node.position()
  let scale = node.scale()
  let rotation = node.rotation()
  let quaternion = node.quaternion()
  let input = @three.Vector3(2, 3, 4)
  let angles = @three.Euler(0.1, 0.2, 0.3, order=ZYX)
  node
  ..set_position(input)
  ..set_scale(input)
  ..set_rotation(angles)
  ..set_rotation_xyz(0.3, 0.2, 0.1)
  |> ignore
  assert_true(position.same_reference(node.position()))
  assert_true(scale.same_reference(node.scale()))
  assert_true(rotation.same_reference(node.rotation()))
  assert_true(quaternion.same_reference(node.quaternion()))
  assert_eq(node.rotation().order(), @three.ZYX)
  assert_true(
    node
    .quaternion()
    .equals(
      @three.Quaternion().set_from_euler(@three.Euler(0.3, 0.2, 0.1, order=ZYX)),
    ),
  )
  input.set(9, 9, 9) |> ignore
  assert_true(position.equals(@three.Vector3(2, 3, 4)))
  assert_true(scale.equals(@three.Vector3(2, 3, 4)))
  assert_eq(angles.x(), 0.1)
  let orientation = @three.Quaternion().set_from_euler(@three.Euler(0, 0.5, 0))
  node..set_quaternion(orientation)..set_position_xyz(4, 5, 6) |> ignore
  assert_true(quaternion.equals(orientation))
  assert_true(position.equals(@three.Vector3(4, 5, 6)))
  assert_true(rotation.same_reference(node.rotation()))
  // Native setters still drive Euler/quaternion synchronization.
  assert_true(
    @three.Quaternion().set_from_euler(rotation).angle_to(orientation) <
    0.000001,
  )
}

///|
test "cascade parenting preserves reparenting, insertion order, and receiver identity" {
  let first = @three.Group()
  let second = @three.Scene()
  let a = @three.Object3D()..set_name("a")
  let b = @three.Object3D()..set_name("b")
  let c = @three.Object3D()..set_name("c")
  let events : Array[String] = []
  let added = b.on_added(fn() { events.push("added") })
  let removed = b.on_removed(fn() { events.push("removed") })
  defer added.unsubscribe()
  defer removed.unsubscribe()
  let configured = first..add_child(a)..add_children([b, c])
  assert_true(configured.as_object3d().same_reference(first.as_object3d()))
  assert_eq(first.children().length(), 3)
  assert_eq(first.children()[1].name(), "b")
  let moved = b..add_to(second.as_object3d())
  assert_true(moved.same_reference(b))
  assert_eq(first.children().length(), 2)
  assert_true(second.children()[0].same_reference(b))
  assert_eq(events.length(), 3)
  assert_eq(events[0], "added")
  assert_eq(events[1], "removed")
  assert_eq(events[2], "added")
  first..remove_child(a) |> ignore
  assert_true(a.parent() is None)
  second..remove_child(b) |> ignore
  assert_true(b.parent() is None)
  assert_eq(events.length(), 4)
  assert_eq(events[3], "removed")
  assert_true(first.add(a).same_reference(first.as_object3d()))
}

///|
test "DSL setters preserve native manual matrix update behavior" {
  let node = @three.Object3D()
    ..set_matrix_auto_update(false)
    ..set_position_xyz(4, 5, 6)
  assert_eq(node.matrix().elements()[12], 0)
  node..update_matrix() |> ignore
  assert_eq(node.matrix().elements()[12], 4)
  assert_eq(node.matrix().elements()[13], 5)
  assert_eq(node.matrix().elements()[14], 6)
}

///|
test "constructors and child lists retain concrete types and shared resources" {
  let geometry = @three.BoxGeometry(1, 2, 3).as_buffer_geometry()
  defer geometry.dispose()
  let material = @three.MeshStandardMaterial(0xad207b).as_material()
  defer material.dispose()
  let body : @three.Mesh = @three.Mesh(geometry, material)
    ..set_name("body")
    ..set_position_xyz(0, 1, 0)
  let eye = @three.Mesh(geometry, material)..set_name("eye")
  let head : @three.Group = @three.Group()
    ..set_name("head")
    ..add_children([eye.as_object3d()])
  let model = @three.Group()
    ..set_name("model")
    ..add_children([body.as_object3d(), head.as_object3d()])
  let scene : @three.Scene = @three.Scene()..add_children([model.as_object3d()])
  assert_true(scene.children()[0].same_reference(model.as_object3d()))
  assert_true(model.children()[0].same_reference(body.as_object3d()))
  assert_true(model.children()[1].same_reference(head.as_object3d()))
  assert_eq(head.children()[0].name(), "eye")
  assert_true(body.geometry().same_reference(geometry))
  assert_true(eye.geometry().same_reference(geometry))
  assert_true(body.materials()[0].same_reference(material))
  assert_true(eye.materials()[0].same_reference(material))
  assert_eq(body.position().y(), 1)
  let second = @three.Group()..add_children([body.as_object3d()])
  assert_eq(model.children().length(), 1)
  assert_true(second.children()[0].same_reference(body.as_object3d()))
  let empty = @three.Group()..add_children([])
  assert_eq(empty.children().length(), 0)
  assert_eq(@three.Scene()..add_children([]).children().length(), 0)
}
