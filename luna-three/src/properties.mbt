///|
fn Property::slot(self : Property) -> String {
  match self {
    Key(_) => "key"
    Name(_) => "name"
    Position(_, _, _) => "position"
    Rotation(_, _, _) => "rotation"
    Scale(_, _, _) => "scale"
    Visible(_) => "visible"
    CastShadow(_) => "castShadow"
    ReceiveShadow(_) => "receiveShadow"
    Geometry(_) => "geometry"
    Material(_) => "material"
    Light(_, _) => "light"
    Perspective(_, _, _, _) => "perspective"
    Object(_) => "object"
  }
}

///|
impl Eq for Material with fn equal(a, b) {
  match (a, b) {
    (Basic(a), Basic(b)) => a == b
    (Standard(a, b, c), Standard(x, y, z)) => a == x && b == y && c == z
    (Normal, Normal) => true
    (Borrowed(a), Borrowed(b)) => a.id() == b.id()
    _ => false
  }
}

///|
impl Eq for Property with fn equal(a, b) {
  match (a, b) {
    (Key(a), Key(b)) | (Name(a), Name(b)) => a == b
    (Position(a, b, c), Position(x, y, z))
    | (Rotation(a, b, c), Rotation(x, y, z))
    | (Scale(a, b, c), Scale(x, y, z)) => a == x && b == y && c == z
    (Visible(a), Visible(b))
    | (CastShadow(a), CastShadow(b))
    | (ReceiveShadow(a), ReceiveShadow(b)) => a == b
    (Geometry(a), Geometry(b)) => a == b
    (Material(a), Material(b)) => a == b
    (Light(a, b), Light(x, y)) => a == x && b == y
    (Perspective(a, b, c, d), Perspective(w, x, y, z)) =>
      a == w && b == x && c == y && d == z
    (Object(a), Object(b)) => a.same_reference(b)
    _ => false
  }
}

///|
fn object_defaults(object : @three.Object3D) -> Map[String, Property] {
  let p = object.position()
  let r = object.rotation()
  let s = object.scale()
  Map::from_array([
    ("name", Name(object.name())),
    ("position", Position(p.x(), p.y(), p.z())),
    ("rotation", Rotation(r.x(), r.y(), r.z())),
    ("scale", Scale(s.x(), s.y(), s.z())),
    ("visible", Visible(object.visible())),
    ("castShadow", CastShadow(object.cast_shadow())),
    ("receiveShadow", ReceiveShadow(object.receive_shadow())),
  ])
}

///|
fn valid_property(tag : String, prop : Property) -> Bool {
  match prop {
    Geometry(_) | Material(_) => tag == "mesh"
    Object(_) => tag == "primitive"
    Light(_, _) => tag == "ambientLight" || tag == "directionalLight"
    Perspective(_, _, _, _) => tag == "perspectiveCamera"
    _ => true
  }
}

///|
fn apply_properties(node : Mounted, props : Map[String, Property]) -> Unit {
  for _, prop in props {
    if !valid_property(node.tag, prop) {
      node.error = Some(
        "Property " + prop.slot() + " is not supported on " + node.tag,
      )
      return
    }
  }
  if node.tag == "mesh" &&
    !(props.get("geometry") is Some(Geometry(_)) &&
    props.get("material") is Some(Material(_))) {
    node.error = Some("mesh requires Geometry and Material")
    return
  }
  if node.object is None {
    let object = match node.tag {
      "group" => @three.Group().as_object3d()
      "mesh" => {
        guard props.get("geometry") is Some(Geometry(geometry)) &&
          props.get("material") is Some(Material(material)) else {
          node.error = Some("mesh requires Geometry and Material")
          return
        }
        let g = geometry.create()
        let m = material.create()
        node.geometry = Some((geometry, g))
        node.material = Some((material, m))
        @three.Mesh(g, m).as_object3d()
      }
      "primitive" => {
        guard props.get("object") is Some(Object(object)) else {
          node.error = Some("primitive requires a static Object")
          return
        }
        if node.root.claims.contains(object.id()) {
          node.error = Some("An Object3D can only occupy one slot in a root")
          return
        }
        let mut ancestor = Some(node.root.container)
        while ancestor is Some(parent) {
          if parent.same_reference(object) {
            node.error = Some("A primitive cannot contain its mount container")
            return
          }
          ancestor = parent.parent()
        }
        object
      }
      "ambientLight" => @three.AmbientLight(0xffffff, 1).as_object3d()
      "directionalLight" => @three.DirectionalLight(0xffffff, 1).as_object3d()
      "perspectiveCamera" =>
        @three.PerspectiveCamera(50, 1, 0.1, 2000).as_object3d()
      _ => {
        node.error = Some("Unsupported element: " + node.tag)
        return
      }
    }
    node.object = Some(object)
    node.root.claims.set(object.id(), true)
    node.defaults = object_defaults(object)
    if node.tag == "ambientLight" || node.tag == "directionalLight" {
      node.defaults.set("light", Light(0xffffff, 1))
    }
    if node.tag == "perspectiveCamera" {
      node.defaults.set("perspective", Perspective(50, 1, 0.1, 2000))
    }
  }
  let object = node.object.unwrap()
  let effective = node.defaults.copy()
  for key, value in props {
    effective.set(key, value)
  }
  for key, value in effective {
    if node.previous.get(key) == Some(value) {
      continue
    }
    match value {
      Key(_) | Object(_) => ()
      Name(value) => object.set_name(value)
      Position(x, y, z) => object.set_position_xyz(x, y, z)
      Rotation(x, y, z) => object.set_rotation_xyz(x, y, z)
      Scale(x, y, z) => object.set_scale_xyz(x, y, z)
      Visible(value) => object.set_visible(value)
      CastShadow(value) => object.set_cast_shadow(value)
      ReceiveShadow(value) => object.set_receive_shadow(value)
      Geometry(spec) =>
        if node.geometry is Some((previous, old)) && previous != spec {
          let geometry = spec.create()
          object.as_mesh().unwrap().set_geometry(geometry)
          node.geometry = Some((spec, geometry))
          if old.id() != geometry.id() {
            dispose_geometry(previous, old)
          }
        }
      Material(spec) =>
        if node.material is Some((previous, old)) {
          if spec.update(previous, old) {
            node.material = Some((spec, old))
          } else {
            let material = spec.create()
            object.as_mesh().unwrap().set_material(material)
            node.material = Some((spec, material))
            if old.id() != material.id() {
              dispose_material(previous, old)
            }
          }
        }
      Light(color, intensity) => {
        let light = object.as_light().unwrap()
        light.color().set_hex(color) |> ignore
        light.set_intensity(intensity)
      }
      Perspective(fov, aspect, near, far) => {
        let camera = object
          .as_camera()
          .unwrap()
          .as_perspective_camera()
          .unwrap()
        camera.set_fov(fov)
        camera.set_aspect(aspect)
        camera.set_near(near)
        camera.set_far(far)
        camera.update_projection_matrix()
      }
    }
  }
  node.previous = effective
  node.error = None
}
