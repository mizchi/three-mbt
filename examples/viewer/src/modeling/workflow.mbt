///|
pub fn bake_comparison(instanced : Bool) -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let geometry = @three.BoxGeometry::segmented(1.2, 0.2, 0.2, 12, 1, 1).as_buffer_geometry()
    defer geometry.dispose()
    let material = @three.MeshBasicMaterial(0x00ff00).as_material()
    defer material.dispose()
    let instances = @three.InstancedFlow(1, 1, geometry, material)
    defer instances.object().dispose()
    let single = @three.Flow(@three.Mesh(geometry, material), 1)
    defer instances.as_flow().spline_texture().as_texture().dispose()
    defer instances.object().as_mesh().materials()[0].dispose()
    defer single.spline_texture().as_texture().dispose()
    defer single.object().materials()[0].dispose()
    let flow = if instanced { instances.as_flow() } else { single }
    let curve = @three.CatmullRomCurve3(
      [
        @three.Vector3(-1, -1, 0),
        @three.Vector3(1, -1, 0),
        @three.Vector3(1, 1, 0),
        @three.Vector3(-1, 1, 0),
      ],
      closed=true,
      curve_type=Centripetal,
      tension=0.5,
    ).as_curve3()
    flow.update_curve(0, curve)
    flow.uniforms().set_spine_offset(0)
    flow.move_along_curve(-0.2)
    if instanced {
      instances.set_curve(0, 0)
      instances.move_individual_along_curve(0, 0.1)
    }
    let root = flow.object().as_object3d()
    root.position().set(0.1, 0.1, 0) |> ignore
    root.scale().set(0.9, 1.2, 1) |> ignore
    root.update_matrix_world(true)
    let baked = if instanced {
      @three.bake_flow_instance_geometry(instances, 0)
    } else {
      @three.bake_flow_geometry(flow)
    }
    defer baked.dispose()
    let replacement = @three.Mesh(baked, material).as_object3d()
    replacement.apply_matrix4(root.matrix()) |> ignore
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let camera = @three.OrthographicCamera(-2, 2, 2, -2, 0.1, 10)
    camera.as_object3d().position().set_z(4) |> ignore
    let target = @three.WebGLRenderTarget(96, 96)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    let scene = @three.Scene()
    scene.as_object3d().add(root) |> ignore
    renderer.render(scene, camera.as_camera())
    let gpu = Bytes::new(96 * 96 * 4)
    renderer.read_render_target_pixels(target, 0, 0, 96, 96, gpu)
    scene.as_object3d().remove(root).add(replacement) |> ignore
    renderer.render(scene, camera.as_camera())
    let cpu = Bytes::new(96 * 96 * 4)
    renderer.read_render_target_pixels(target, 0, 0, 96, 96, cpu)
    gpu + cpu
  })
}

///|
pub fn orbit_editing_demo() -> @three.OrbitControls {
  let canvas = @three.Canvas()
  canvas.append_to_body()
  let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
  camera.as_object3d().position().set(0, 0, 4) |> ignore
  let controls = @three.OrbitControls(camera.as_camera(), canvas)
  controls.set_keys("KeyA", "KeyW", "KeyD", "KeyS")
  controls.set_mouse_buttons(MousePan, MouseDolly, MouseRotate)
  controls.set_touches(TouchPan, TouchDollyRotate)
  controls.set_cursor_style(GrabCursor)
  controls.listen_to_key_events()
  controls
}

///|
pub fn orbit_editing_target(
  controls : @three.OrbitControls,
) -> FixedArray[Double] {
  let target = controls.target()
  [target.x(), target.y(), target.z()]
}

///|
pub fn stop_editing_keys(controls : @three.OrbitControls) -> Unit {
  controls.stop_listen_to_key_events()
}
