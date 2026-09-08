///|
fn loft() -> @three.BufferGeometry raise {
  let noise = @three.SimplexNoise::seeded(42)
  let height = 0.5 + noise.noise(0.2, 0.3) * 0.05
  let sections : FixedArray[FixedArray[@three.Vector3]] = [
    [
      @three.Vector3(-0.5, -0.5, -0.5),
      @three.Vector3(-0.5, -0.5, 0.5),
      @three.Vector3(0.5, -0.5, 0.5),
      @three.Vector3(0.5, -0.5, -0.5),
    ],
    [
      @three.Vector3(-0.5, height, -0.5),
      @three.Vector3(-0.5, height, 0.5),
      @three.Vector3(0.5, height, 0.5),
      @three.Vector3(0.5, height, -0.5),
    ],
  ]
  let options = @three.LoftOptions()
  options.set_cap_start(true)
  options.set_cap_end(true)
  @three.LoftGeometry(sections, options).as_buffer_geometry()
}

///|
fn translated(geometry : @three.BufferGeometry) -> @three.BufferGeometry raise {
  let topology = @three.MeshTopology::from_welded(geometry, 0.000001)
  let selection = @three.MeshSelection(topology)
  selection.select_connected_faces(topology.face_id(0).unwrap())
  selection.translated_geometry(@three.Vector3(2, 0, 0))
}

///|
fn pixel(
  renderer : @three.WebGLRenderer,
  target : @three.WebGLRenderTarget,
) -> Bytes {
  let bytes = Bytes::new(4)
  renderer.read_render_target_pixels(target, 8, 8, 1, 1, bytes)
  bytes
}

///|
pub fn render_edit() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(16, 16)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    let scene = @three.Scene()
    scene.set_background(Some(@three.Color::from_hex(0x000000)))
    let camera = @three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.as_object3d().position().set_z(3) |> ignore
    let geometry = loft()
    defer geometry.dispose()
    let material = @three.MeshBasicMaterial(0xff0000).as_material()
    defer material.dispose()
    material.set_side(@three.DoubleSide)
    let mesh = @three.Mesh(geometry, material)
    scene.as_object3d().add(mesh.as_object3d()) |> ignore
    renderer.render(scene, camera.as_camera())
    let before = pixel(renderer, target)
    let edited = translated(geometry)
    defer edited.dispose()
    mesh.set_geometry(edited)
    renderer.render(scene, camera.as_camera())
    let after = pixel(renderer, target)
    let white = @three.MeshBasicMaterial(0xffffff).as_material()
    defer white.dispose()
    white.set_side(@three.DoubleSide)
    let batch = @three.BatchedMesh(2, 100, 300, white)
    defer batch.dispose()
    let id = batch.add_instance(batch.add_geometry(geometry))
    batch.set_color_at(id, @three.Color::from_hex(0x00ff00)) |> ignore
    let expanded = @three.SceneUtils()
      .meshes_from_batch(batch, true)
      .as_object3d()
    defer (for child in expanded.children() {
      let child = child.as_mesh().unwrap()
      child.geometry().dispose()
      child.materials()[0].dispose()
    })
    scene.as_object3d().add(expanded) |> ignore
    renderer.render(scene, camera.as_camera())
    before + after + pixel(renderer, target)
  })
}

///|
pub fn export_edit() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let geometry = loft()
    defer geometry.dispose()
    let edited = translated(geometry)
    defer edited.dispose()
    let topology = @three.MeshTopology::from_welded(edited, 0.000001)
    assert_eq(topology.boundary_edges().length(), 0)
    assert_eq(topology.nonmanifold_edges().length(), 0)
    assert_eq(topology.inconsistent_edges().length(), 0)
    assert_eq(topology.degenerate_faces().length(), 0)
    let material = @three.MeshBasicMaterial(0xffffff).as_material()
    defer material.dispose()
    @three.STLExporter().export_binary(
      @three.Mesh(edited, material).as_object3d(),
    )
  })
}

