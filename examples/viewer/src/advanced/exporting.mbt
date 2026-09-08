///|
pub fn export_roundtrip() -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let scene = @three.Scene()
    let geometry = @three.BoxGeometry(1, 1, 1).as_buffer_geometry()
    let material = @three.MeshStandardMaterial(
      0xff0000,
      roughness=0.5,
      metalness=0,
    ).as_material()
    defer geometry.dispose()
    defer material.dispose()
    let mesh = @three.Mesh(geometry, material).as_object3d()
    mesh.set_name("Box")
    mesh.user_data().set_bool("selectable", false)
    mesh.user_data().set_int("priority", 0)
    let hidden = @three.Object3D()
    hidden.set_name("Hidden")
    hidden.set_visible(false)
    scene.as_object3d().add(mesh).add(hidden) |> ignore
    let clip = @three.AnimationClip("Move", 1, [
      @three.VectorKeyframeTrack("Box.position", [0, 1], [0, 0, 0, 2, 0, 0]).as_keyframe_track(),
    ])
    let options = @three.GLTFExportOptions()
    options.set_animations([clip])
    let exporter = @three.GLTFExporter()
    let bytes = exporter.export_glb(scene.as_object3d(), options~)
    let gltf = @three.GLTFLoader().parse_glb(bytes)
    let root = gltf.scene().unwrap().as_object3d()
    let copy = root.get_object_by_name("Box").unwrap()
    let mixer = @three.AnimationMixer(root)
    mixer.clip_action(gltf.animations()[0]).play() |> ignore
    mixer.update(0.5) |> ignore
    let animated = if (copy.position().x() - 1).abs() < 0.000001 &&
      copy.position().y() == 0 &&
      copy.position().z() == 0 {
      1
    } else {
      0
    }
    mixer.stop_all_action() |> ignore
    mixer.uncache_root(root)
    let metadata = if copy.user_data().get_bool("selectable") == Some(false) &&
      copy.user_data().get_int("priority") == Some(0) {
      1
    } else {
      0
    }
    let hidden_removed = if root.get_object_by_name("Hidden") is None {
      1
    } else {
      0
    }
    options.set_only_visible(false)
    let json = exporter.export_gltf(scene.as_object3d(), options~)
    let text_model = @three.GLTFLoader().parse_gltf(json)
    let hidden_kept = if text_model
      .scene()
      .unwrap()
      .as_object3d()
      .get_object_by_name("Hidden")
      is Some(_) {
      1
    } else {
      0
    }
    let missing_image = @three.Texture()
    defer missing_image.dispose()
    material.as_standard_material().unwrap().set_map(Some(missing_image))
    let failed = try {
      exporter.export_glb(mesh) |> ignore
      0
    } catch {
      @three.ExportError(_) => 1
    }
    material.as_standard_material().unwrap().set_map(None)
    [
      bytes[0].to_int(),
      bytes[1].to_int(),
      bytes[2].to_int(),
      bytes[3].to_int(),
      animated,
      metadata,
      hidden_removed,
      hidden_kept,
      failed,
      if copy
        .as_mesh()
        .unwrap()
        .geometry()
        .get_attribute("position")
        .unwrap()
        .count() ==
        24 {
        1
      } else {
        0
      },
    ]
  })
}
