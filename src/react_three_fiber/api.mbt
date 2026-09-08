///|
pub(all) enum Frameloop {
  Always
  Demand
  Never
} derive(Eq, Debug)

///|
fn Frameloop::to_js(self : Frameloop) -> String {
  match self {
    Always => "always"
    Demand => "demand"
    Never => "never"
  }
}

///|
pub fn CanvasProps::set_frameloop(
  self : CanvasProps,
  value : Frameloop,
) -> Unit {
  self.ffi_set_frameloop(value.to_js())
}

///|
pub fn RootOptions::set_frameloop(
  self : RootOptions,
  value : Frameloop,
) -> Unit {
  self.ffi_set_frameloop(value.to_js())
}

///|
pub fn RootState::set_frameloop(self : RootState, value : Frameloop) -> Unit {
  self.ffi_set_frameloop(value.to_js())
}

///|
/// Call inside a component under Canvas. Positive priority takes over rendering.
pub fn use_frame(
  callback : (RootState, Double) -> Unit,
  priority? : Double = 0,
) -> Unit {
  ffi_use_frame(callback, priority)
}

///|
/// Full useFrame callback, including the optional native WebXR frame.
pub fn use_frame_xr(
  callback : (RootState, Double, XRFrame?) -> Unit,
  priority? : Double = 0,
) -> Unit {
  ffi_use_frame_xr(
    fn(state, delta, frame) { callback(state, delta, frame.to_option()) },
    priority,
  )
}

///|
#external
priv type Nullable[T]

///|
extern "js" fn is_null(value : Raw) -> Bool =
  #| value => value == null

///|
fn[T] Nullable::value(self : Nullable[T]) -> T = "%identity"

///|
fn[T] Nullable::to_option(self : Nullable[T]) -> T? {
  if is_null(raw(self)) {
    None
  } else {
    Some(self.value())
  }
}

///|
pub fn ObjectRef::current(self : ObjectRef) -> @three.Object3D? {
  self.ffi_current().to_option()
}

///|
pub fn ObjectMap::node(self : ObjectMap, name : String) -> @three.Object3D? {
  self.ffi_node(name).to_option()
}

///|
pub fn ObjectMap::material(self : ObjectMap, name : String) -> @three.Material? {
  self.ffi_material(name).to_option()
}

///|
#external
priv type Raw

///|
fn[T] raw(value : T) -> Raw = "%identity"

///|
fn[T] cast(value : Raw) -> T = "%identity"
