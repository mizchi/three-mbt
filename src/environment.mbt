///|
#module("@mizchi/three-mbt/constructors")
pub extern "js" fn DataTexture::values(
  self : DataTexture,
) -> FixedArray[Double] = "dataTextureValues"

///|
pub extern "js" fn HDRLoader::load_async(
  self : HDRLoader,
  url : String,
) -> @js_async.Promise[DataTexture] =
  #| (self, url) => Promise.resolve().then(() => self.loadAsync(url))

///|
pub async fn HDRLoader::load(
  self : HDRLoader,
  url : String,
) -> DataTexture raise LoadError {
  self.load_async(url).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
extern "js" fn HDRLoader::parse_async(
  self : HDRLoader,
  bytes : Bytes,
) -> @js_async.Promise[DataTexture] =
  #| (self, bytes) => Promise.resolve().then(() => self.createDataTexture(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)))

///|
pub async fn HDRLoader::parse(
  self : HDRLoader,
  bytes : Bytes,
) -> DataTexture raise LoadError {
  self.parse_async(bytes).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
pub extern "js" fn EXRLoader::load_async(
  self : EXRLoader,
  url : String,
) -> @js_async.Promise[DataTexture] =
  #| (self, url) => Promise.resolve().then(() => self.loadAsync(url))

///|
pub async fn EXRLoader::load(
  self : EXRLoader,
  url : String,
) -> DataTexture raise LoadError {
  self.load_async(url).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
extern "js" fn EXRLoader::parse_async(
  self : EXRLoader,
  bytes : Bytes,
) -> @js_async.Promise[DataTexture] =
  #| (self, bytes) => Promise.resolve().then(() => self.createDataTexture(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)))

///|
pub async fn EXRLoader::parse(
  self : EXRLoader,
  bytes : Bytes,
) -> DataTexture raise LoadError {
  self.parse_async(bytes).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
extern "js" fn PMREMGenerator::from_scene_ffi(
  self : PMREMGenerator,
  scene : Scene,
  sigma : Double,
  near : Double,
  far : Double,
  size : Int,
  position : Vector3,
) -> WebGLRenderTarget =
  #| (self, scene, sigma, near, far, size, position) => self.fromScene(scene, sigma, near, far, {size, position})

///|
pub fn PMREMGenerator::from_scene(
  self : PMREMGenerator,
  scene : Scene,
  sigma? : Double = 0,
  near? : Double = 0.1,
  far? : Double = 100,
  size? : Int = 256,
  position? : Vector3 = Vector3(0, 0, 0),
) -> WebGLRenderTarget {
  self.from_scene_ffi(scene, sigma, near, far, size, position)
}
