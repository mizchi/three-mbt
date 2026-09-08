///|
fn triangle(
  positions : Array[@three.Vector3],
  indices : Array[Int],
  a : Int,
  b : Int,
  c : Int,
  outward : @three.Vector3,
) -> Unit {
  if a == b || b == c || c == a {
    return
  }
  let normal = (positions[b] - positions[a]).cross(positions[c] - positions[a])
  if normal.dot(outward) < 0 {
    indices.append([a, c, b])
  } else {
    indices.append([a, b, c])
  }
}

///|
/// Marching tetrahedra gives the blended field a closed, consistently oriented skin.
fn skin() -> @three.BufferGeometry {
  let shapes = silhouette()
  let step = 0.05
  let nx = 63
  let ny = 81
  let nz = 27
  let samples = FixedArray::make(nx * ny * nz, 0.0)
  for iy in 0..<ny {
    for iz in 0..<nz {
      for ix in 0..<nx {
        samples[(iy * nz + iz) * nx + ix] = field(
          shapes,
          -1.55 + ix.to_double() * step,
          -0.1 + iy.to_double() * step,
          -0.65 + iz.to_double() * step,
        )
      }
    }
  }
  let offsets = [
    (0, 0, 0),
    (1, 0, 0),
    (1, 1, 0),
    (0, 1, 0),
    (0, 0, 1),
    (1, 0, 1),
    (1, 1, 1),
    (0, 1, 1),
  ]
  let tetrahedra = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ]
  let positions : Array[@three.Vector3] = []
  let indices : Array[Int] = []
  // Grid-edge identity shares vertices exactly, without tolerance-based welding.
  let edge_vertices : Map[(Int, Int), Int] = Map([])
  for iy in 0..<(ny - 1) {
    for iz in 0..<(nz - 1) {
      for ix in 0..<(nx - 1) {
        let ids = offsets.map(fn(offset) {
          let (dx, dy, dz) = offset
          ((iy + dy) * nz + iz + dz) * nx + ix + dx
        })
        let values = ids.map(fn(id) { samples[id] })
        let mut negative = 0
        for value in values {
          if value < 0 {
            negative += 1
          }
        }
        if negative == 0 || negative == 8 {
          continue
        }
        let points = offsets.map(fn(offset) {
          let (dx, dy, dz) = offset
          @three.Vector3(
            -1.55 + (ix + dx).to_double() * step,
            -0.1 + (iy + dy).to_double() * step,
            -0.65 + (iz + dz).to_double() * step,
          )
        })
        for tetra in tetrahedra {
          let inside : Array[Int] = []
          let outside : Array[Int] = []
          for i in tetra {
            if values[i] < 0 {
              inside.push(i)
            } else {
              outside.push(i)
            }
          }
          if inside.is_empty() || outside.is_empty() {
            continue
          }
          let outward = points[outside[0]] - points[inside[0]]
          let crossing = fn(a : Int, b : Int) {
            let key = if values[a] == 0 {
              (ids[a], ids[a])
            } else if values[b] == 0 {
              (ids[b], ids[b])
            } else if ids[a] < ids[b] {
              (ids[a], ids[b])
            } else {
              (ids[b], ids[a])
            }
            match edge_vertices.get(key) {
              Some(index) => index
              None => {
                let point = points[a] +
                  (points[b] - points[a]).scaled(
                    values[a] / (values[a] - values[b]),
                  )
                let index = positions.length()
                positions.push(point)
                edge_vertices[key] = index
                index
              }
            }
          }
          if inside.length() == 2 {
            let a = crossing(inside[0], outside[0])
            let b = crossing(inside[0], outside[1])
            let c = crossing(inside[1], outside[1])
            let d = crossing(inside[1], outside[0])
            triangle(positions, indices, a, b, c, outward)
            triangle(positions, indices, a, c, d, outward)
          } else {
            let (one, rest) = if inside.length() == 1 {
              (inside[0], outside)
            } else {
              (outside[0], inside)
            }
            triangle(
              positions,
              indices,
              crossing(one, rest[0]),
              crossing(one, rest[1]),
              crossing(one, rest[2]),
              outward,
            )
          }
        }
      }
    }
  }
  let geometry = @three.BufferGeometry()
  let vertices = FixedArray::makei(positions.length() * 3, fn(i) {
    let point = positions[i / 3]
    match i % 3 {
      0 => point.x()
      1 => point.y()
      _ => point.z()
    }
  })
  geometry.set_attribute(
    "position",
    @three.BufferAttribute::from_floats(vertices, 3),
  )
  |> ignore
  geometry.set_indices(
    FixedArray::makei(indices.length(), fn(i) { indices[i] }),
  )
  |> ignore
  geometry.compute_vertex_normals()
  geometry
}
