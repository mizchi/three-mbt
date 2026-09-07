///|
test "Scene and Group upcasts retain the original identity" {
  let scene = @three.Scene()
  let group = @three.Group()
  let root = scene.as_object3d()
  assert_true(root.same_reference(scene.as_object3d()))
  assert_eq(root.kind(), "Scene")
  assert_eq(group.as_object3d().kind(), "Group")
  assert_true(root.parent() is None)
  root.add(group.as_object3d()) |> ignore
  assert_eq(root.children().length(), 1)
  assert_true(root.children()[0].same_reference(group.as_object3d()))
}

///|
test "Adding reparents nodes and children are snapshots" {
  let first = @three.Object3D()
  let second = @three.Object3D()
  let child = @three.Object3D()
  assert_true(first.add(child).same_reference(first))
  let snapshot = first.children()
  second.add(child) |> ignore
  assert_eq(first.children().length(), 0)
  assert_eq(snapshot.length(), 1)
  assert_true(child.parent().unwrap().same_reference(second))
  second.remove(child) |> ignore
  assert_true(child.parent() is None)
  second.add(child).clear() |> ignore
  assert_true(child.parent() is None)
}

///|
test "Name lookup maps missing JS values to None" {
  let root = @three.Object3D()
  let child = @three.Object3D()
  child.set_name("child")
  root.add(child) |> ignore
  assert_eq(child.name(), "child")
  assert_true(root.get_object_by_name("child").unwrap().same_reference(child))
  assert_true(root.get_object_by_name("absent") is None)
  assert_true(child.visible())
  child.set_visible(false)
  assert_false(child.visible())
  assert_false(root.id() == child.id())
  assert_false(root.uuid() == child.uuid())
}

///|
test "Transforms are live references and world transforms include ancestors" {
  let root = @three.Object3D()
  let child = @three.Object3D()
  root.position().set(10, 0, 0) |> ignore
  root.scale().set(2, 2, 2) |> ignore
  child.position().set(1, 2, 3) |> ignore
  root.add(child) |> ignore
  let target = @three.Vector3(0, 0, 0)
  assert_true(child.get_world_position(target).same_reference(target))
  assert_true(target.equals(@three.Vector3(12, 4, 6)))
  let point = @three.Vector3(3, 4, 5)
  child.local_to_world(point) |> ignore
  assert_true(point.equals(@three.Vector3(18, 12, 16)))
  child.world_to_local(point) |> ignore
  assert_true(point.equals(@three.Vector3(3, 4, 5)))
}

///|
test "Object3D rotation and quaternion stay synchronized" {
  let object = @three.Object3D()
  object.rotation().set(0, 0, 3.141592653589793 / 2) |> ignore
  let x = @three.Vector3(1, 0, 0).apply_quaternion(object.quaternion())
  assert_true(x.x().abs() < 0.000000001)
  assert_true((x.y() - 1).abs() < 0.000000001)
  object.quaternion().set(0, 0, 0, 1) |> ignore
  assert_true(object.rotation().z().abs() < 0.000000001)
}

///|
test "Attach preserves world position and remove_from_parent detaches" {
  let first = @three.Object3D()
  let second = @three.Object3D()
  let child = @three.Object3D()
  first.position().set(10, 0, 0) |> ignore
  second.position().set(-5, 0, 0) |> ignore
  child.position().set(2, 0, 0) |> ignore
  first.add(child) |> ignore
  second.attach(child) |> ignore
  assert_eq(child.position().x(), 17)
  assert_eq(child.get_world_position(@three.Vector3(0, 0, 0)).x(), 12)
  child.remove_from_parent() |> ignore
  assert_true(child.parent() is None)
}

///|
test "Traversal supports capturing MoonBit closures" {
  let root = @three.Object3D()
  let child = @three.Object3D()
  let leaf = @three.Object3D()
  root.set_name("root")
  child.set_name("child")
  leaf.set_name("leaf")
  root.add(child) |> ignore
  child.add(leaf) |> ignore
  let names : Array[String] = []
  root.traverse(fn(node) { names.push(node.name()) })
  assert_eq(names, ["root", "child", "leaf"])
  child.set_visible(false)
  let visible : Array[String] = []
  root.traverse_visible(fn(node) { visible.push(node.name()) })
  assert_eq(visible, ["root"])
}

///|
test "Recursive cloning creates independent nodes and transforms" {
  let root = @three.Object3D()
  root.add(@three.Object3D()) |> ignore
  let copy = root.clone()
  assert_false(root.same_reference(copy))
  assert_false(root.children()[0].same_reference(copy.children()[0]))
  assert_true(copy.children()[0].parent().unwrap().same_reference(copy))
  copy.position().set(9, 0, 0) |> ignore
  assert_eq(root.position().x(), 0)
  assert_eq(root.clone(recursive=false).children().length(), 0)
}

///|
test "Scene background supports color and clearing" {
  let scene = @three.Scene()
  assert_true(scene.background() is None)
  let color = @three.Color::from_hex(0x123456)
  scene.set_background(Some(color))
  assert_true(scene.background().unwrap().same_reference(color))
  scene.set_background(None)
  assert_true(scene.background() is None)
}
