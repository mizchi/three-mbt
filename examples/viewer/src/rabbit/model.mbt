///|
/// A shallow polygon extrusion gives the visor and glyphs real thickness.
fn relief(
  name : String,
  shape : @three.Shape,
  color : Int,
  position : @three.Vector3,
  depth : Double,
  bevel : Double,
) -> @three.Mesh {
  let options = @three.ExtrudeOptions()
    ..set_depth(depth)
    ..set_bevel_enabled(bevel > 0)
    ..set_bevel_size(bevel)
    ..set_bevel_thickness(bevel)
    ..set_bevel_segments(1)
    ..set_curve_segments(3)
  let geometry = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
  @parts.part(name, geometry, color, position)
}

///|
fn polygon(points : FixedArray[@three.Vector2]) -> @three.Shape {
  let shape = @three.Shape::from_points(points)
  shape.as_path().close_path() |> ignore
  shape
}

///|
/// Sweep thick octagonal sections along a backward stem and a forward curl.
/// The section frame follows the bend, so the crown has volume from every view.
fn ear(side : Double) -> @three.BufferGeometry {
  // Center (X, Y, Z), half width, and half thickness. The visor faces +Z.
  let sections = [
    (0.32, 2.02, -0.04, 0.12, 0.16),
    (0.44, 2.45, -0.16, 0.16, 0.19),
    (0.57, 2.98, -0.28, 0.21, 0.22),
    (0.70, 3.43, -0.27, 0.25, 0.22),
    (0.80, 3.65, -0.10, 0.27, 0.21),
    (0.94, 3.60, 0.17, 0.26, 0.20),
    (1.06, 3.37, 0.43, 0.23, 0.18),
    (1.12, 3.08, 0.62, 0.16, 0.14),
    (1.14, 2.92, 0.67, 0.055, 0.07),
  ]
  let centers = FixedArray::makei(sections.length(), fn(i) {
    let (x, y, z, _, _) = sections[i]
    @three.Vector3(x * side, y, z)
  })
  let sides = 8
  let ring_vertices = centers.length() * sides
  let positions = FixedArray::make((ring_vertices + 2) * 3, 0.0)
  for i in 0..<centers.length() {
    let before = centers[if i == 0 { 0 } else { i - 1 }]
    let after = centers[if i == centers.length() - 1 { i } else { i + 1 }]
    let tangent = (after - before).normalize()
    let thickness_axis = tangent
      .clone()
      .cross(@three.Vector3(1, 0, 0))
      .normalize()
    let width_axis = thickness_axis.clone().cross(tangent).normalize()
    let (_, _, _, width, thickness) = sections[i]
    for j in 0..<sides {
      let angle = j.to_double() * @math.PI * 2 / sides.to_double()
      let point = centers[i] +
        width_axis.scaled(@math.cos(angle) * width) +
        thickness_axis.scaled(@math.sin(angle) * thickness)
      let offset = (i * sides + j) * 3
      positions[offset] = point.x()
      positions[offset + 1] = point.y()
      positions[offset + 2] = point.z()
    }
  }
  for cap in 0..<2 {
    let center = centers[if cap == 0 { 0 } else { centers.length() - 1 }]
    let offset = (ring_vertices + cap) * 3
    positions[offset] = center.x()
    positions[offset + 1] = center.y()
    positions[offset + 2] = center.z()
  }
  let indices : Array[Int] = []
  for i in 0..<(centers.length() - 1) {
    for j in 0..<sides {
      let a = i * sides + j
      let b = i * sides + (j + 1) % sides
      indices.append([a, b, a + sides, b, b + sides, a + sides])
    }
  }
  for j in 0..<sides {
    let next = (j + 1) % sides
    let last_ring = ring_vertices - sides
    indices.append([ring_vertices, next, j])
    indices.append([ring_vertices + 1, last_ring + j, last_ring + next])
  }
  let geometry = @three.BufferGeometry()
  geometry.set_attribute(
    "position",
    @three.BufferAttribute::from_floats(positions, 3),
  )
  |> ignore
  geometry.set_indices(
    FixedArray::makei(indices.length(), fn(i) { indices[i] }),
  )
  |> ignore
  geometry.compute_vertex_normals()
  geometry
}

