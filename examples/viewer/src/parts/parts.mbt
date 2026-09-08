///|
/// Attach a mesh with a new material. Geometry is shared without cloning.
/// Pass a dedicated geometry when using this package's `dispose` helper.
pub fn add_part(
  root : @three.Object3D,
  name : String,
  geometry : @three.BufferGeometry,
  color : Int,
  position : @three.Vector3,
) -> @three.Object3D {
  part(name, geometry, color, position)..add_to(root).as_object3d()
}

///|
/// Create an unattached Mesh with a new material; the input geometry is shared.
/// Pass a dedicated geometry when using this package's `dispose` helper.
pub fn part(
  name : String,
  geometry : @three.BufferGeometry,
  color : Int,
  position : @three.Vector3,
) -> @three.Mesh {
  let material = @three.MeshStandardMaterial(
    color,
    roughness=0.85,
    flat_shading=true,
  )
  @three.Mesh(geometry, material.as_material())
  ..set_name(name)
  ..set_position(position)
  ..set_cast_shadow(true)
  ..set_receive_shadow(true)
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
  ellipsoid_node(name, color, position, scale, detail~)
  ..add_to(root)
  .as_object3d()
}

///|
/// Create an unattached Mesh with its own geometry and material.
pub fn ellipsoid_node(
  name : String,
  color : Int,
  position : @three.Vector3,
  scale : @three.Vector3,
  detail? : Int = 1,
) -> @three.Mesh {
  let geometry = @three.IcosahedronGeometry(1, detail).as_buffer_geometry()
  geometry.scale(scale.x(), scale.y(), scale.z()) |> ignore
  part(name, geometry, color, position)
}

///|
/// Dispose every mesh geometry and material below root, including root itself.
/// Resources must be exclusive to these meshes: shared resources are not deduplicated.
/// Detach root from the scene before calling this; this helper does not remove it.
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
