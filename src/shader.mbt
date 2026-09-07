///|
/// Typed access to a three.js uniforms dictionary. Setters preserve existing
/// uniform objects so live shader bindings see value updates.
pub extern "js" fn Uniforms::Uniforms() -> Uniforms =
  #| () => Object.create(null)

///|
#module("@mizchi/three-mbt/constructors")
pub extern "js" fn ShaderMaterial::ShaderMaterial(
  vertex_shader : String,
  fragment_shader : String,
  uniforms : Uniforms,
) -> ShaderMaterial = "shaderMaterial"
