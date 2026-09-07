///|
pub suberror ExportError {
  ExportError(String)
} derive(Debug)

///|
#module("@mizchi/three-mbt/exporters")
extern "js" fn GLTFExporter::glb_promise(
  self : GLTFExporter,
  root : Object3D,
  options : GLTFExportOptions,
) -> @js_async.Promise[Bytes] = "exportGLB"

///|
#module("@mizchi/three-mbt/exporters")
extern "js" fn GLTFExporter::gltf_promise(
  self : GLTFExporter,
  root : Object3D,
  options : GLTFExportOptions,
) -> @js_async.Promise[String] = "exportGLTF"

///|
/// Export a GLB in a browser environment (FileReader required).
pub async fn GLTFExporter::export_glb(
  self : GLTFExporter,
  root : Object3D,
  options? : GLTFExportOptions = GLTFExportOptions(),
) -> Bytes raise ExportError {
  self.glb_promise(root, options).wait() catch {
    error => raise ExportError(error.to_string())
  }
}

///|
/// Export glTF JSON with embedded resources in a browser environment.
pub async fn GLTFExporter::export_gltf(
  self : GLTFExporter,
  root : Object3D,
  options? : GLTFExportOptions = GLTFExportOptions(),
) -> String raise ExportError {
  self.gltf_promise(root, options).wait() catch {
    error => raise ExportError(error.to_string())
  }
}
