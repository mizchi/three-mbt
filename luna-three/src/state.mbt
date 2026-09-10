///|
/// A mounted Luna tree. The scene, renderer, camera and animation loop belong to the host.
pub struct Root {
  priv container : @three.Object3D
  priv mut children : Array[Mounted]
  priv mut active : Bool
  priv mut updating : Int
  priv on_change : () -> Unit
  priv claims : Map[Int, Bool]
}

///|
priv struct Mounted {
  root : Root
  mut source : Node
  tag : String
  key : String?
  owner : @signals.Owner
  mut stop_binding : () -> Unit
  mut object : @three.Object3D?
  mut children : Array[Mounted]
  mut geometry : (Geometry, @three.BufferGeometry)?
  mut material : (Material, @three.Material)?
  mut previous : Map[String, Property]
  mut defaults : Map[String, Property]
  mut error : String?
  mut children_error : String?
}

///|
fn Mounted::dispose(self : Mounted) -> Unit {
  (self.stop_binding)()
  self.stop_binding = fn() { () }
  for child in self.children {
    child.dispose()
  }
  self.children = []
  self.owner.dispose()
  if self.object is Some(object) {
    object.remove_from_parent() |> ignore
    self.root.claims.remove(object.id())
  }
  if self.geometry is Some((spec, geometry)) {
    dispose_geometry(spec, geometry)
  }
  if self.material is Some((spec, material)) {
    dispose_material(spec, material)
  }
  if self.tag != "primitive" && self.object is Some(object) {
    if object.as_light() is Some(light) {
      light.dispose()
    }
  }
  self.geometry = None
  self.material = None
  self.object = None
}

///|
pub fn Root::unmount(self : Root) -> Unit {
  if !self.active {
    return
  }
  self.active = false
  for child in self.children {
    child.dispose()
  }
  self.children = []
  @reactivity.untracked(self.on_change)
}

///|
/// Invalid low-level Luna nodes/properties are reported here, including reactive updates.
/// An invalid update retains the last valid element or list until corrected.
pub fn Root::error(self : Root) -> String? {
  first_error(self.children)
}

///|
fn first_error(nodes : Array[Mounted]) -> String? {
  for node in nodes {
    if node.error is Some(_) {
      return node.error
    }
    if node.children_error is Some(_) {
      return node.children_error
    }
    if first_error(node.children) is Some(error) {
      return Some(error)
    }
  }
  None
}

///|
fn Root::changed(self : Root) -> Unit {
  if self.active && self.updating == 0 {
    sync_children(self.container, self.children)
    self.notify()
  }
}

///|
/// Property updates need no tree traversal. Host reads must not become dependencies.
fn Root::notify(self : Root) -> Unit {
  if self.active && self.updating == 0 {
    @reactivity.untracked(self.on_change)
  }
}

///|
fn collect_objects(
  nodes : Array[Mounted],
  objects : Array[@three.Object3D],
) -> Unit {
  for node in nodes {
    match node.object {
      Some(object) => {
        objects.push(object)
        sync_children(object, node.children)
      }
      None => collect_objects(node.children, objects)
    }
  }
}

///|
fn sync_children(parent : @three.Object3D, nodes : Array[Mounted]) -> Unit {
  let objects : Array[@three.Object3D] = []
  collect_objects(nodes, objects)
  for object in objects {
    if !(object.parent() is Some(p) && p.same_reference(parent)) {
      parent.add(object) |> ignore
    }
  }
  order_children(parent, FixedArray::from_array(objects))
}

///|
/// Preserve host children and only reorder the slots occupied by this root's objects.
/// This is the sole runtime FFI: Object3D has no public insert-before operation.
extern "js" fn order_children(
  parent : @three.Object3D,
  objects : FixedArray[@three.Object3D],
) -> Unit =
  #| (parent, objects) => {
  #|   const owned = new Set(objects);
  #|   let index = 0;
  #|   for (let i = 0; i < parent.children.length; i++) {
  #|     if (owned.has(parent.children[i])) parent.children[i] = objects[index++];
  #|   }
  #| }
