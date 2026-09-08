///|
pub fn svg_profile(text : String) -> @js_async.Promise[FixedArray[Double]] {
  @js_async.Promise::from_async(() => {
    let loader = @three.SVGLoader()
    let result = loader.parse(text)
    let paths = result.paths()
    let shapes = paths[0].to_shapes()
    let shape = shapes[0]
    let sampled = shape.extract_points(4)
    let options = @three.ExtrudeOptions()
    options.set_depth(2)
    options.set_bevel_enabled(false)
    let geometry = @three.ExtrudeGeometry(shapes, options).as_buffer_geometry()
    defer geometry.dispose()
    geometry.compute_bounding_box()
    let style = @three.StrokeStyle(2, "#ff0000", RoundJoin, RoundCap, 4)
    let stroke = loader
      .points_to_stroke(
        [@three.Vector2(0, 0), @three.Vector2(4, 0)],
        style,
        12,
        0.001,
      )
      .unwrap()
    defer stroke.dispose()
    stroke.compute_bounding_box()
    [
      paths.length().to_double(),
      shape.holes().length().to_double(),
      @three.ShapeUtils::area(sampled.shape()).abs(),
      @three.ShapeUtils::area(sampled.holes()[0]).abs(),
      geometry.bounding_box().unwrap().max().z(),
      stroke.bounding_box().unwrap().max().y(),
    ]
  })
}

///|
pub fn render_flow() -> @js_async.Promise[Bytes] {
  @js_async.Promise::from_async(() => {
    let geometry = @three.BoxGeometry(0.4, 0.4, 0.4).as_buffer_geometry()
    defer geometry.dispose()
    let material = @three.MeshBasicMaterial(0xff0000).as_material()
    defer material.dispose()
    let flow = @three.Flow(@three.Mesh(geometry, material), 1)
    defer flow.object().materials()[0].dispose()
    defer flow.spline_texture().as_texture().dispose()
    let curve = @three.LineCurve3(
      @three.Vector3(-2, 0, 0),
      @three.Vector3(2, 0, 0),
    ).as_curve3()
    flow.update_curve(0, curve)
    flow.uniforms().set_spine_offset(2)
    let scene = @three.Scene()
    scene.as_object3d().add(flow.object().as_object3d()) |> ignore
    let camera = @three.OrthographicCamera(-2, 2, 2, -2, 0.1, 10)
    camera.as_object3d().position().set_z(4) |> ignore
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    let target = @three.WebGLRenderTarget(64, 64)
    defer target.dispose()
    renderer.set_render_target(Some(target))
    renderer.render(scene, camera.as_camera())
    let before = Bytes::new(4)
    renderer.read_render_target_pixels(target, 32, 32, 1, 1, before)
    flow.move_along_curve(0.25)
    renderer.render(scene, camera.as_camera())
    let center = Bytes::new(4)
    let moved = Bytes::new(4)
    renderer.read_render_target_pixels(target, 32, 32, 1, 1, center)
    renderer.read_render_target_pixels(target, 48, 32, 1, 1, moved)
    before + center + moved
  })
}

///|
pub fn selection_demo() -> @three.SelectionHelper {
  let renderer = @three.WebGLRenderer(antialias=false)
  renderer.set_size(200, 200)
  renderer.dom_element().append_to_body()
  let helper = @three.SelectionHelper(renderer, "model-selection")
  helper
  .element()
  .set_css_text(
    "position:fixed;border:1px solid blue;background:rgba(0,0,255,0.1)",
  )
  helper
}

///|
pub fn close_selection(helper : @three.SelectionHelper) -> Unit {
  helper.dispose()
  let renderer = helper.renderer()
  renderer.dom_element().remove()
  renderer.dispose()
  renderer.force_context_loss()
}

///|
pub fn load_modeling_asset(kind : Int, url : String) -> @js_async.Promise[Int] {
  @js_async.Promise::from_async(async fn() {
    match kind {
      0 => @three.SVGLoader().load(url).paths().length()
      1 =>
        @three.FontLoader()
        .load(url)
        .generate_shapes("A", 1, LeftToRight)
        .length()
      2 => {
        let creator = @three.MTLLoader().load(url)
        creator.preload()
        let materials = creator.materials()
        for material in materials {
          material.dispose()
        }
        materials.length()
      }
      _ => {
        let geometry = @three.PLYLoader().load(url)
        defer geometry.dispose()
        geometry.get_attribute("position").unwrap().count()
      }
    }
  })
}
