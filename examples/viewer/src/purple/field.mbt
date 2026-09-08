///|
/// Ellipsoid parameters are independent of tessellation and rendering.
priv struct Blob {
  x : Double
  y : Double
  z : Double
  rx : Double
  ry : Double
  rz : Double
  cosine : Double
  sine : Double
}

///|
fn blob(
  x : Double,
  y : Double,
  z : Double,
  rx : Double,
  ry : Double,
  rz : Double,
  angle : Double,
) -> Blob {
  { x, y, z, rx, ry, rz, cosine: @math.cos(angle), sine: @math.sin(angle) }
}

///|
fn silhouette() -> Array[Blob] {
  // Only the right half is specified; the field mirrors it about X = 0.
  [
    blob(0, 1.57, 0, 0.73, 0.91, 0.53, 0),
    blob(0, 2.32, 0, 0.51, 0.66, 0.39, 0),
    blob(0, 2.77, 0, 0.55, 0.58, 0.40, 0),
    blob(0.43, 3.24, -0.015, 0.25, 0.40, 0.25, -0.58),
    blob(0.76, 3.51, -0.035, 0.44, 0.29, 0.22, 0.25),
    blob(1.08, 3.49, -0.005, 0.34, 0.29, 0.22, -0.42),
    blob(1.25, 3.34, 0.025, 0.20, 0.22, 0.20, 0.45),
    blob(0.81, 1.69, -0.025, 0.24, 0.52, 0.28, 0.57),
    blob(1.05, 1.27, 0, 0.245, 0.43, 0.28, 0.25),
    blob(1.09, 0.94, 0.045, 0.245, 0.27, 0.29, -0.12),
    blob(0.29, 0.62, 0.025, 0.245, 0.43, 0.32, 0.06),
    blob(0.38, 0.27, 0.105, 0.32, 0.27, 0.40, -0.35),
  ]
}

///|
fn field(shapes : Array[Blob], x : Double, y : Double, z : Double) -> Double {
  let x = x.abs()
  let mut distance = 100.0
  for shape in shapes {
    let dx = x - shape.x
    let dy = y - shape.y
    let px = (dx * shape.cosine + dy * shape.sine) / shape.rx
    let py = (-dx * shape.sine + dy * shape.cosine) / shape.ry
    let pz = (z - shape.z) / shape.rz
    let k0 = (px * px + py * py + pz * pz).sqrt()
    let k1 = (px * px / (shape.rx * shape.rx) +
    py * py / (shape.ry * shape.ry) +
    pz * pz / (shape.rz * shape.rz)).sqrt()
    let d = if k1 < 0.000001 { -shape.rz } else { k0 * (k0 - 1) / k1 }
    // Polynomial smooth union removes seams at the shoulders, neck and ears.
    let h = ((0.15 - (distance - d).abs()) / 0.15).clamp(min=0, max=1)
    distance = (if distance < d { distance } else { d }) - h * h * 0.15 * 0.25
  }
  distance
}
