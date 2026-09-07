///|
test "Volume and array textures preserve dimensions and RGBA8 replacement" {
  let bytes : Bytes = [255, 0, 0, 255, 0, 0, 255, 255]
  let volume = @three.Data3DTexture(bytes, 1, 1, 2)
  assert_eq(volume.depth(), 2)
  assert_eq(volume.width(), 1)
  assert_eq(volume.as_texture().format(), Some(RGBA))
  assert_eq(volume.as_texture().mag_filter(), Nearest)
  volume.set_wrap_r(RepeatWrapping)
  assert_eq(volume.wrap_r(), RepeatWrapping)
  volume.set_bytes([128, 0, 0, 255, 0, 0, 255, 255])
  assert_eq(volume.bytes()[0].to_int(), 128)
  let layers = @three.DataArrayTexture(bytes, 1, 1, 2)
  layers.add_layer_update(1)
  assert_eq(layers.layer_updates().length(), 1)
  assert_eq(layers.layer_updates()[0], 1)
  layers.clear_layer_updates()
  assert_eq(layers.layer_updates().length(), 0)
  volume.as_texture().dispose()
  layers.as_texture().dispose()
}

///|
async test "CubeTextureLoader rejects incomplete face lists before starting requests" {
  try @three.CubeTextureLoader().load(["one.png"]) |> ignore catch {
    @three.LoadError(_) => ()
  } noraise {
    _ => fail("expected LoadError")
  }
}
