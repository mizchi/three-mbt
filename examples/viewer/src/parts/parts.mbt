///|
/// Each mesh owns its geometry and material, so it can be disposed independently.
pub fn add_part(
  root : @three.Object3D,
  name : String,
  geometry : @three.BufferGeometry,
  color : Int,
  position : @three.Vector3,
) -> @three.Object3D {
  let material = @three.MeshStandardMaterial(
    color,
    roughness=0.85,
    flat_shading=true,
  )
  let mesh = @three.Mesh(geometry, material.as_material()).as_object3d()
  mesh.set_name(name)
  mesh.position().copy(position) |> ignore
  mesh.set_cast_shadow(true)
  mesh.set_receive_shadow(true)
  root.add(mesh) |> ignore
  mesh
}

///|
pub fn ellipsoid(
  root : @three.Object3D,
  name : String,
  color : Int,
  position : @three.Vector3,
  scale : @three.Vector3,
  detail? : Int = 1,
) -> @three.Object3D {
  let geometry = @three.IcosahedronGeometry(1, detail).as_buffer_geometry()
  geometry.scale(scale.x(), scale.y(), scale.z()) |> ignore
  add_part(root, name, geometry, color, position)
}

///|
pub fn dispose(root : @three.Object3D) -> Unit {
  root.traverse(fn(object) {
    if object.as_mesh() is Some(mesh) {
      mesh.geometry().dispose()
      for material in mesh.materials() {
        material.dispose()
      }
    }
  })
}
