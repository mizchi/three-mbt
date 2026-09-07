///|
test "loft geometry connects capped sections and noise is reproducible" {
  let sections : FixedArray[FixedArray[@three.Vector3]] = [
    [
      @three.Vector3(-1, 0, -1),
      @three.Vector3(-1, 0, 1),
      @three.Vector3(1, 0, 1),
      @three.Vector3(1, 0, -1),
    ],
    [
      @three.Vector3(-0.5, 2, -0.5),
      @three.Vector3(-0.5, 2, 0.5),
      @three.Vector3(0.5, 2, 0.5),
      @three.Vector3(0.5, 2, -0.5),
    ],
  ]
  let options = @three.LoftOptions()
  options.set_cap_start(true)
  options.set_cap_end(true)
  let geometry = @three.LoftGeometry(sections, options).as_buffer_geometry()
  geometry.compute_bounding_box()
  near(geometry.bounding_box().unwrap().max().y(), 2)
  let a = @three.SimplexNoise::seeded(42)
  let b = @three.SimplexNoise::seeded(42)
  near(a.noise3d(0.12, 0.34, 0.56), b.noise3d(0.12, 0.34, 0.56))
  near(@three.ImprovedNoise().noise(0, 0, 0), 0)
  geometry.dispose()
}

///|
test "NURBS basis and derivatives match a linear segment" {
  let utils = @three.NURBSUtils()
  let knots : FixedArray[Double] = [0.0, 0, 1, 1]
  let points : FixedArray[@three.Vector4] = [
    @three.Vector4(0, 0, 0, 1),
    @three.Vector4(2, 0, 0, 1),
  ]

  assert_eq(utils.find_span(1, 0.25, knots), 1)
  let basis = utils.basis_functions(1, 0.25, 1, knots)
  near(basis[0], 0.75)
  near(basis[1], 0.25)
  let derivatives = utils.curve_derivatives(1, knots, points, 0.25, 1)
  near(derivatives[0].x(), 0.5)
  near(derivatives[1].x(), 2)
}

///|
test "checked modeling constructors raise MoonBit errors" {
  try @three.SimplexNoise::with_random(() => 2.0) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("invalid random callback must reject")
  }
  try @three.LoftGeometry([], @three.LoftOptions()) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("empty loft must reject")
  }
  try @three.NURBSVolume(1, 1, 1, [], [], [], []) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("empty NURBS volume must reject")
  }
  let empty = @three.BufferGeometry()
  defer empty.dispose()
  try @three.MeshTopology(empty) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("missing positions must reject")
  }
}

///|
test "volume evaluation and control point snapshots cross the FFI correctly" {
  let knots : FixedArray[Double] = [0, 0, 1, 1]
  let points : FixedArray[FixedArray[FixedArray[@three.Vector4]]] = FixedArray::makei(
    2,
    fn(i) {
      FixedArray::makei(2, fn(j) {
        FixedArray::makei(2, fn(k) {
          @three.Vector4(i.to_double(), j.to_double(), k.to_double(), 1)
        })
      })
    },
  )
  let volume = @three.NURBSVolume(1, 1, 1, knots, knots, knots, points)
  let target = @three.Vector3(0, 0, 0)
  volume.get_point(0.25, 0.5, 0.75, target)
  near(target.x(), 0.25)
  near(target.y(), 0.5)
  near(target.z(), 0.75)
  volume.control_points()[0][0][0].set_x(100) |> ignore
  volume.get_point(0, 0, 0, target)
  near(target.x(), 0)
  volume.set_control_point(0, 0, 0, @three.Vector4(2, 0, 0, 1))
  volume.get_point(0, 0, 0, target)
  near(target.x(), 2)
  let point = @three.NURBSUtils().volume_point(
    1, 1, 1, knots, knots, knots, points, 0.25, 0.5, 0.75, target,
  )
  near(point.x(), 0.25)
  try volume.get_point(2, 0, 0, target) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("out of domain parameter must reject")
  }
}

///|
test "topology selection preserves seams and rejects foreign IDs" {
  let box = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer box.dispose()
  let topology = @three.MeshTopology::from_welded(box, 0.000001)
  assert_eq(topology.vertices().length(), 8)
  assert_eq(topology.edges().length(), 18)
  assert_eq(topology.faces().length(), 12)
  assert_eq(topology.boundary_edges().length(), 0)
  assert_true(topology.vertex_id(99) is None)
  let selection = @three.MeshSelection(topology)
  let vertex = topology.vertex_id(0).unwrap()
  let before = topology.vertex_position(vertex)
  selection.set_vertex(vertex, true)
  let moved = selection.translated_geometry(@three.Vector3(1, 0, 0))
  defer moved.dispose()
  for index in topology.source_indices(vertex) {
    near(moved.get_attribute("position").unwrap().get_x(index), before.x() + 1)
    near(box.get_attribute("position").unwrap().get_x(index), before.x())
  }
  let other = @three.MeshTopology::from_welded(box, 0)
  try selection.set_vertex(other.vertex_id(0).unwrap(), true) catch {
    @three.ModelingError(_) => ()
  } noraise {
    _ => fail("foreign topology ID must reject")
  }
  selection.clear()
  selection.select_connected_faces(topology.face_id(0).unwrap())
  assert_eq(selection.faces().length(), 12)
  assert_eq(selection.effective_vertices().length(), 8)
}

///|
test "batch expansion yields independent meshes with instance transforms" {
  let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
  defer geometry.dispose()
  let material = @three.MeshBasicMaterial(0xffffff).as_material()
  defer material.dispose()
  let batch = @three.BatchedMesh(3, 100, 300, material)
  defer batch.dispose()
  let id = batch.add_geometry(geometry)
  let removed = batch.add_instance(id)
  let instance = batch.add_instance(id)
  batch.delete_instance(removed) |> ignore
  batch.set_matrix_at(instance, @three.Matrix4().make_translation(3, 0, 0))
  |> ignore
  let utils = @three.SceneUtils()
  assert_eq(utils.batch_instance_ids(batch).length(), 1)
  let group = utils.meshes_from_batch(batch, true).as_object3d()
  assert_eq(group.children().length(), 1)
  let mesh = group.children()[0].as_mesh().unwrap()
  defer mesh.geometry().dispose()
  defer mesh.materials()[0].dispose()
  near(mesh.as_object3d().position().x(), 3)
  assert_eq(mesh.geometry().get_attribute("position").unwrap().count(), 24)
  let extracted = utils.batch_geometry(batch, id)
  defer extracted.dispose()
  assert_eq(extracted.get_attribute("position").unwrap().count(), 24)
}
