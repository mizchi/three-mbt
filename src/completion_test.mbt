///|
test "Shader defines and texture sources preserve typed values and partial updates" {
  let defines = @three.ShaderDefines()
  defines.set_int("COUNT", 3)
  defines.set_bool("ENABLED", true)
  defines.set_string("MODE", "1")
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  material.set_defines(defines)
  assert_eq(material.defines().unwrap().get_int("COUNT"), Some(3))
  let source = @three.Source::from_rgba(
    b"\xff\x00\x00\xff\x00\x00\xff\xff", 2, 1,
  )
  let texture = @three.Texture()
  texture.set_source(source)
  texture.write_rgba(4, b"\x00\xff\x00\xff")
  assert_eq(source.rgba_bytes().unwrap()[5].to_int(), 255)
  assert_eq(texture.update_ranges()[0].start(), 4)
  assert_eq(texture.update_ranges()[0].count(), 4)
  let size = source.get_size(@three.Vector3(0, 0, 0))
  near(size.x(), 2)
  texture.clear_update_ranges()
  assert_eq(texture.update_ranges().length(), 0)
}

///|
test "Convex hull queries and octree candidates expose editable geometry" {
  let hull = @three.ConvexHull().set_from_points([
    @three.Vector3(0, 0, 0),
    @three.Vector3(1, 0, 0),
    @three.Vector3(0, 1, 0),
    @three.Vector3(0, 0, 1),
  ])
  assert_true(hull.contains_point(@three.Vector3(0.1, 0.1, 0.1)))
  assert_true(!hull.contains_point(@three.Vector3(1, 1, 1)))
  assert_eq(hull.faces().length(), 4)
  assert_true(hull.faces()[0].area() > 0)
  let tree = @three.Octree()
    .add_triangle(
      @three.Triangle(
        @three.Vector3(0, 0, 0),
        @three.Vector3(1, 0, 0),
        @three.Vector3(0, 1, 0),
      ),
    )
    .build()
  let ray = @three.Ray(@three.Vector3(0.1, 0.1, 1), @three.Vector3(0, 0, -1))
  assert_eq(tree.ray_triangles(ray).length(), 1)
}

///|
test "OBJ and MTL export use stable material names and texture paths" {
  let material = @three.MeshPhongMaterial(0xff0000, 30).as_material()
  let mesh = @three.Mesh(
    @three.BoxGeometry(1, 1, 1).as_buffer_geometry(),
    material,
  ).as_object3d()
  let result = @three.OBJMTLExporter().export_bundle(
    mesh,
    "part.mtl",
    @three.TexturePaths(),
  )
  assert_true(result.obj().contains("mtllib part.mtl"))
  assert_true(result.obj().contains("usemtl material_0"))
  assert_true(result.mtl().contains("newmtl material_0"))
  let creator = @three.MTLLoader().parse(result.mtl(), "")
  let obj = @three.OBJLoader().set_materials(creator).parse(result.obj())
  let restored = obj.as_object3d().children()[0].as_mesh().unwrap().materials()[0]
    .as_phong_material()
    .unwrap()
  near(restored.color().r(), 1)
  near(restored.color().g(), 0)
}
