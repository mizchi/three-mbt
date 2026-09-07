///|
async test "CSG geometry operations expose closed and empty results through MoonBit" {
  let csg = @three.CSG()
  assert_false(csg.ready())
  csg.initialize()
  assert_true(csg.ready())
  near(csg.weld_tolerance(), 0.000001)
  let a = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  let b = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer a.dispose()
  defer b.dispose()
  b.translate(0.5, 0, 0) |> ignore
  let union = csg.union_geometry(a, b, 6)
  defer union.dispose()
  near(union.bounding_box().unwrap().min().x(), -0.5)
  near(union.bounding_box().unwrap().max().x(), 1)
  let difference = csg.subtract_geometry(a, b, 6)
  defer difference.dispose()
  near(difference.bounding_box().unwrap().max().x(), 0)
  let common = csg.intersect_geometry(a, b, 6)
  defer common.dispose()
  near(common.bounding_box().unwrap().min().x(), 0)
  near(common.bounding_box().unwrap().max().x(), 0.5)
  let topology = @three.MeshTopology::from_welded(difference, 0)
  assert_eq(topology.boundary_edges().length(), 0)
  assert_eq(topology.inconsistent_edges().length(), 0)
  let empty = csg.subtract_geometry(a, a, 6)
  defer empty.dispose()
  assert_eq(empty.get_index().unwrap().count(), 0)
}

///|
async test "CSG mesh operations retain transforms and source material references" {
  let csg = @three.CSG()
  csg.initialize()
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer geometry.dispose()
  let red = @three.MeshBasicMaterial(0xff0000).as_material()
  let green = @three.MeshBasicMaterial(0x00ff00).as_material()
  defer red.dispose()
  defer green.dispose()
  let a = @three.Mesh(geometry, red)
  let b = @three.Mesh(geometry, green)
  a.as_object3d().position().set_x(2) |> ignore
  b.as_object3d().position().set_x(2.5) |> ignore
  let result = csg.subtract_mesh(a, b)
  defer result.geometry().dispose()
  near(result.geometry().bounding_box().unwrap().min().x(), 1.5)
  near(result.geometry().bounding_box().unwrap().max().x(), 2)
  assert_eq(result.materials().length(), 2)
  assert_true(result.materials()[0].same_reference(red))
  assert_true(result.materials()[1].same_reference(green))
}

///|
async test "CSG validation failures stay inside ModelingError" {
  let csg = @three.CSG()
  let a = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer a.dispose()
  try csg.union_geometry(a, a, 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("uninitialized CSG must reject")
  }
  try csg.initialize_from_bytes(Bytes::new(4)) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("invalid WASM must reject")
  }
  assert_false(csg.ready())
  csg.initialize()
  let plane = @three.PlaneGeometry(1, 1).as_buffer_geometry()
  defer plane.dispose()
  try csg.subtract_geometry(a, plane, 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("open CSG operand must reject")
  }
  try csg.set_weld_tolerance(-1) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("negative tolerance must reject")
  }
}
