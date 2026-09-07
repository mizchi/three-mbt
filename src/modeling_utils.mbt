///|
pub suberror ModelingError {
  ModelingError(String)
} derive(Debug)

///|
#module("@mizchi/three-mbt/modeling-utils")
extern "js" fn merge_attributes_ffi(
  attributes : FixedArray[PackedBufferAttribute],
) -> Nullable[PackedBufferAttribute] = "mergePackedAttributes"

///|
/// Concatenate compatible attributes. Empty, incompatible or half-float input returns None.
pub fn merge_attributes(
  attributes : FixedArray[PackedBufferAttribute],
) -> PackedBufferAttribute? {
  merge_attributes_ffi(attributes).to_option()
}

///|
#module("@mizchi/three-mbt/modeling-utils")
extern "js" fn interleave_attributes_ffi(
  attributes : FixedArray[PackedBufferAttribute],
) -> Nullable[FixedArray[InterleavedBufferAttribute]] = "interleavePackedAttributes"

///|
/// Requires matching storage types/counts and 1-4 components. Half floats are unsupported.
pub fn interleave_attributes(
  attributes : FixedArray[PackedBufferAttribute],
) -> FixedArray[InterleavedBufferAttribute]? {
  interleave_attributes_ffi(attributes).to_option()
}

///|
#module("@mizchi/three-mbt/modeling-utils")
pub extern "js" fn deinterleave_attribute(
  attribute : InterleavedBufferAttribute,
) -> PackedBufferAttribute = "deinterleaveAttribute"

///|
#module("three/addons/utils/BufferGeometryUtils.js")
pub extern "js" fn deinterleave_geometry(geometry : BufferGeometry) -> Unit = "deinterleaveGeometry"

///|
#module("@mizchi/three-mbt/modeling-utils")
pub extern "js" fn deep_clone_attribute(
  attribute : BufferAttribute,
) -> PackedBufferAttribute = "cloneAttribute"

///|
#module("three/addons/utils/BufferGeometryUtils.js")
pub extern "js" fn estimate_geometry_bytes(geometry : BufferGeometry) -> Double = "estimateBytesUsed"

///|
#module("three/addons/utils/BufferGeometryUtils.js")
pub extern "js" fn merge_groups(geometry : BufferGeometry) -> BufferGeometry = "mergeGroups"

///|
#module("three/addons/utils/BufferGeometryUtils.js")
pub extern "js" fn to_triangles_draw_mode(
  geometry : BufferGeometry,
  mode : TrianglesDrawMode,
) -> BufferGeometry = "toTrianglesDrawMode"

///|
#module("@mizchi/three-mbt/modeling-utils")
extern "js" fn morphed_attributes_ffi(
  mesh : Mesh,
) -> JsResult[MorphedAttributes] = "morphedAttributes"

///|
/// Snapshot morphed/skinned attributes in object space. Position and normal are required.
pub fn compute_morphed_attributes(
  mesh : Mesh,
) -> MorphedAttributes raise ModelingError {
  match morphed_attributes_ffi(mesh).into_result() {
    Ok(value) => value
    Err(message) => raise ModelingError(message)
  }
}

///|
#module("@mizchi/three-mbt/modeling-utils")
extern "js" fn mikk_tangents_ffi(
  geometry : BufferGeometry,
  negate_sign : Bool,
) -> @js_async.Promise[BufferGeometry] = "mikkTangents"

///|
/// Mutates the geometry, de-indexing it when needed. Negate the sign for glTF normal maps.
pub async fn compute_mikktspace_tangents(
  geometry : BufferGeometry,
  negate_sign : Bool,
) -> BufferGeometry raise ModelingError {
  mikk_tangents_ffi(geometry, negate_sign).wait() catch {
    error => raise ModelingError(error.to_string())
  }
}
