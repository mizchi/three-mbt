///|
/// A network, decoding, or parsing error from a three.js loader.
pub suberror LoadError {
  LoadError(String)
} derive(Debug)

///|
/// Starts loading immediately. URLs may point to GLB or glTF assets.
pub extern "js" fn GLTFLoader::load_async(
  self : GLTFLoader,
  url : String,
) -> @js_async.Promise[GLTF] =
  #| (self, url) => Promise.resolve().then(() => self.loadAsync(url))

///|
pub async fn GLTFLoader::load(
  self : GLTFLoader,
  url : String,
) -> GLTF raise LoadError {
  self.load_async(url).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
extern "js" fn GLTFLoader::parse_glb_async(
  self : GLTFLoader,
  data : Bytes,
  path : String,
) -> @js_async.Promise[GLTF] =
  #| (self, data, path) => Promise.resolve().then(() => self.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), path))

///|
/// Parses a GLB byte buffer. path resolves any external buffer/image references.
pub async fn GLTFLoader::parse_glb(
  self : GLTFLoader,
  data : Bytes,
  path? : String = "",
) -> GLTF raise LoadError {
  self.parse_glb_async(data, path).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
extern "js" fn GLTFLoader::parse_gltf_async(
  self : GLTFLoader,
  json : String,
  path : String,
) -> @js_async.Promise[GLTF] =
  #| (self, json, path) => Promise.resolve().then(() => self.parseAsync(json, path))

///|
pub async fn GLTFLoader::parse_gltf(
  self : GLTFLoader,
  json : String,
  path? : String = "",
) -> GLTF raise LoadError {
  self.parse_gltf_async(json, path).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
#module("@mizchi/three-mbt/loaders")
pub extern "js" fn GLTFLoader::with_manager(
  manager : LoadingManager,
) -> GLTFLoader = "gltfLoaderWithManager"

///|
#module("@mizchi/three-mbt/loaders")
extern "js" fn GLTFLoader::meshopt_ffi(self : GLTFLoader) -> GLTFLoader = "enableMeshopt"

///|
/// Uses the Meshopt decoder shipped with the installed three.js package.
pub fn GLTFLoader::enable_meshopt(self : GLTFLoader) -> GLTFLoader {
  self.meshopt_ffi()
}

///|
pub extern "js" fn TextureLoader::load_async(
  self : TextureLoader,
  url : String,
) -> @js_async.Promise[Texture] =
  #| (self, url) => Promise.resolve().then(() => self.loadAsync(url))

///|
pub async fn TextureLoader::load(
  self : TextureLoader,
  url : String,
) -> Texture raise LoadError {
  self.load_async(url).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
pub extern "js" fn KTX2Loader::load_async(
  self : KTX2Loader,
  url : String,
) -> @js_async.Promise[Texture] =
  #| (self, url) => Promise.resolve().then(() => self.loadAsync(url))

///|
pub async fn KTX2Loader::load(
  self : KTX2Loader,
  url : String,
) -> Texture raise LoadError {
  self.load_async(url).wait() catch {
    error => raise LoadError(error.to_string())
  }
}
