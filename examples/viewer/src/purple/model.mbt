///|
fn smooth_part(
  name : String,
  geometry : @three.BufferGeometry,
  color : Int,
) -> @three.Object3D {
  let mesh = @parts.part(name, geometry, color, @three.Vector3(0, 0, 0))
  let material = mesh.materials()[0].as_standard_material().unwrap()
  material.set_flat_shading(false)
  material.set_roughness(0.72)
  mesh.as_object3d()
}

///|
/// Find the front of the same implicit surface used by the body mesh.
fn face_depth(x : Double, y : Double) -> Double {
  let shapes = silhouette()
  let mut low = 0.0
  let mut high = 0.65
  for _ in 0..<18 {
    let mid = (low + high) / 2
    if field(shapes, x, y, mid) < 0 {
      low = mid
    } else {
      high = mid
    }
  }
  (low + high) / 2
}

///|
fn face_part(
  name : String,
  shape : @three.Shape,
  color : Int,
  lift : Double,
) -> @three.Object3D {
  let options = @three.ExtrudeOptions()
    ..set_depth(0.012)
    ..set_bevel_enabled(true)
    ..set_bevel_size(0.006)
    ..set_bevel_thickness(0.006)
    ..set_bevel_segments(3)
    ..set_curve_segments(24)
  let flat = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
  defer flat.dispose()
  // Subdivide before bending: long cap triangles would cut through the head.
  let geometry = try! @three.TessellateModifier(0.045, 9).modify(flat)
  let position = geometry.get_attribute("position").unwrap()
  for i in 0..<position.count() {
    let x = position.get_x(i)
    let y = position.get_y(i)
    position.set_xyz(i, x, y, face_depth(x, y) + lift + position.get_z(i))
    |> ignore
  }
  geometry.compute_vertex_normals()
  smooth_part(name, geometry, color)
}

///|
fn oval(
  name : String,
  x : Double,
  y : Double,
  rx : Double,
  ry : Double,
) -> @three.Object3D {
  let shape = @three.Shape()
  shape.as_path().absellipse(x, y, rx, ry, 0, @math.PI * 2, false, 0) |> ignore
  face_part(name, shape, 0x090b0b, 0.045)
}

///|
/// Reference-inspired purple mascot. +Y is up; the face looks toward +Z.
/// The body is one smooth mesh; all facial markings are geometry, with no textures.
/// Each call owns its geometry and materials; release using parts.dispose.
pub fn create() -> @three.Object3D {
  let root = @three.Group()..set_name("purple-mascot")
  root.add_child(smooth_part("purple-body", skin(), 0xa43af0))
  let patch = @three.Shape()
  patch
  .as_path()
  .move_to(-0.34, 2.71)
  .bezier_curve_to(-0.46, 2.85, -0.28, 3.05, -0.10, 2.90)
  .bezier_curve_to(-0.035, 2.94, 0.035, 2.94, 0.10, 2.90)
  .bezier_curve_to(0.28, 3.05, 0.46, 2.85, 0.34, 2.71)
  .bezier_curve_to(0.24, 2.39, -0.24, 2.39, -0.34, 2.71)
  .close_path()
  |> ignore
  let mouth = @three.Shape()
  mouth
  .as_path()
  .move_to(-0.265, 2.745)
  .bezier_curve_to(-0.13, 2.67, 0.13, 2.67, 0.265, 2.745)
  .bezier_curve_to(0.20, 2.49, -0.20, 2.49, -0.265, 2.745)
  .close_path()
  |> ignore
  root.add_children([
    face_part("smile-patch", patch, 0xfffdf7, 0.018),
    face_part("smile-mouth", mouth, 0x090b0b, 0.046),
    oval("eye-left", -0.222, 2.855, 0.053, 0.056),
    oval("eye-right", 0.222, 2.855, 0.053, 0.056),
    oval("nose", 0, 2.823, 0.076, 0.039),
  ])
  root.update_matrix_world(true)
  root.as_object3d()
}
