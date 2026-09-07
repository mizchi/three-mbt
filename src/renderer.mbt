///|
#module("@mizchi/three-mbt/constructors")
extern "js" fn new_renderer(antialias : Bool, alpha : Bool) -> WebGLRenderer = "webGLRenderer"

///|
/// Requires a browser with WebGL2 support.
pub fn WebGLRenderer::WebGLRenderer(
  antialias? : Bool = true,
  alpha? : Bool = false,
) -> WebGLRenderer {
  new_renderer(antialias, alpha)
}

///|
#module("@mizchi/three-mbt/constructors")
extern "js" fn renderer_with_canvas(
  canvas : Canvas,
  antialias : Bool,
  alpha : Bool,
) -> WebGLRenderer = "webGLRendererWithCanvas"

///|
pub fn WebGLRenderer::with_canvas(
  canvas : Canvas,
  antialias? : Bool = true,
  alpha? : Bool = false,
) -> WebGLRenderer {
  renderer_with_canvas(canvas, antialias, alpha)
}

///|
extern "js" fn WebGLRenderer::set_size_ffi(
  self : WebGLRenderer,
  width : Int,
  height : Int,
  update_style : Bool,
) -> Unit =
  #| (self, width, height, update_style) => self.setSize(width, height, update_style)

///|
pub fn WebGLRenderer::set_size(
  self : WebGLRenderer,
  width : Int,
  height : Int,
  update_style? : Bool = true,
) -> Unit {
  self.set_size_ffi(width, height, update_style)
}

///|
extern "js" fn canvas_from_id(id : String) -> Nullable[Canvas] =
  #| id => { const element = document.getElementById(id); return element instanceof HTMLCanvasElement ? element : null; }

///|
pub fn Canvas::from_id(id : String) -> Canvas? {
  canvas_from_id(id).to_option()
}

///|
pub extern "js" fn Canvas::Canvas() -> Canvas =
  #| () => document.createElement('canvas')
