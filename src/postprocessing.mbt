///|
/// The composer owns the supplied target. Dispose passes separately.
#module("@mizchi/three-mbt/postprocessing")
pub extern "js" fn EffectComposer::with_render_target(
  renderer : WebGLRenderer,
  target : WebGLRenderTarget,
) -> EffectComposer = "composerWithTarget"
