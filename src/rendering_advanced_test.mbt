///|
test "Render targets expose depth, samples and independent attachments" {
  let target = @three.WebGLRenderTarget::with_attachments(16, 8, 2)
  target.set_samples(4)
  let depth = @three.DepthTexture(16, 8)
  target.set_depth_texture(Some(depth))
  assert_eq(target.samples(), 4)
  assert_eq(target.textures().length(), 2)
  assert_false(target.textures()[0].same_reference(target.textures()[1]))
  assert_true(
    target
    .depth_texture()
    .unwrap()
    .as_texture()
    .same_reference(depth.as_texture()),
  )
  target.set_size(32, 16)
  assert_eq(target.width(), 32)
  target.set_depth_texture(None)
  assert_true(target.depth_texture() is None)
  let cube = @three.WebGLCubeRenderTarget(16)
  assert_true(
    cube
    .texture()
    .as_texture()
    .same_reference(cube.as_render_target().texture()),
  )
  cube.dispose()
  target.dispose()
  depth.as_texture().dispose()
}