///|
fn extrude_and_split(
  source : @three.BufferGeometry,
) -> @three.BufferGeometry raise {
  let topology = @three.MeshTopology::from_welded(source, 0)
  let region = @three.MeshSelection(topology)
  for face in topology.faces() {
    if topology.face_normal(face).y() > 0.9 {
      region.set_face(face, true)
    }
  }
  let extruded = region.extruded_geometry(@three.Vector3(0, 1, 0), 6)
  defer extruded.dispose()
  let next = @three.MeshTopology::from_welded(extruded, 0)
  let edges = @three.MeshSelection(next)
  for edge in next.edges() {
    edges.set_edge(edge, true)
  }
  edges.split_edges_geometry(0.5)
}

///|
pub fn render_connectivity() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(16, 16)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    let camera = @three.OrthographicCamera(-1, 1, 2, -1, 0.1, 10)
    camera.as_object3d().position().set_z(3) |> ignore
    let scene = @three.Scene()
    scene.set_background(Some(@three.Color::from_hex(0x000000)))
    let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
    defer source.dispose()
    let red = @three.MeshBasicMaterial(0xff0000).as_material()
    let green = @three.MeshBasicMaterial(0x00ff00).as_material()
    defer red.dispose()
    defer green.dispose()
    let mesh = @three.Mesh(source, red)
    mesh.set_materials([red, red, red, red, red, red, green])
    scene.as_object3d().add(mesh.as_object3d()) |> ignore
    renderer.render(scene, camera.as_camera())
    let before = Bytes::new(4)
    renderer.read_render_target_pixels(target, 8, 10, 1, 1, before)
    let edited = extrude_and_split(source)
    defer edited.dispose()
    mesh.set_geometry(edited)
    renderer.render(scene, camera.as_camera())
    let after = Bytes::new(4)
    renderer.read_render_target_pixels(target, 8, 10, 1, 1, after)
    before + after
  })
}

///|
pub fn export_connectivity() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
    defer source.dispose()
    let edited = extrude_and_split(source)
    defer edited.dispose()
    let material = @three.MeshBasicMaterial(0xffffff).as_material()
    defer material.dispose()
    @three.STLExporter().export_binary(
      @three.Mesh(edited, material).as_object3d(),
    )
  })
}

///|
fn bevel_front_edge(
  source : @three.BufferGeometry,
) -> @three.BufferGeometry raise {
  let topology = @three.MeshTopology::from_welded(source, 0)
  let selection = @three.MeshSelection(topology)
  for edge in topology.edges() {
    let faces = topology.edge_faces(edge)
    let a = topology.face_normal(faces[0])
    let b = topology.face_normal(faces[1])
    if (a.x() > 0.99 && b.z() > 0.99) || (b.x() > 0.99 && a.z() > 0.99) {
      selection.set_edge(edge, true)
    }
  }
  selection.beveled_geometry(0.25, 6)
}

///|
pub fn render_bevel() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(16, 16)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    let scene = @three.Scene()
    let camera = @three.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, 0.1, 10)
    camera.as_object3d().position().set_z(3) |> ignore
    let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
    defer source.dispose()
    let red = @three.MeshBasicMaterial(0xff0000).as_material()
    let green = @three.MeshBasicMaterial(0x00ff00).as_material()
    defer red.dispose()
    defer green.dispose()
    let mesh = @three.Mesh(source, red)
    mesh.set_materials([red, red, red, red, red, red, green])
    scene.as_object3d().add(mesh.as_object3d()) |> ignore
    renderer.render(scene, camera.as_camera())
    let before = Bytes::new(4)
    renderer.read_render_target_pixels(target, 13, 8, 1, 1, before)
    let beveled = bevel_front_edge(source)
    defer beveled.dispose()
    mesh.set_geometry(beveled)
    renderer.render(scene, camera.as_camera())
    let after = Bytes::new(4)
    renderer.read_render_target_pixels(target, 13, 8, 1, 1, after)
    before + after
  })
}

///|
pub fn export_bevel() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let source = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
    defer source.dispose()
    let beveled = bevel_front_edge(source)
    defer beveled.dispose()
    let material = @three.MeshBasicMaterial(0xffffff).as_material()
    defer material.dispose()
    @three.STLExporter().export_binary(
      @three.Mesh(beveled, material).as_object3d(),
    )
  })
}

///|
fn main {
  println("Import render_edit() or export_edit() from the browser ESM bundle.")
}
