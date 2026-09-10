///|
fn Geometry::create(self : Geometry) -> @three.BufferGeometry {
  match self {
    Box(w, h, d) => @three.BoxGeometry(w, h, d).as_buffer_geometry()
    Sphere(r, w, h) => @three.SphereGeometry(r, w, h).as_buffer_geometry()
    Plane(w, h) => @three.PlaneGeometry(w, h).as_buffer_geometry()
    Cylinder(top, bottom, h, segments) =>
      @three.CylinderGeometry(top, bottom, h, segments).as_buffer_geometry()
    Cone(r, h, segments) =>
      @three.ConeGeometry(r, h, segments).as_buffer_geometry()
    Torus(r, tube, radial, tubular) =>
      @three.TorusGeometry(r, tube, radial, tubular).as_buffer_geometry()
    Borrowed(geometry) => geometry
  }
}

///|
impl Eq for Geometry with fn equal(a, b) {
  match (a, b) {
    (Box(a, b, c), Box(x, y, z)) => a == x && b == y && c == z
    (Sphere(a, b, c), Sphere(x, y, z)) => a == x && b == y && c == z
    (Plane(a, b), Plane(x, y)) => a == x && b == y
    (Cylinder(a, b, c, d), Cylinder(w, x, y, z)) =>
      a == w && b == x && c == y && d == z
    (Cone(a, b, c), Cone(x, y, z)) => a == x && b == y && c == z
    (Torus(a, b, c, d), Torus(w, x, y, z)) =>
      a == w && b == x && c == y && d == z
    (Borrowed(a), Borrowed(b)) => a.id() == b.id()
    _ => false
  }
}

///|
fn Material::create(self : Material) -> @three.Material {
  match self {
    Basic(color) => @three.MeshBasicMaterial(color).as_material()
    Standard(color, roughness, metalness) =>
      @three.MeshStandardMaterial(color, roughness~, metalness~).as_material()
    Normal => @three.MeshNormalMaterial().as_material()
    Borrowed(material) => material
  }
}

///|
fn Material::update(
  self : Material,
  previous : Material,
  material : @three.Material,
) -> Bool {
  match (self, previous) {
    (Basic(color), Basic(_)) => {
      material.as_basic_material().unwrap().color().set_hex(color) |> ignore
      true
    }
    (Standard(color, roughness, metalness), Standard(_, _, _)) => {
      let standard = material.as_standard_material().unwrap()
      standard.color().set_hex(color) |> ignore
      standard.set_roughness(roughness)
      standard.set_metalness(metalness)
      true
    }
    (Normal, Normal) => true
    (Borrowed(a), Borrowed(b)) => a.id() == b.id()
    _ => false
  }
}

///|
fn dispose_geometry(spec : Geometry, geometry : @three.BufferGeometry) -> Unit {
  if !(spec is Borrowed(_)) {
    geometry.dispose()
  }
}

///|
fn dispose_material(spec : Material, material : @three.Material) -> Unit {
  if !(spec is Borrowed(_)) {
    material.dispose()
  }
}
