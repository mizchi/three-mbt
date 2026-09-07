///|
#module("@mizchi/three-mbt/constructors")
pub extern "js" fn WebGLRenderTarget::with_attachments(
  width : Int,
  height : Int,
  count : Int,
) -> WebGLRenderTarget = "renderTargetWithAttachments"

///|
pub suberror RenderError {
  RenderError(String)
} derive(Debug)

///|
extern "js" fn WebGLRenderer::compile_promise(
  self : WebGLRenderer,
  scene : Scene,
  camera : Camera,
) -> @js_async.Promise[Unit] =
  #| (self, scene, camera) => Promise.resolve().then(() => self.compileAsync(scene, camera)).then(() => undefined)

///|
pub async fn WebGLRenderer::compile_async(
  self : WebGLRenderer,
  scene : Scene,
  camera : Camera,
) -> Unit raise RenderError {
  self.compile_promise(scene, camera).wait() catch {
    error => raise RenderError(error.to_string())
  }
}

///|
extern "js" fn WebGLRenderer::read_pixels_promise(
  self : WebGLRenderer,
  target : WebGLRenderTarget,
  x : Int,
  y : Int,
  width : Int,
  height : Int,
  bytes : Bytes,
) -> @js_async.Promise[Unit] =
  #| (self, target, x, y, width, height, bytes) => Promise.resolve().then(() => self.readRenderTargetPixelsAsync(target, x, y, width, height, bytes)).then(() => undefined)

///|
/// Read RGBA8 pixels into a buffer of at least width * height * 4 bytes.
pub async fn WebGLRenderer::read_render_target_pixels_async(
  self : WebGLRenderer,
  target : WebGLRenderTarget,
  x : Int,
  y : Int,
  width : Int,
  height : Int,
  bytes : Bytes,
) -> Unit raise RenderError {
  self.read_pixels_promise(target, x, y, width, height, bytes).wait() catch {
    error => raise RenderError(error.to_string())
  }
}
