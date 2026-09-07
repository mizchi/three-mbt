///|
/// An event registration. Explicitly unsubscribe when the observer is no longer needed.
#external
pub type EventSubscription

///|
pub extern "js" fn EventSubscription::unsubscribe(
  self : EventSubscription,
) -> Unit =
  #| self => self()

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn Object3D::on_added(
  self : Object3D,
  callback : () -> Unit,
) -> EventSubscription = "onAdded"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn Object3D::on_removed(
  self : Object3D,
  callback : () -> Unit,
) -> EventSubscription = "onRemoved"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn Object3D::on_child_added(
  self : Object3D,
  callback : (Object3D) -> Unit,
) -> EventSubscription = "onChildAdded"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn Object3D::on_child_removed(
  self : Object3D,
  callback : (Object3D) -> Unit,
) -> EventSubscription = "onChildRemoved"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn AnimationMixer::on_finished(
  self : AnimationMixer,
  callback : (AnimationAction, Int) -> Unit,
) -> EventSubscription = "onFinished"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn AnimationMixer::on_loop(
  self : AnimationMixer,
  callback : (AnimationAction, Int) -> Unit,
) -> EventSubscription = "onLoop"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn Material::on_dispose(
  self : Material,
  callback : () -> Unit,
) -> EventSubscription = "onDispose"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn BufferGeometry::on_dispose(
  self : BufferGeometry,
  callback : () -> Unit,
) -> EventSubscription = "onDispose"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn Texture::on_dispose(
  self : Texture,
  callback : () -> Unit,
) -> EventSubscription = "onDispose"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn OrbitControls::on_change(
  self : OrbitControls,
  callback : () -> Unit,
) -> EventSubscription = "onChange"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn OrbitControls::on_start(
  self : OrbitControls,
  callback : () -> Unit,
) -> EventSubscription = "onStart"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn OrbitControls::on_end(
  self : OrbitControls,
  callback : () -> Unit,
) -> EventSubscription = "onEnd"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn TransformControls::on_change(
  self : TransformControls,
  callback : () -> Unit,
) -> EventSubscription = "onChange"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn TransformControls::on_object_change(
  self : TransformControls,
  callback : () -> Unit,
) -> EventSubscription = "onObjectChange"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn TransformControls::on_dragging_changed(
  self : TransformControls,
  callback : (Bool) -> Unit,
) -> EventSubscription = "onDraggingChanged"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn PointerLockControls::on_change(
  self : PointerLockControls,
  callback : () -> Unit,
) -> EventSubscription = "onChange"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn PointerLockControls::on_lock(
  self : PointerLockControls,
  callback : () -> Unit,
) -> EventSubscription = "onLock"

///|
#module("@mizchi/three-mbt/events")
pub extern "js" fn PointerLockControls::on_unlock(
  self : PointerLockControls,
  callback : () -> Unit,
) -> EventSubscription = "onUnlock"
