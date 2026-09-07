///|
pub fn Group::as_object3d(self : Group) -> Object3D = "%identity"

///|
pub fn Scene::as_object3d(self : Scene) -> Object3D = "%identity"

///|
#external
priv type NullableObject3D

///|
extern "js" fn NullableObject3D::nullable_object_is_null(
  self : NullableObject3D,
) -> Bool =
  #| (self) => self == null

///|
fn NullableObject3D::nullable_object_value(self : NullableObject3D) -> Object3D = "%identity"

///|
fn NullableObject3D::to_option(self : NullableObject3D) -> Object3D? {
  if self.nullable_object_is_null() {
    None
  } else {
    Some(self.nullable_object_value())
  }
}

///|
extern "js" fn Object3D::object_parent(self : Object3D) -> NullableObject3D =
  #| (self) => self.parent

///|
pub fn Object3D::parent(self : Object3D) -> Object3D? {
  self.object_parent().to_option()
}

///|
extern "js" fn Object3D::object_by_name(
  self : Object3D,
  name : String,
) -> NullableObject3D =
  #| (self, name) => self.getObjectByName(name)

///|
/// Includes the receiver in the search. Missing names return None.
pub fn Object3D::get_object_by_name(
  self : Object3D,
  name : String,
) -> Object3D? {
  self.object_by_name(name).to_option()
}

///|
extern "js" fn Object3D::clone_object(
  self : Object3D,
  recursive : Bool,
) -> Object3D =
  #| (self, recursive) => self.clone(recursive)

///|
pub fn Object3D::clone(self : Object3D, recursive? : Bool = true) -> Object3D {
  self.clone_object(recursive)
}

///|
#external
priv type NullableColor

///|
extern "js" fn Scene::scene_background(self : Scene) -> NullableColor =
  #| (self) => self.background?.isColor ? self.background : null

///|
extern "js" fn NullableColor::nullable_color_is_null(
  self : NullableColor,
) -> Bool =
  #| (self) => self == null

///|
fn NullableColor::nullable_color_value(self : NullableColor) -> Color = "%identity"

///|
/// Returns the background only when it is a Color; use background_texture() for textures.
pub fn Scene::background(self : Scene) -> Color? {
  let background = self.scene_background()
  if background.nullable_color_is_null() {
    None
  } else {
    Some(background.nullable_color_value())
  }
}

///|
extern "js" fn Scene::set_scene_background(self : Scene, color : Color) -> Unit =
  #| (self, color) => { self.background = color; }

///|
extern "js" fn Scene::clear_scene_background(self : Scene) -> Unit =
  #| (self) => { self.background = null; }

///|
pub fn Scene::set_background(self : Scene, color : Color?) -> Unit {
  match color {
    Some(color) => self.set_scene_background(color)
    None => self.clear_scene_background()
  }
}
