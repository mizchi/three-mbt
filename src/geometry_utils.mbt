///|
#module("three/addons/utils/BufferGeometryUtils.js")
extern "js" fn merge_geometries_ffi(
  geometries : FixedArray[BufferGeometry],
  use_groups : Bool,
) -> Nullable[BufferGeometry] = "mergeGeometries"

///|
/// Inputs must have compatible attributes and indexing. Incompatible inputs return None.
pub fn merge_geometries(
  geometries : FixedArray[BufferGeometry],
  use_groups : Bool,
) -> BufferGeometry? {
  if geometries.length() == 0 {
    return None
  }
  merge_geometries_ffi(geometries, use_groups).to_option()
}

///|
#module("three/addons/utils/BufferGeometryUtils.js")
pub extern "js" fn merge_vertices(
  geometry : BufferGeometry,
  tolerance : Double,
) -> BufferGeometry = "mergeVertices"

///|
#module("three/addons/utils/BufferGeometryUtils.js")
pub extern "js" fn to_creased_normals(
  geometry : BufferGeometry,
  crease_angle : Double,
) -> BufferGeometry = "toCreasedNormals"
