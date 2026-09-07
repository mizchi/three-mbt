///|
/// Return a child's world position after applying its parent's transform.
pub fn world_position() -> FixedArray[Double] {
  let scene = @three.Scene()
  let group = @three.Group().as_object3d()
  let child = @three.Object3D()
  group.position().set(10, 0, 0) |> ignore
  group.scale().set(2, 2, 2) |> ignore
  child.position().set(1, 2, 3) |> ignore
  scene.as_object3d().add(group) |> ignore
  group.add(child) |> ignore
  let position = child.get_world_position(@three.Vector3(0, 0, 0))
  [position.x(), position.y(), position.z()]
}

///|
fn main {
  let position = world_position()
  println("world position: \{position[0]}, \{position[1]}, \{position[2]}")
}
