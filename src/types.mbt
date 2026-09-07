///|
/// Mutable three.js Vector2. Methods returning Vector2 mutate the receiver,
/// except clone(). equals() compares values; same_reference() compares identity.
#external
pub type Vector2

///|
/// Mutable three.js Vector3. Object3D.position/scale/up return live references.
#external
pub type Vector3

///|
/// Mutable Euler angles in radians. Use EulerOrder for the rotation order.
#external
pub type Euler

///|
/// Mutable quaternion. Rotation operations expect normalized quaternions/axes.
#external
pub type Quaternion

///|
/// Mutable 4x4 matrix. elements() returns a column-major snapshot.
#external
pub type Matrix4

///|
/// Mutable color in three.js's working color space (linear sRGB by default).
/// from_hex/set_hex/get_hex use sRGB; from_rgb/set_rgb use the working space.
#external
pub type Color

///|
/// A three.js scene node. Transform getters return live references.
/// children() returns a snapshot; nodes inside it retain their identity.
#external
pub type Object3D

///|
/// A group of scene nodes. as_object3d() is a zero-copy upcast.
#external
pub type Group

///|
/// A scene root. as_object3d() is a zero-copy upcast.
#external
pub type Scene
