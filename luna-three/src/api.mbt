///|
/// Luna's platform-independent virtual node, with typed three.js properties.
pub type Node = @luna.Node[Unit, Property]

///|
pub type Prop = @luna.Attr[Unit, Property]

///|
/// Constructed geometry is owned by the renderer. Borrowed geometry is never disposed.
pub(all) enum Geometry {
  Box(Double, Double, Double)
  Sphere(Double, Int, Int)
  Plane(Double, Double)
  Cylinder(Double, Double, Double, Int)
  Cone(Double, Double, Int)
  Torus(Double, Double, Int, Int)
  Borrowed(@three.BufferGeometry)
}

///|
/// Standard takes color, roughness, and metalness.
pub(all) enum Material {
  Basic(Int)
  Standard(Int, Double, Double)
  Normal
  Borrowed(@three.Material)
}

///|
pub(all) enum Property {
  Key(String)
  Name(String)
  Position(Double, Double, Double)
  Rotation(Double, Double, Double)
  Scale(Double, Double, Double)
  Visible(Bool)
  CastShadow(Bool)
  ReceiveShadow(Bool)
  Geometry(Geometry)
  Material(Material)
  Light(Int, Double)
  Perspective(Double, Double, Double, Double)
  Object(@three.Object3D)
}

///|
pub fn prop(value : Property) -> Prop {
  @luna.attr_static(value)
}

///|
/// Signal reads in the getter update this element without rerunning its component.
/// Key and Object are construction-time properties and must be static.
pub fn dynamic(get : () -> Property) -> Prop {
  @luna.attr_dynamic(get)
}

///|
fn element(
  tag : String,
  props : Array[Prop],
  children : Array[Node],
  key : String?,
) -> Node {
  let attrs = props.map(fn(p) { ("prop", p) })
  if key is Some(key) {
    attrs.push(("key", prop(Key(key))))
  }
  @luna.h(tag, attrs, children)
}

///|
pub fn group(
  children : Array[Node],
  props? : Array[Prop] = [],
  key? : String,
) -> Node {
  element("group", props, children, key)
}

///|
pub fn mesh(
  geometry~ : Geometry,
  material~ : Material,
  props? : Array[Prop] = [],
  children? : Array[Node] = [],
  key? : String,
) -> Node {
  element(
    "mesh",
    [prop(Geometry(geometry)), prop(Material(material))] + props,
    children,
    key,
  )
}

///|
/// Mount an existing Object3D without cloning or taking ownership of its resources.
pub fn primitive(
  object : @three.Object3D,
  props? : Array[Prop] = [],
  children? : Array[Node] = [],
  key? : String,
) -> Node {
  element("primitive", [prop(Object(object))] + props, children, key)
}

///|
pub fn ambient_light(
  color? : Int = 0xffffff,
  intensity? : Double = 1,
  props? : Array[Prop] = [],
  key? : String,
) -> Node {
  element("ambientLight", [prop(Light(color, intensity))] + props, [], key)
}

///|
pub fn directional_light(
  color? : Int = 0xffffff,
  intensity? : Double = 1,
  props? : Array[Prop] = [],
  key? : String,
) -> Node {
  element("directionalLight", [prop(Light(color, intensity))] + props, [], key)
}

///|
/// The host selects this camera for rendering; mounting does not change a global camera.
pub fn perspective_camera(
  fov? : Double = 50,
  aspect? : Double = 1,
  near? : Double = 0.1,
  far? : Double = 2000,
  props? : Array[Prop] = [],
  key? : String,
) -> Node {
  element(
    "perspectiveCamera",
    [prop(Perspective(fov, aspect, near, far))] + props,
    [],
    key,
  )
}