///|
/// Recreates the supplied MoonBit rabbit reference as a texture-free 3D model.
/// +Y is up; the white visor faces +Z. Each call owns independent resources.
pub fn create() -> @three.Object3D {
  let magenta = 0xad207b
  let root = @three.Group()
    ..set_name("moonbit-rabbit")
    ..add_children([
      @parts.ellipsoid_node(
        "rabbit-head",
        magenta,
        @three.Vector3(0, 1.45, 0),
        @three.Vector3(0.94, 0.70, 0.49),
        detail=2,
      ).as_object3d(),
      @parts.ellipsoid_node(
        "rabbit-body",
        magenta,
        @three.Vector3(0, 0.50, 0),
        @three.Vector3(0.40, 0.44, 0.29),
      ).as_object3d(),
      @parts.ellipsoid_node(
        "rabbit-tail",
        magenta,
        @three.Vector3(0, 0.36, -0.33),
        @three.Vector3(0.17, 0.17, 0.17),
      ).as_object3d(),
    ])
  for side in [-1, 1] {
    let x = side.to_double()
    let label = if side < 0 { "left" } else { "right" }
    let ear = @parts.part(
      "rabbit-ear-\{label}",
      ear(x),
      magenta,
      @three.Vector3(0, 0, 0),
    )
    let arm = @parts.ellipsoid_node(
      "rabbit-arm-\{label}",
      magenta,
      @three.Vector3(x * 0.40, 0.49, 0.035),
      @three.Vector3(0.12, 0.31, 0.14),
    )
    arm.rotate_z(x * 0.35) |> ignore
    let foot = @parts.ellipsoid_node(
      "rabbit-foot-\{label}",
      magenta,
      @three.Vector3(x * 0.24, 0.145, 0.10),
      @three.Vector3(0.16, 0.16, 0.20),
    )
    root.add_children([ear.as_object3d(), arm.as_object3d(), foot.as_object3d()])
  }
  let visor = polygon([
    @three.Vector2(-0.73, -0.12),
    @three.Vector2(-0.79, 0.02),
    @three.Vector2(-0.77, 0.18),
    @three.Vector2(-0.65, 0.32),
    @three.Vector2(-0.45, 0.37),
    @three.Vector2(0.45, 0.37),
    @three.Vector2(0.65, 0.32),
    @three.Vector2(0.77, 0.18),
    @three.Vector2(0.79, 0.02),
    @three.Vector2(0.73, -0.12),
    @three.Vector2(0.59, -0.24),
    @three.Vector2(0.47, -0.25),
    @three.Vector2(0.28, -0.19),
    @three.Vector2(0, -0.15),
    @three.Vector2(-0.28, -0.19),
    @three.Vector2(-0.47, -0.25),
    @three.Vector2(-0.59, -0.24),
  ])
  root.add_child(
    relief(
      "visor",
      visor,
      0xffffff,
      @three.Vector3(0, 1.40, 0.48),
      0.045,
      0.018,
    ).as_object3d(),
  )
  let zero = polygon([
    @three.Vector2(-0.065, -0.12),
    @three.Vector2(-0.10, -0.06),
    @three.Vector2(-0.10, 0.06),
    @three.Vector2(-0.065, 0.12),
    @three.Vector2(0.065, 0.12),
    @three.Vector2(0.10, 0.06),
    @three.Vector2(0.10, -0.06),
    @three.Vector2(0.065, -0.12),
  ])
  zero.set_holes([
    @three.Path::from_points([
      @three.Vector2(-0.035, -0.075),
      @three.Vector2(0.035, -0.075),
      @three.Vector2(0.055, -0.035),
      @three.Vector2(0.055, 0.035),
      @three.Vector2(0.035, 0.075),
      @three.Vector2(-0.035, 0.075),
      @three.Vector2(-0.055, 0.035),
      @three.Vector2(-0.055, -0.035),
    ]),
  ])
  root.add_child(
    relief(
      "glyph-zero",
      zero,
      magenta,
      @three.Vector3(-0.45, 1.50, 0.55),
      0.012,
      0,
    ).as_object3d(),
  )
  root.add_child(
    relief(
      "glyph-one",
      polygon([
        @three.Vector2(-0.07, -0.12),
        @three.Vector2(0.085, -0.12),
        @three.Vector2(0.085, -0.075),
        @three.Vector2(0.035, -0.075),
        @three.Vector2(0.035, 0.12),
        @three.Vector2(-0.015, 0.12),
        @three.Vector2(-0.07, 0.09),
        @three.Vector2(-0.05, 0.045),
        @three.Vector2(-0.02, 0.062),
        @three.Vector2(-0.02, -0.075),
        @three.Vector2(-0.07, -0.075),
      ]),
      magenta,
      @three.Vector3(-0.21, 1.50, 0.55),
      0.012,
      0,
    ).as_object3d(),
  )
  for side in [-1, 1] {
    let x = side.to_double()
    let label = if side < 0 { "left" } else { "right" }
    root.add_child(
      relief(
        "glyph-code-\{label}",
        polygon([
          @three.Vector2(-x * 0.045, 0.14),
          @three.Vector2(x * 0.10, 0.035),
          @three.Vector2(x * 0.10, -0.035),
          @three.Vector2(-x * 0.045, -0.14),
          @three.Vector2(-x * 0.045, -0.07),
          @three.Vector2(x * 0.045, 0),
          @three.Vector2(-x * 0.045, 0.07),
        ]),
        magenta,
        @three.Vector3(0.38 + x * 0.11, 1.50, 0.55),
        0.012,
        0,
      ).as_object3d(),
    )
  }
  root.update_matrix_world(true)
  root.as_object3d()
}
