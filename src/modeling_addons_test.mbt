///|
test "Font outlines become extruded text with requested size and depth" {
  let json =
    #|{"glyphs":{"A":{"ha":1100,"x_min":0,"x_max":1000,"o":"m 0 0 l 1000 0 l 1000 1000 l 0 1000 l 0 0"}},"familyName":"Test","resolution":1000,"boundingBox":{"yMin":0,"yMax":1000},"underlineThickness":0}
  let font = @three.FontLoader().parse_json_string(json)
  assert_eq(font.generate_shapes("AA", 2, LeftToRight).length(), 2)
  let options = @three.TextGeometryOptions(font, 2, 0.5)
  options.as_extrude_options().set_bevel_enabled(false)
  let geometry = @three.TextGeometry("A", options).as_buffer_geometry()
  geometry.compute_bounding_box()
  near(geometry.bounding_box().unwrap().max().x(), 2)
  near(geometry.bounding_box().unwrap().max().z(), 0.5)
}

///|
test "SelectionBox selects centers in a camera rectangle" {
  let scene = @three.Scene()
  let camera = @three.OrthographicCamera(-2, 2, 2, -2, 0.1, 10)
  camera.as_object3d().position().set_z(4) |> ignore
  camera.as_object3d().update_matrix_world(true)
  let a = @three.Mesh(
    @three.BoxGeometry(0.2, 0.2, 0.2).as_buffer_geometry(),
    @three.MeshBasicMaterial(0xffffff).as_material(),
  ).as_object3d()
  let b = a.clone(recursive=true)
  b.position().set_x(1.5) |> ignore
  scene.as_object3d().add(a).add(b) |> ignore
  scene.as_object3d().update_matrix_world(true)
  let box = @three.SelectionBox(camera.as_camera(), scene, 10)
  let selected = box.select(
    @three.Vector3(-0.25, 0.25, 0),
    @three.Vector3(0.25, -0.25, 0),
  )
  assert_eq(selected.length(), 1)
  assert_true(selected[0].same_reference(a))
}

///|
test "MTL materials attach to OBJ and colored PLY roundtrips in both byte orders" {
  let creator = @three.MTLLoader().parse("newmtl Red\nKd 1 0 0\nd 0.5\n", "")
  creator.preload()
  let obj = @three.OBJLoader()
  obj.set_materials(creator) |> ignore
  let root = obj
    .parse("v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Red\nf 1 2 3\n")
    .as_object3d()
  let mesh = root.children()[0].as_mesh().unwrap()
  near(mesh.materials()[0].opacity(), 0.5)
  near(mesh.materials()[0].as_phong_material().unwrap().color().r(), 1)
  mesh
  .geometry()
  .set_attribute(
    "color",
    @three.BufferAttribute::from_floats([1, 0, 0, 0, 1, 0, 0, 0, 1], 3),
  )
  |> ignore
  root.position().set_x(2) |> ignore
  root.update_matrix_world(true)
  let exporter = @three.PLYExporter()
  let options = @three.PLYExportOptions()
  for little in [true, false] {
    options.set_little_endian(little)
    let data = exporter.export_binary(root, options)
    let restored = @three.PLYLoader().parse(data)
    near(restored.get_attribute("position").unwrap().get_x(0), 2)
    near(restored.get_attribute("color").unwrap().get_y(1), 1)
    assert_eq(restored.get_index().unwrap().count(), 3)
  }
  let ascii = exporter.export_ascii(root, options)
  assert_true(ascii.contains("format ascii"))
  assert_eq(
    @three.PLYLoader()
    .parse_ascii(ascii)
    .get_attribute("position")
    .unwrap()
    .count(),
    3,
  )
}

///|
test "Weighted NURBS quarter circle and a bilinear surface retain geometry" {
  let curve = @three.NURBSCurve(2, [0, 0, 0, 1, 1, 1], [
    @three.Vector4(1, 0, 0, 1),
    @three.Vector4(1, 1, 0, 0.7071067811865476),
    @three.Vector4(0, 1, 0, 1),
  ])
  let point = curve.as_curve3().get_point(0.5, @three.Vector3(0, 0, 0))
  near(point.x(), 0.7071067811865476)
  near(point.y(), 0.7071067811865476)
  let surface = @three.NURBSSurface(1, 1, [0, 0, 1, 1], [0, 0, 1, 1], [
    [@three.Vector4(0, 0, 0, 1), @three.Vector4(0, 2, 0, 1)],
    [@three.Vector4(2, 0, 0, 1), @three.Vector4(2, 2, 2, 1)],
  ])
  surface.get_point(0.5, 0.5, point)
  near(point.x(), 1)
  near(point.y(), 1)
  near(point.z(), 0.5)
  let geometry = @three.ParametricGeometry(
    fn(u, v, target) { surface.get_point(u, v, target) },
    4,
    4,
  ).as_buffer_geometry()
  assert_eq(geometry.get_attribute("position").unwrap().count(), 25)
}

