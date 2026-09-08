///|
fn sample_scene(
  renderer : @three.WebGLRenderer,
  target : @three.WebGLRenderTarget,
  scene : @three.Scene,
  camera : @three.Camera,
) -> Bytes {
  renderer.set_render_target(Some(target))
  renderer.render(scene, camera)
  let pixel = Bytes::new(4)
  renderer.read_render_target_pixels(target, 8, 8, 1, 1, pixel)
  renderer.set_render_target(None)
  pixel
}

///|
pub fn sample_textures(base : String) -> @js_async.Promise[FixedArray[Int]] {
  @js_async.Promise::from_async(async fn() {
    let renderer = @three.WebGLRenderer(antialias=false)
    defer {
      renderer.dispose()
      renderer.force_context_loss()
    }
    renderer.set_size(16, 16)
    let target = @three.WebGLRenderTarget(16, 16)
    defer target.dispose()
    let camera = @three.PerspectiveCamera(60, 1, 0.1, 100)
    camera.as_object3d().position().set(0, 0, 3) |> ignore
    let cube = @three.CubeTextureLoader().load([
      base + "red.png",
      base + "red.png",
      base + "red.png",
      base + "red.png",
      base + "red.png",
      base + "blue.png",
    ])
    defer cube.as_texture().dispose()
    let scene = @three.Scene()
    scene.set_background_texture(Some(cube.as_texture()))
    let cube_pixel = sample_scene(renderer, target, scene, camera.as_camera())
    scene.set_background_texture(None)
    let bytes : Bytes = [255, 0, 0, 255, 0, 0, 255, 255]
    let volume = @three.Data3DTexture(bytes, 1, 1, 2)
    let layers = @three.DataArrayTexture(bytes, 1, 1, 2)
    volume.as_texture().mark_needs_update()
    layers.as_texture().mark_needs_update()
    defer volume.as_texture().dispose()
    defer layers.as_texture().dispose()
    let uniforms = @three.Uniforms()
    uniforms.set_texture("source", volume.as_texture())
    let vertex = "uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix; in vec3 position; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
    let material = @three.RawShaderMaterial(
      vertex, "precision highp float; uniform highp sampler3D source; out vec4 result; void main(){result=texture(source,vec3(0.5,0.5,0.75));}",
      uniforms,
    ).as_shader_material()
    material.set_glsl_version(Some(GLSL3))
    defer material.as_material().dispose()
    let geometry = @three.PlaneGeometry(4, 4).as_buffer_geometry()
    defer geometry.dispose()
    let mesh = @three.Mesh(geometry, material.as_material())
    scene.as_object3d().add(mesh.as_object3d()) |> ignore
    let volume_pixel = sample_scene(renderer, target, scene, camera.as_camera())
    uniforms.set_texture("source", layers.as_texture())
    material.set_fragment_shader(
      "precision highp float; uniform highp sampler2DArray source; out vec4 result; void main(){result=texture(source,vec3(0.5,0.5,0.0));}",
    )
    material.as_material().mark_needs_update()
    let layer_pixel = sample_scene(renderer, target, scene, camera.as_camera())
    let video = @three.Video(base + "colors.webm")
    defer video.dispose()
    video.ready()
    let texture = @three.VideoTexture(video)
    defer texture.as_texture().dispose()
    texture.as_texture().mark_needs_update()
    let basic = @three.MeshBasicMaterial(0xffffff)
    defer basic.as_material().dispose()
    basic.set_map(Some(texture.as_texture()))
    mesh.set_material(basic.as_material())
    let first = sample_scene(renderer, target, scene, camera.as_camera())
    video.seek(1.5)
    texture.as_texture().mark_needs_update()
    let second = sample_scene(renderer, target, scene, camera.as_camera())
    [
      cube_pixel[2].to_int(),
      volume_pixel[2].to_int(),
      layer_pixel[0].to_int(),
      first[0].to_int(),
      second[2].to_int(),
    ]
  })
}
