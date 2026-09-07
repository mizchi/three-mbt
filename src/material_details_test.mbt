///|
test "Standard surface maps preserve live vector settings and clear optional textures" {
  let material = @three.MeshStandardMaterial(0xffffff, 0.5, 0)
  let texture = @three.Texture()
  material.set_normal_map(Some(texture))
  material.normal_scale().set(0.5, -0.5) |> ignore
  material.set_normal_map_type(TangentSpace)
  material.set_ao_map_intensity(0.4)
  material.set_env_map_intensity(2)
  material.set_bump_map(Some(texture))
  material.set_bump_scale(0.1)
  material.set_displacement_map(Some(texture))
  material.set_displacement_scale(0.2)
  material.set_displacement_bias(-0.1)
  material.set_light_map(Some(texture))
  material.set_light_map_intensity(0.3)
  material.set_alpha_map(Some(texture))
  material.set_flat_shading(true)
  let copy = material.as_material().clone().as_standard_material().unwrap()
  assert_eq(copy.normal_scale().x(), 0.5)
  assert_eq(copy.normal_scale().y(), -0.5)
  assert_eq(copy.normal_map_type(), TangentSpace)
  assert_eq(copy.env_map_intensity(), 2)
  assert_eq(copy.ao_map_intensity(), 0.4)
  assert_eq(copy.bump_scale(), 0.1)
  assert_eq(copy.displacement_scale(), 0.2)
  assert_eq(copy.displacement_bias(), -0.1)
  assert_eq(copy.light_map_intensity(), 0.3)
  assert_true(copy.flat_shading())
  assert_true(copy.displacement_map().unwrap().same_reference(texture))
  assert_true(copy.light_map().unwrap().same_reference(texture))
  assert_true(copy.alpha_map().unwrap().same_reference(texture))
  copy.set_bump_map(None)
  assert_true(copy.bump_map() is None)
  assert_true(material.bump_map() is Some(_))
  copy.normal_scale().set(1, 1) |> ignore
  assert_eq(material.normal_scale().x(), 0.5)
  assert_true(material.as_material().as_physical_material() is None)
}

///|
test "Physical coatings and fabric settings survive cloning with independent colors and ranges" {
  let physical = @three.MeshPhysicalMaterial(0xffffff, 0.3, 0)
  physical.set_clearcoat(1)
  physical.set_clearcoat_roughness(0.25)
  physical.clearcoat_normal_scale().set(0.5, 0.25) |> ignore
  physical.set_iridescence(0.8)
  physical.set_iridescence_ior(1.4)
  physical.set_iridescence_thickness_range(150, 300)
  physical.set_sheen(1)
  physical.sheen_color().set_rgb(0.2, 0.3, 0.4) |> ignore
  physical.set_sheen_roughness(0.7)
  physical.set_anisotropy(0.6)
  physical.set_anisotropy_rotation(0.5)
  physical.set_specular_intensity(0.9)
  physical.specular_color().set_rgb(1, 0.5, 0.25) |> ignore
  let texture = @three.Texture()
  physical.set_clearcoat_normal_map(Some(texture))
  physical.set_sheen_color_map(Some(texture))
  physical.set_iridescence_thickness_map(Some(texture))
  let copy = physical.as_material().clone().as_physical_material().unwrap()
  assert_eq(copy.clearcoat_roughness(), 0.25)
  assert_eq(copy.clearcoat_normal_scale().y(), 0.25)
  assert_eq(copy.iridescence(), 0.8)
  assert_eq(copy.iridescence_ior(), 1.4)
  assert_eq(copy.sheen(), 1)
  assert_eq(copy.sheen_roughness(), 0.7)
  assert_eq(copy.anisotropy(), 0.6)
  assert_eq(copy.anisotropy_rotation(), 0.5)
  assert_eq(copy.specular_intensity(), 0.9)
  assert_eq(copy.specular_color().g(), 0.5)
  assert_true(copy.clearcoat_normal_map().unwrap().same_reference(texture))
  assert_true(copy.sheen_color_map().unwrap().same_reference(texture))
  assert_true(copy.iridescence_thickness_map().unwrap().same_reference(texture))
  copy.set_clearcoat_normal_map(None)
  copy.set_sheen_color_map(None)
  copy.set_iridescence_thickness_map(None)
  assert_true(copy.clearcoat_normal_map() is None)
  assert_true(copy.sheen_color_map() is None)
  assert_true(copy.iridescence_thickness_map() is None)
  let range = copy.iridescence_thickness_range()
  range[0] = 0
  assert_eq(copy.iridescence_thickness_range()[0], 150)
  copy.set_iridescence_thickness_range(200, 400)
  assert_eq(physical.iridescence_thickness_range()[0], 150)
  copy.sheen_color().set_rgb(1, 1, 1) |> ignore
  assert_eq(physical.sheen_color().r(), 0.2)
}

///|
#module("node:fs")
extern "js" fn read_physical_fixture(path : String) -> Bytes = "readFileSync"

///|
async test "GLB physical material extensions are readable and editable" {
  let gltf = @three.GLTFLoader().parse_glb(
    read_physical_fixture("tests/fixtures/physical.glb"),
  )
  let material = gltf.scene().unwrap().as_object3d().children()[0]
    .as_mesh()
    .unwrap()
    .materials()[0]
    .as_physical_material()
    .unwrap()
  assert_eq(material.clearcoat(), 0.8)
  assert_eq(material.clearcoat_roughness(), 0.2)
  assert_eq(material.transmission(), 0.9)
  assert_eq(material.thickness(), 0.5)
  assert_eq(material.attenuation_distance(), 2)
  assert_eq(material.attenuation_color().r(), 0.8)
  assert_eq(material.ior(), 1.4)
  assert_eq(material.iridescence(), 0.3)
  assert_eq(material.iridescence_ior(), 1.2)
  assert_eq(material.iridescence_thickness_range()[0], 120)
  assert_eq(material.iridescence_thickness_range()[1], 350)
  assert_eq(material.sheen_color().r(), 0.4)
  assert_eq(material.sheen_roughness(), 0.6)
  assert_eq(material.specular_intensity(), 0.7)
  assert_eq(material.specular_color().g(), 0.8)
  assert_eq(material.anisotropy(), 0.4)
  assert_eq(material.anisotropy_rotation(), 0.5)
  assert_eq(material.dispersion(), 0.25)
  material.set_attenuation_distance(4)
  material.set_dispersion(0.5)
  material.set_reflectivity(0.5)
  assert_eq(material.attenuation_distance(), 4)
  assert_eq(material.dispersion(), 0.5)
  assert_true((material.ior() - 1.5).abs() < 0.000001)
}
