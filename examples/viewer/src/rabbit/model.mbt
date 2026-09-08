///|
/// A shallow polygon extrusion gives the ears, visor, and glyphs real thickness.
fn relief(
  root : @three.Object3D,
  name : String,
  shape : @three.Shape,
  color : Int,
  position : @three.Vector3,
  depth : Double,
  bevel : Double,
) -> Unit {
  let options = @three.ExtrudeOptions()
  options.set_depth(depth)
  options.set_bevel_enabled(bevel > 0)
  options.set_bevel_size(bevel)
  options.set_bevel_thickness(bevel)
  options.set_bevel_segments(1)
  options.set_curve_segments(3)
  let geometry = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
  @parts.add_part(root, name, geometry, color, position) |> ignore
}

///|
fn polygon(points : FixedArray[@three.Vector2]) -> @three.Shape {
  let shape = @three.Shape::from_points(points)
  shape.as_path().close_path() |> ignore
  shape
}

///|
/// Folded silhouettes are mirrored in X, with the tips bending outwards.
fn ear(side : Double) -> @three.Shape {
  let points = [
    (0.22, 1.96),
    (0.39, 2.77),
    (0.49, 3.44),
    (0.62, 3.70),
    (0.79, 3.79),
    (0.94, 3.73),
    (1.10, 3.51),
    (1.24, 3.15),
    (1.28, 2.89),
    (1.23, 2.70),
    (1.12, 2.69),
    (0.94, 2.88),
    (0.85, 3.00),
    (0.52, 2.23),
    (0.44, 1.98),
  ]
  polygon(
    FixedArray::makei(points.length(), fn(i) {
      let (x, y) = points[i]
      @three.Vector2(x * side, y)
    }),
  )
}

///|
/// Recreates the supplied MoonBit rabbit reference as a texture-free 3D model.
/// +Y is up; the white visor faces +Z. Each call owns independent resources.
pub fn create() -> @three.Object3D {
  let root = @three.Group().as_object3d()
  root.set_name("moonbit-rabbit")
  let magenta = 0xad207b
  @parts.ellipsoid(
    root,
    "rabbit-head",
    magenta,
    @three.Vector3(0, 1.45, 0),
    @three.Vector3(0.94, 0.70, 0.49),
    detail=2,
  )
  |> ignore
  @parts.ellipsoid(
    root,
    "rabbit-body",
    magenta,
    @three.Vector3(0, 0.50, 0),
    @three.Vector3(0.40, 0.44, 0.29),
  )
  |> ignore
  @parts.ellipsoid(
    root,
    "rabbit-tail",
    magenta,
    @three.Vector3(0, 0.36, -0.33),
    @three.Vector3(0.17, 0.17, 0.17),
  )
  |> ignore
  for side in [-1, 1] {
    let x = side.to_double()
    let label = if side < 0 { "left" } else { "right" }
    relief(
      root,
      "rabbit-ear-\{label}",
      ear(x),
      magenta,
      @three.Vector3(0, 0, -0.10),
      0.20,
      0.045,
    )
    let arm = @parts.ellipsoid(
      root,
      "rabbit-arm-\{label}",
      magenta,
      @three.Vector3(x * 0.40, 0.49, 0.035),
      @three.Vector3(0.12, 0.31, 0.14),
    )
    arm.rotate_z(x * 0.35) |> ignore
    @parts.ellipsoid(
      root,
      "rabbit-foot-\{label}",
      magenta,
      @three.Vector3(x * 0.24, 0.145, 0.10),
      @three.Vector3(0.16, 0.16, 0.20),
    )
    |> ignore
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
  relief(
    root,
    "visor",
    visor,
    0xffffff,
    @three.Vector3(0, 1.40, 0.48),
    0.045,
    0.018,
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
  relief(
    root,
    "glyph-zero",
    zero,
    magenta,
    @three.Vector3(-0.45, 1.50, 0.55),
    0.012,
    0,
  )
  relief(
    root,
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
  )
  for side in [-1, 1] {
    let x = side.to_double()
    let label = if side < 0 { "left" } else { "right" }
    relief(
      root,
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
    )
  }
  root.update_matrix_world(true)
  root
}
