///|
/// Clone a subtree and remap skinned meshes to cloned bones.
/// All referenced bones must be descendants of root.
/// Geometry and materials remain shared with the original.
#module("three/addons/utils/SkeletonUtils.js")
pub extern "js" fn clone_skinned(root : Object3D) -> Object3D = "clone"
