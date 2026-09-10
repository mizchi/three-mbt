///|
/// A closed triangular wedge, with the tip leaning slightly backward.
fn ear_geometry() -> @three.BufferGeometry {
  let geometry = @three.BufferGeometry()
  geometry.set_attribute(
    "position",
    @three.Float32BufferAttribute(
      [
        -0.23, 0, 0.13, 0.23, 0, 0.13, 0, 0.57, 0.01, -0.23, 0, -0.15, 0.23, 0, -0.15,
        0, 0.57, -0.13,
      ],
      3,
      false,
    ).as_buffer_attribute(),
  )
  |> ignore
  geometry.set_indices([
    0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1,
  ])
  |> ignore
  geometry.compute_vertex_normals()
  geometry
}

///|
fn inner_ear_geometry() -> @three.BufferGeometry {
  let geometry = @three.BufferGeometry()
  geometry.set_attribute(
    "position",
    @three.Float32BufferAttribute(
      [-0.145, 0.075, 0.14, 0.145, 0.075, 0.14, 0, 0.45, 0.055],
      3,
      false,
    ).as_buffer_attribute(),
  )
  |> ignore
  geometry.compute_vertex_normals()
  geometry
}

///|
fn tail_geometry(tip : Bool) -> @three.BufferGeometry {
  let points : FixedArray[@three.Vector3] = [
    @three.Vector3(0, 0, 0),
    @three.Vector3(0.32, -0.05, -0.32),
    @three.Vector3(0.8, -0.03, -0.32),
    @three.Vector3(1.12, 0.12, -0.14),
    @three.Vector3(1.28, 0.49, 0.05),
    @three.Vector3(1.22, 0.82, 0.12),
    @three.Vector3(1.05, 0.92, 0.14),
  ]
  let curve = @three.CatmullRomCurve3(points)
  let geometry = @three.TubeGeometry(curve.as_curve3(), 14, 0.11, 5, false).as_buffer_geometry()
  // Partition one sweep into disjoint faces. Both colors meet on exactly the
  // same ring, avoiding overlapping tubes and mismatched curve frames.
  let index = geometry.get_index().unwrap()
  let start = if tip { 11 * 5 * 6 } else { 0 }
  let end = if tip { index.count() } else { 11 * 5 * 6 }
  let indices = FixedArray::makei(end - start, fn(i) {
    index.get_x(start + i).to_int()
  })
  geometry.set_indices(indices) |> ignore
  geometry
}

///|
fn part(
  name : String,
  geometry : @three.BufferGeometry,
  material : @three.Material,
  at~ : (Double, Double, Double),
  size~ : (Double, Double, Double),
  rotation? : (Double, Double, Double) = (0, 0, 0),
) -> @lt.Node {
  let (x, y, z) = at
  let (sx, sy, sz) = size
  let (rx, ry, rz) = rotation
  @lt.mesh(geometry=Borrowed(geometry), material=Borrowed(material), props=[
    @lt.prop(Name(name)),
    @lt.prop(Position(x, y, z)),
    @lt.prop(Scale(sx, sy, sz)),
    @lt.prop(Rotation(rx, ry, rz)),
    @lt.prop(CastShadow(true)),
  ])
}

///|
/// Thin, three-sided cylinders keep whiskers visible from any viewing angle.
fn whisker(
  name : String,
  from : (Double, Double),
  to : (Double, Double),
  material : @three.Material,
  z? : Double = 0.575,
  radius? : Double = 0.009,
) -> @lt.Node {
  let (x1, y1) = from
  let (x2, y2) = to
  let dx = x2 - x1
  let dy = y2 - y1
  @lt.mesh(
    geometry=Cylinder(radius, radius, (dx * dx + dy * dy).sqrt(), 3),
    material=Borrowed(material),
    props=[
      @lt.prop(Name(name)),
      @lt.prop(Position((x1 + x2) / 2, (y1 + y2) / 2, z)),
      @lt.prop(Rotation(0, 0, -@math.atan2(dx, dy))),
    ],
  )
}