///|
test "Flow instances encode curve lengths and offsets without modifying source geometry" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let material = @three.MeshBasicMaterial(0xff0000).as_material()
  let flow = @three.InstancedFlow(2, 1, geometry, material)
  let curve = @three.LineCurve3(
    @three.Vector3(0, 0, 0),
    @three.Vector3(4, 0, 0),
  ).as_curve3()
  flow.as_flow().update_curve(0, curve)
  flow.set_curve(1, 0)
  flow.move_individual_along_curve(1, 0.25)
  let matrix = @three.Matrix4()
  flow.object().get_matrix_at(1, matrix)
  let translation = @three.Vector3(0, 0, 0).set_from_matrix_position(matrix)
  near(translation.x(), 4)
  near(translation.z(), 0.25)
  near(flow.as_flow().curve_length(0).unwrap(), 4)
  near(
    flow.as_flow().curve(0).unwrap().get_point(1, @three.Vector3(0, 0, 0)).x(),
    4,
  )
  try flow.set_curve(2, 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("invalid instance index must reject")
  }
  try flow.as_flow().update_curve(-1, curve) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("negative curve index must reject")
  }
  assert_eq(geometry.get_attribute("position").unwrap().count(), 24)
  flow.as_flow().spline_texture().as_texture().dispose()
  flow.object().as_mesh().materials()[0].dispose()
  flow.object().dispose()
  geometry.dispose()
  material.dispose()
}

///|
test "Decals clip to a projection box and UV callbacks drive extrusion" {
  let mesh = @three.Mesh(
    @three.PlaneGeometry(4, 4).as_buffer_geometry(),
    @three.MeshBasicMaterial(0xffffff).as_material(),
  )
  mesh.as_object3d().update_matrix_world(true)
  let decal = @three.DecalGeometry(
    mesh,
    @three.Vector3(0, 0, 0),
    @three.Euler(0, 0, 0),
    @three.Vector3(1, 1, 1),
  ).as_buffer_geometry()
  decal.compute_bounding_box()
  near(decal.bounding_box().unwrap().max().x(), 0.5)
  near(decal.bounding_box().unwrap().min().y(), -0.5)
  let generator = @three.UVGenerator(
    fn(_geometry, _vertices, _a, _b, _c) {
      [
        @three.Vector2(0.25, 0.75),
        @three.Vector2(0.25, 0.75),
        @three.Vector2(0.25, 0.75),
      ]
    },
    fn(_geometry, _vertices, _a, _b, _c, _d) {
      [
        @three.Vector2(0.25, 0.75),
        @three.Vector2(0.25, 0.75),
        @three.Vector2(0.25, 0.75),
        @three.Vector2(0.25, 0.75),
      ]
    },
  )
  let options = @three.ExtrudeOptions()
  options.set_uv_generator(Some(generator))
  let shape = @three.Shape::from_points([
    @three.Vector2(0, 0),
    @three.Vector2(1, 0),
    @three.Vector2(0, 1),
  ])
  let geometry = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
  let uv = geometry.get_attribute("uv").unwrap()
  for i in 0..<uv.count() {
    near(uv.get_x(i), 0.25)
    near(uv.get_y(i), 0.75)
  }
  let normals = @three.VertexNormalsHelper(mesh.as_object3d(), 0.5, 0xff0000)
  normals.update()
  assert_eq(
    normals
    .as_line_segments()
    .geometry()
    .get_attribute("position")
    .unwrap()
    .count(),
    8,
  )
  normals.dispose()
  mesh.geometry().compute_tangents()
  let tangents = @three.VertexTangentsHelper(mesh.as_object3d(), 0.5, 0x00ff00)
  tangents.update()
  assert_eq(
    tangents
    .as_line_segments()
    .geometry()
    .get_attribute("position")
    .unwrap()
    .count(),
    8,
  )
  tangents.dispose()
}
