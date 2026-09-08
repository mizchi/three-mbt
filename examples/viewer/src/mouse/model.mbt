///|
/// Six-sided rings follow a Catmull-Rom curve, tapering to a tiny capped tip.
fn tail_geometry() -> @three.BufferGeometry raise {
  let curve = @three.CatmullRomCurve3(
    [
      @three.Vector3(0, 0.55, -1.05),
      @three.Vector3(0.15, 0.22, -1.65),
      @three.Vector3(0.8, 0.12, -2.1),
      @three.Vector3(1.4, 0.17, -2.0),
      @three.Vector3(1.75, 0.23, -1.65),
    ],
    closed=false,
    curve_type=@three.Centripetal,
    tension=0.5,
  ).as_curve3()
  let segments = 18
  let frames = curve.compute_frenet_frames(segments, false)
  let normals = frames.normals()
  let binormals = frames.binormals()
  let sections = FixedArray::makei(segments + 1, fn(i) {
    let t = i.to_double() / segments.to_double()
    let center = curve.get_point_at(t)
    let radius = 0.085 * (1 - t) + 0.008
    FixedArray::makei(6, fn(j) {
      let angle = j.to_double() * @math.PI / 3
      center
      .clone()
      .add_scaled_vector(normals[i], @math.cos(angle) * radius)
      .add_scaled_vector(binormals[i], @math.sin(angle) * radius)
    })
  })
  let options = @three.LoftOptions(cap_start=true, cap_end=true)
  @three.LoftGeometry(sections, options).as_buffer_geometry()
}

///|
/// The model uses +Y up and faces +Z. No DOM, lights, or renderer are needed.
fn make_mouse() -> @three.Object3D raise {
  let root = @three.Group().as_object3d()
  root.set_name("low-poly-mouse")
  // Build the fallible geometry before allocating the rest of the character.
  let tail = tail_geometry()
  let fur = 0x9e9992
  let pink = 0xd99796
  @parts.ellipsoid(
    root,
    "body",
    fur,
    @three.Vector3(0, 0.83, -0.35),
    @three.Vector3(0.65, 0.72, 1.0),
  )
  |> ignore
  @parts.ellipsoid(
    root,
    "head",
    fur,
    @three.Vector3(0, 1.12, 0.62),
    @three.Vector3(0.51, 0.51, 0.65),
  )
  |> ignore
  let snout = @three.ConeGeometry(0.39, 0.94, 8).as_buffer_geometry()
  snout.rotate_x(1.88) |> ignore
  @parts.add_part(root, "snout", snout, 0xb2aaa0, @three.Vector3(0, 1.0, 1.16))
  |> ignore
  @parts.ellipsoid(
    root,
    "nose",
    0xb9787f,
    @three.Vector3(0, 0.858, 1.64),
    @three.Vector3(0.105, 0.085, 0.08),
    detail=0,
  )
  |> ignore
  for side in [-1, 1] {
    let x = side.to_double()
    let label = if side < 0 { "left" } else { "right" }
    let ear = @three.Group().as_object3d()
    ear.position().set(x * 0.46, 1.82, 0.49) |> ignore
    ear.rotation().set(-0.08, x * 0.2, -x * 0.25) |> ignore
    root.add(ear) |> ignore
    @parts.ellipsoid(
      root,
      "leg-front-\{label}",
      fur,
      @three.Vector3(x * 0.32, 0.34, 0.53),
      @three.Vector3(0.16, 0.30, 0.18),
      detail=0,
    )
    |> ignore
    @parts.ellipsoid(
      root,
      "leg-back-\{label}",
      fur,
      @three.Vector3(x * 0.42, 0.31, -0.85),
      @three.Vector3(0.20, 0.28, 0.25),
      detail=0,
    )
    |> ignore
    @parts.ellipsoid(
      ear,
      "ear-\{label}",
      fur,
      @three.Vector3(0, 0, 0),
      @three.Vector3(0.43, 0.53, 0.14),
    )
    |> ignore
    @parts.ellipsoid(
      ear,
      "inner-ear-\{label}",
      pink,
      @three.Vector3(0, 0.012, 0.105),
      @three.Vector3(0.335, 0.425, 0.058),
    )
    |> ignore
    @parts.ellipsoid(
      root,
      "eye-\{label}",
      0x252829,
      @three.Vector3(x * 0.36, 1.3, 1.018),
      @three.Vector3(0.10, 0.115, 0.082),
    )
    |> ignore
    @parts.ellipsoid(
      root,
      "eye-glint-\{label}",
      0xfaf6ef,
      @three.Vector3(x * 0.365, 1.337, 1.084),
      @three.Vector3(0.025, 0.027, 0.018),
      detail=0,
    )
    |> ignore
    @parts.ellipsoid(
      root,
      "paw-front-\{label}",
      pink,
      @three.Vector3(x * 0.36, 0.115, 0.61),
      @three.Vector3(0.18, 0.12, 0.28),
      detail=0,
    )
    |> ignore
    @parts.ellipsoid(
      root,
      "paw-back-\{label}",
      pink,
      @three.Vector3(x * 0.45, 0.115, -0.91),
      @three.Vector3(0.215, 0.12, 0.32),
      detail=0,
    )
    |> ignore
    // Thin cylinders keep the whiskers visible in both the viewer and GLB.
    for i in 0..<3 {
      let start = @three.Vector3(x * 0.13, 0.91, 1.43)
      let end = @three.Vector3(
        x * (0.65 + i.to_double() * 0.05),
        0.92 + (i - 1).to_double() * 0.10,
        1.28 + i.to_double() * 0.17,
      )
      let direction = end.clone().sub(start)
      let geometry = @three.CylinderGeometry(
        0.006,
        0.009,
        direction.length(),
        3,
      ).as_buffer_geometry()
      let whisker = @parts.add_part(
        root,
        "whisker-\{label}-\{i}",
        geometry,
        0x6b6560,
        start.clone().add(end).multiply_scalar(0.5),
      )
      whisker
      .quaternion()
      .set_from_unit_vectors(@three.Vector3(0, 1, 0), direction.normalize())
      |> ignore
    }
  }
  @parts.add_part(root, "tail", tail, pink, @three.Vector3(0, 0, 0)) |> ignore
  root.update_matrix_world(true)
  root
}

///|
pub fn create_mouse() -> @js_async.Promise[@three.Object3D] {
  @js_async.Promise::from_async(() => make_mouse())
}
