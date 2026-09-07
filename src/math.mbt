///|
pub(all) enum EulerOrder {
  XYZ
  YXZ
  ZXY
  ZYX
  YZX
  XZY
} derive(Eq, Debug)

///|
fn EulerOrder::to_js(self : EulerOrder) -> String {
  match self {
    XYZ => "XYZ"
    YXZ => "YXZ"
    ZXY => "ZXY"
    ZYX => "ZYX"
    YZX => "YZX"
    XZY => "XZY"
  }
}

///|
#module("@mizchi/three-mbt/constructors")
extern "js" fn new_euler(
  x : Double,
  y : Double,
  z : Double,
  order : String,
) -> Euler = "euler"

///|
pub fn Euler::Euler(
  x : Double,
  y : Double,
  z : Double,
  order? : EulerOrder = XYZ,
) -> Euler {
  new_euler(x, y, z, order.to_js())
}

///|
extern "js" fn Euler::euler_order(self : Euler) -> String =
  #| (self) => self.order

///|
pub fn Euler::order(self : Euler) -> EulerOrder {
  match self.euler_order() {
    "XYZ" => XYZ
    "YXZ" => YXZ
    "ZXY" => ZXY
    "ZYX" => ZYX
    "YZX" => YZX
    "XZY" => XZY
    _ => abort("Invalid three.js Euler order")
  }
}

///|
extern "js" fn Euler::set_euler(
  self : Euler,
  x : Double,
  y : Double,
  z : Double,
  order : String,
) -> Euler =
  #| (self, x, y, z, order) => self.set(x, y, z, order)

///|
/// Set angles in radians, preserving the current rotation order by default.
pub fn Euler::set(
  self : Euler,
  x : Double,
  y : Double,
  z : Double,
  order? : EulerOrder,
) -> Euler {
  self.set_euler(x, y, z, order.unwrap_or_else(fn() { self.order() }).to_js())
}

///|
/// Create the identity rotation (0, 0, 0, 1).
pub fn Quaternion::Quaternion() -> Quaternion {
  Quaternion::from_xyzw(0, 0, 0, 1)
}

///|
#module("@mizchi/three-mbt/constructors")
pub extern "js" fn Color::from_rgb(r : Double, g : Double, b : Double) -> Color = "colorRGB"

///|
extern "js" fn Euler::reorder_js(self : Euler, order : String) -> Euler =
  #| (self, order) => self.reorder(order)

///|
/// Preserve the orientation in a new order. Revolution information is discarded.
pub fn Euler::reorder(self : Euler, order : EulerOrder) -> Euler {
  self.reorder_js(order.to_js())
}

///|
extern "js" fn Euler::set_from_vector3_js(
  self : Euler,
  vector : Vector3,
  order : String,
) -> Euler =
  #| (self, vector, order) => self.setFromVector3(vector, order)

///|
pub fn Euler::set_from_vector3(
  self : Euler,
  vector : Vector3,
  order? : EulerOrder,
) -> Euler {
  self.set_from_vector3_js(
    vector,
    order.unwrap_or_else(fn() { self.order() }).to_js(),
  )
}
