///|
test "Modeling primitives expose segmentation and open angular sections" {
  let plane = @three.PlaneGeometry::segmented(4, 2, 4, 2).as_buffer_geometry()
  assert_eq(plane.get_attribute("position").unwrap().count(), 15)
  assert_eq(plane.get_index().unwrap().count(), 48)
  let box = @three.BoxGeometry::segmented(2, 2, 2, 2, 2, 2).as_buffer_geometry()
  assert_eq(box.get_attribute("position").unwrap().count(), 54)
  let cylinder = @three.CylinderGeometry::section(
    1, 1, 2, 8, 2, true, 0, 3.141592653589793,
  ).as_buffer_geometry()
  assert_eq(cylinder.get_attribute("position").unwrap().count(), 27)
  assert_eq(cylinder.get_index().unwrap().count(), 96)
  cylinder.compute_bounding_box()
  near(cylinder.bounding_box().unwrap().max().x(), 1)
  let sphere = @three.SphereGeometry::section(
    1,
    8,
    4,
    0,
    6.283185307179586,
    0,
    3.141592653589793 / 2,
  ).as_buffer_geometry()
  sphere.compute_bounding_box()
  near(sphere.bounding_box().unwrap().min().y(), 0)
}

///|
test "Contour editing and automatic holes produce a profile for extrusion" {
  let empty = @three.CurvePath2()
  assert_true(empty.get_point(0.5, @three.Vector2(0, 0)) is None)
  let path = @three.ShapePath()
  path.move_to(0, 0).line_to(0, 4).line_to(4, 4).line_to(4, 0).line_to(0, 0)
  |> ignore
  path.move_to(1, 1).line_to(3, 1).line_to(3, 3).line_to(1, 3).line_to(1, 1)
  |> ignore
  let shapes = path.to_shapes()
  assert_eq(shapes.length(), 1)
  assert_eq(shapes[0].holes().length(), 1)
  let profile = shapes[0].extract_points(4)
  near(@three.ShapeUtils::area(profile.shape()).abs(), 16)
  near(@three.ShapeUtils::area(profile.holes()[0]).abs(), 4)
  let curve = @three.CubicBezierCurve3(
    @three.Vector3(0, 0, 0),
    @three.Vector3(0, 0, 1),
    @three.Vector3(0, 0, 2),
    @three.Vector3(0, 0, 3),
  )
  curve.v3().set(0, 0, 6) |> ignore
  curve.as_curve3().update_arc_lengths()
  near(curve.as_curve3().get_length(), 6)
  let frames = curve.as_curve3().compute_frenet_frames(8, false)
  assert_eq(frames.tangents().length(), 9)
  near(frames.tangents()[0].dot(frames.normals()[0]), 0)
  near(frames.normals()[0].length(), 1)
  let options = @three.ExtrudeOptions()
  options.set_bevel_enabled(false)
  options.set_steps(8)
  options.set_extrude_path(Some(curve.as_curve3()))
  let solid = @three.ExtrudeGeometry(shapes, options).as_buffer_geometry()
  solid.compute_bounding_box()
  near(solid.bounding_box().unwrap().max().z(), 6)
}

///|
test "Parametric surfaces, convex hulls and rounded boxes create bounded meshes" {
  let surface = @three.ParametricGeometry(
    fn(u, v, target) { target.set(u * 2, v * 4, u * v) |> ignore },
    4,
    2,
  ).as_buffer_geometry()
  assert_eq(surface.get_attribute("position").unwrap().count(), 15)
  assert_eq(surface.get_index().unwrap().count(), 48)
  surface.compute_bounding_box()
  near(surface.bounding_box().unwrap().max().z(), 1)
  let convex = @three.ConvexGeometry([
    @three.Vector3(0, 0, 0),
    @three.Vector3(1, 0, 0),
    @three.Vector3(0, 1, 0),
    @three.Vector3(0, 0, 1),
    @three.Vector3(0.1, 0.1, 0.1),
  ]).as_buffer_geometry()
  assert_eq(convex.get_attribute("position").unwrap().count(), 12)
  let rounded = @three.RoundedBoxGeometry(2, 3, 4, 2, 0.2).as_buffer_geometry()
  rounded.compute_bounding_box()
  near(rounded.bounding_box().unwrap().max().x(), 1)
  near(rounded.bounding_box().unwrap().max().y(), 1.5)
  near(rounded.bounding_box().unwrap().max().z(), 2)
}

