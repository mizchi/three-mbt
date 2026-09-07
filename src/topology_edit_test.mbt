///|
test "region extrusion and edge splitting preserve a closed mesh across the FFI" {
  let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer source.dispose()
  let topology = @three.MeshTopology::from_welded(source, 0)
  let selection = @three.MeshSelection(topology)
  for face in topology.faces() {
    if topology.face_normal(face).y() > 0.9 {
      selection.set_face(face, true)
    }
  }
  let extruded = selection.extruded_geometry(@three.Vector3(0, 1, 0), 6)
  defer extruded.dispose()
  near(extruded.bounding_box().unwrap().max().y(), 1.5)
  assert_eq(selection.faces().length(), 2)
  let next = @three.MeshTopology::from_welded(extruded, 0)
  assert_eq(next.faces().length(), 20)
  assert_eq(next.vertices().length(), 12)
  assert_eq(next.boundary_edges().length(), 0)
  let split = @three.MeshSelection(next)
  for edge in next.edges() {
    split.set_edge(edge, true)
  }
  let result = split.split_edges_geometry(0.5)
  defer result.dispose()
  let after = @three.MeshTopology::from_welded(result, 0)
  assert_eq(after.faces().length(), 80)
  assert_eq(after.boundary_edges().length(), 0)
  assert_eq(after.inconsistent_edges().length(), 0)
  assert_eq(after.nonmanifold_edges().length(), 0)
  assert_eq(after.degenerate_faces().length(), 0)
  source.compute_bounding_box()
  near(source.bounding_box().unwrap().max().y(), 0.5)
}

///|
test "invalid connectivity edits raise ModelingError without changing the selection" {
  let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer source.dispose()
  let topology = @three.MeshTopology::from_welded(source, 0)
  let selection = @three.MeshSelection(topology)
  selection.set_face(topology.face_id(0).unwrap(), true)
  selection.set_edge(topology.edge_id(0).unwrap(), true)
  try selection.extruded_geometry(@three.Vector3(0, 0, 0), 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("zero extrusion must reject")
  }
  try selection.extruded_geometry(@three.Vector3(1, 0, 0), -1) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("negative material index must reject")
  }
  try selection.split_edges_geometry(1) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("endpoint edge split must reject")
  }
  assert_eq(selection.faces().length(), 1)
  assert_eq(selection.edges().length(), 1)
}

///|
test "selected convex ridges bevel into a closed mesh through the typed API" {
  let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer source.dispose()
  let topology = @three.MeshTopology::from_welded(source, 0)
  let selection = @three.MeshSelection(topology)
  for edge in topology.edges() {
    selection.set_edge(edge, true)
  }
  let result = selection.beveled_geometry(0.1, 6)
  defer result.dispose()
  let after = @three.MeshTopology::from_welded(result, 0)
  assert_eq(after.boundary_edges().length(), 0)
  assert_eq(after.nonmanifold_edges().length(), 0)
  assert_eq(after.inconsistent_edges().length(), 0)
  assert_eq(after.degenerate_faces().length(), 0)
  assert_true(after.faces().length() > 12)
  near(result.bounding_box().unwrap().max().x(), 0.5)
  assert_eq(selection.edges().length(), 18)
  assert_eq(source.get_attribute("position").unwrap().count(), 24)
  try selection.beveled_geometry(0, 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("zero bevel width must reject")
  }
  try selection.beveled_geometry(0.6, 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("bevel width must not remove an original supporting face")
  }
}

///|
test "bevel reports unsupported open surfaces as ModelingError" {
  let plane = @three.PlaneGeometry(1, 1).as_buffer_geometry()
  defer plane.dispose()
  let topology = @three.MeshTopology(plane)
  let selection = @three.MeshSelection(topology)
  selection.set_edge(topology.edge_id(0).unwrap(), true)
  try selection.beveled_geometry(0.1, 0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("open mesh bevel must reject")
  }
}
