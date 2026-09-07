///|
#module("node:fs")
extern "js" fn read_environment_fixture(path : String) -> Bytes = "readFileSync"

///|
async test "HDR decodes into a linear floating point texture" {
  let loader = @three.HDRLoader().set_data_type(Float)
  let data = loader.parse(read_environment_fixture("tests/fixtures/studio.hdr"))
  assert_eq(data.width(), 64)
  assert_eq(data.height(), 32)
  let values = data.values()
  assert_true((values[0] - 1).abs() < 0.01)
  assert_true((values[1] - 0.5).abs() < 0.01)
  assert_true((values[2] - 0.25).abs() < 0.01)
  assert_eq(values[3], 1)
  let texture = data.as_texture()
  assert_eq(texture.color_space(), @three.ColorSpace::LinearSRGB)
  texture.set_mapping(EquirectangularReflection)
  assert_eq(texture.mapping(), @three.TextureMapping::EquirectangularReflection)
  let half = @three.HDRLoader().parse(
    read_environment_fixture("tests/fixtures/studio.hdr"),
  )
  assert_true((half.values()[0] - values[0]).abs() < 0.01)
  half.as_texture().dispose()
  texture.dispose()
}

///|
async test "EXR decodes real scanline data and rejects invalid data" {
  let loader = @three.EXRLoader().set_data_type(Float)
  let texture = loader.parse(
    read_environment_fixture("tests/fixtures/studio.exr"),
  )
  assert_eq(texture.width(), 2)
  assert_eq(texture.height(), 1)
  let values = texture.values()
  assert_eq(values[0], 1)
  assert_eq(values[1], 0.5)
  assert_eq(values[2], 0.25)
  texture.as_texture().dispose()
  try loader.parse(b"invalid") catch {
    @three.LoadError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("expected invalid EXR to fail")
  }
  try @three.HDRLoader().parse(b"invalid") catch {
    @three.LoadError(message) => assert_true(message.length() > 0)
  } noraise {
    _ => fail("expected invalid HDR to fail")
  }
}
