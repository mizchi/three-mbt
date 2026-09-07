///|
#module("@mizchi/three-mbt/bake")
extern "js" fn bake_flow_ffi(flow : Flow) -> JsResult[BufferGeometry] = "bakeFlowGeometry"

///|
#module("@mizchi/three-mbt/bake")
extern "js" fn bake_mesh_ffi(mesh : Mesh) -> JsResult[BufferGeometry] = "bakeMeshGeometry"

///|
pub fn bake_mesh_geometry(mesh : Mesh) -> BufferGeometry raise ModelingError {
  match bake_mesh_ffi(mesh).into_result() {
    Ok(value) => value
    Err(message) => raise ModelingError(message)
  }
}

///|
#module("@mizchi/three-mbt/bake")
extern "js" fn bake_hierarchy_ffi(root : Object3D) -> JsResult[Group] = "bakeMeshHierarchy"

///|
pub fn bake_mesh_hierarchy(root : Object3D) -> Group raise ModelingError {
  match bake_hierarchy_ffi(root).into_result() {
    Ok(value) => value
    Err(message) => raise ModelingError(message)
  }
}

///|
/// Bake the root mesh's shader deformation into a new local-space geometry.
pub fn bake_flow_geometry(flow : Flow) -> BufferGeometry raise ModelingError {
  match bake_flow_ffi(flow).into_result() {
    Ok(value) => value
    Err(message) => raise ModelingError(message)
  }
}

///|
#module("@mizchi/three-mbt/bake")
extern "js" fn bake_flow_instance_ffi(
  flow : InstancedFlow,
  index : Int,
) -> JsResult[BufferGeometry] = "bakeFlowInstanceGeometry"

///|
pub fn bake_flow_instance_geometry(
  flow : InstancedFlow,
  index : Int,
) -> BufferGeometry raise ModelingError {
  match bake_flow_instance_ffi(flow, index).into_result() {
    Ok(value) => value
    Err(message) => raise ModelingError(message)
  }
}