///|
test "Ray selection exposes triangle indices and supports vertex editing" {
  let geometry = @three.PlaneGeometry::segmented(2, 2, 1, 1).as_buffer_geometry()
  let mesh = @three.Mesh(
    geometry,
    @three.MeshBasicMaterial(0xffffff).as_material(),
  )
  mesh.as_object3d().update_matrix_world(true)
  let raycaster = @three.Raycaster(
    @three.Vector3(0.25, 0.25, 2),
    @three.Vector3(0, 0, -1),
  )
  let hit = raycaster.intersect_object(mesh.as_object3d(), false)[0]
  let face = hit.face().unwrap()
  assert_eq(face.material_index(), 0)
  assert_true(face.a() >= 0 && face.a() < 4)
  near(
    hit.barycoord().unwrap().x() +
    hit.barycoord().unwrap().y() +
    hit.barycoord().unwrap().z(),
    1,
  )
  let position = geometry.get_attribute("position").unwrap()
  position.set_z(face.a(), 1) |> ignore
  position.mark_needs_update()
  geometry.compute_vertex_normals()
  geometry.compute_bounding_box()
  near(geometry.bounding_box().unwrap().max().z(), 1)
  assert_true(geometry.get_attribute("normal").unwrap().get_z(face.a()) < 1)
}

///|
test "Mesh modifiers subdivide long edges, split hard corners and reduce vertices" {
  let original = @three.PlaneGeometry(2, 2).as_buffer_geometry()
  let tessellated = @three.TessellateModifier(0.8, 8).modify(original)
  assert_true(
    tessellated.get_attribute("position").unwrap().count() >
    original.get_attribute("position").unwrap().count(),
  )
  let positions = tessellated.get_attribute("position").unwrap()
  for face in 0..<(positions.count() / 3) {
    let a = @three.Vector3(0, 0, 0).from_buffer_attribute(positions, face * 3)
    let b = @three.Vector3(0, 0, 0).from_buffer_attribute(
      positions,
      face * 3 + 1,
    )
    let c = @three.Vector3(0, 0, 0).from_buffer_attribute(
      positions,
      face * 3 + 2,
    )
    assert_true(
      a.distance_to(b) <= 0.800001 &&
      b.distance_to(c) <= 0.800001 &&
      c.distance_to(a) <= 0.800001,
    )
  }
  let cube = @three.BoxGeometry(2, 2, 2).as_buffer_geometry()
  cube.delete_attribute("normal").delete_attribute("uv") |> ignore
  let welded = @three.merge_vertices(cube, 0.0001)
  assert_eq(welded.get_attribute("position").unwrap().count(), 8)
  let split = @three.EdgeSplitModifier().modify(welded, 0.5, false)
  assert_true(split.get_attribute("position").unwrap().count() > 8)
  let grid = @three.PlaneGeometry::segmented(2, 2, 4, 4).as_buffer_geometry()
  let reduced = @three.SimplifyModifier().modify(grid, 5)
  assert_eq(reduced.get_attribute("position").unwrap().count(), 20)
  assert_eq(grid.get_attribute("position").unwrap().count(), 25)
}

///|
test "Geometry attribute tools preserve layout and reject incompatible storage" {
  let position = @three.Float32BufferAttribute([0, 0, 0, 1, 2, 3], 3, false).as_packed_buffer_attribute()
  let uv = @three.Float32BufferAttribute([0, 0, 1, 1], 2, false).as_packed_buffer_attribute()
  let interleaved = @three.interleave_attributes([position, uv]).unwrap()
  assert_eq(interleaved.length(), 2)
  assert_eq(interleaved[0].data().stride(), 5)
  near(interleaved[0].get_y(1), 2)
  near(interleaved[1].get_x(1), 1)
  let packed = @three.deinterleave_attribute(interleaved[0])
  assert_eq(packed.raw_values().length(), 6)
  near(packed.as_buffer_attribute().get_z(1), 3)
  let merged = @three.merge_attributes([position, position]).unwrap()
  assert_eq(merged.as_buffer_attribute().count(), 4)
  assert_true(@three.interleave_attributes([]) is None)
  assert_true(@three.merge_attributes([position, uv]) is None)
  let short = @three.Float32BufferAttribute([1, 2], 2, false).as_packed_buffer_attribute()
  assert_true(@three.interleave_attributes([position, short]) is None)
  let half = @three.Float16BufferAttribute::from_floats([0.5, -2], 1)
  let cloned = @three.deep_clone_attribute(half.as_buffer_attribute())
  near(cloned.as_buffer_attribute().get_x(0), 0.5)
  half.as_buffer_attribute().set_x(0, 1) |> ignore
  near(cloned.as_buffer_attribute().get_x(0), 0.5)
  assert_true(
    @three.merge_attributes([half.as_packed_buffer_attribute()]) is None,
  )
  assert_true(
    @three.interleave_attributes([half.as_packed_buffer_attribute()]) is None,
  )
}

///|
async test "MikkTSpace tangents and morph snapshots support a modeling pipeline" {
  let plane = @three.PlaneGeometry(2, 2).as_buffer_geometry()
  let tangent_geometry = @three.compute_mikktspace_tangents(plane, true)
  assert_true(plane.same_reference(tangent_geometry))
  assert_true(plane.get_index() is None)
  let tangents = plane.get_attribute("tangent").unwrap()
  let normals = plane.get_attribute("normal").unwrap()
  assert_eq(tangents.item_size(), 4)
  for i in 0..<tangents.count() {
    near(@three.Vector3(0, 0, 0).from_buffer_attribute(tangents, i).length(), 1)
    near(
      @three.Vector3(0, 0, 0)
      .from_buffer_attribute(tangents, i)
      .dot(@three.Vector3(0, 0, 0).from_buffer_attribute(normals, i)),
      0,
    )
    near(tangents.get_w(i), -1)
  }
  let triangle = @three.BufferGeometry()
  triangle.set_attribute(
    "position",
    @three.BufferAttribute::from_floats([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
  )
  |> ignore
  triangle.compute_vertex_normals()
  triangle.set_morph_targets_relative(true)
  triangle.set_morph_attributes("position", [
    @three.BufferAttribute::from_floats([0, 0, 2, 0, 0, 2, 0, 0, 2], 3),
  ])
  let mesh = @three.Mesh(
    triangle,
    @three.MeshBasicMaterial(0xffffff).as_material(),
  )
  assert_true(mesh.set_morph_influence(0, 0.5))
  let morphed = @three.compute_morphed_attributes(mesh)
  near(morphed.position().get_z(0), 0)
  near(morphed.morphed_position().get_z(0), 1)
  try @three.compute_mikktspace_tangents(@three.BufferGeometry(), true) catch {
    @three.ModelingError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("missing geometry attributes must reject")
  }
}

///|
test "OBJ and STL roundtrips bake world transforms into exported vertices" {
  let mesh = @three.Mesh(
    @three.BoxGeometry(1, 1, 1).as_buffer_geometry(),
    @three.MeshBasicMaterial(0xffffff).as_material(),
  ).as_object3d()
  mesh.position().set(2, 3, 4) |> ignore
  mesh.update_matrix_world(true)
  let obj = @three.OBJExporter().parse(mesh)
  assert_true(obj.contains("v 2.5"))
  let restored = @three.OBJLoader().parse(obj).as_object3d().children()[0]
    .as_mesh()
    .unwrap()
    .geometry()
  restored.compute_bounding_box()
  near(restored.bounding_box().unwrap().min().x(), 1.5)
  let exporter = @three.STLExporter()
  let ascii = exporter.export_ascii(mesh)
  assert_true(ascii.contains("facet normal"))
  let binary = exporter.export_binary(mesh)
  assert_eq(binary.length(), 84 + 12 * 50)
  assert_eq(binary[80].to_int(), 12)
  let stl = @three.STLLoader().parse(binary)
  stl.compute_bounding_box()
  assert_eq(stl.get_attribute("position").unwrap().count(), 36)
  near(stl.bounding_box().unwrap().max().z(), 4.5)
}
