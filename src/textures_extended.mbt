///|
pub extern "js" fn CubeTextureLoader::load_async(
  self : CubeTextureLoader,
  urls : FixedArray[String],
) -> @js_async.Promise[CubeTexture] =
  #| (self, urls) => { if (urls.length !== 6) return Promise.reject(new Error('CubeTextureLoader requires six URLs in +X,-X,+Y,-Y,+Z,-Z order')); return Promise.resolve().then(() => self.loadAsync(urls)); }

///|
pub async fn CubeTextureLoader::load(
  self : CubeTextureLoader,
  urls : FixedArray[String],
) -> CubeTexture raise LoadError {
  self.load_async(urls).wait() catch {
    error => raise LoadError(error.to_string())
  }
}

///|
pub suberror MediaError {
  MediaError(String)
} derive(Debug)

///|
#module("@mizchi/three-mbt/textures")
extern "js" fn Video::ready_promise(self : Video) -> @js_async.Promise[Unit] = "videoReady"

///|
#module("@mizchi/three-mbt/textures")
extern "js" fn Video::seek_promise(
  self : Video,
  seconds : Double,
) -> @js_async.Promise[Unit] = "videoSeek"

///|
extern "js" fn Video::play_promise(self : Video) -> @js_async.Promise[Unit] =
  #| self => Promise.resolve().then(() => self.play())

///|
pub async fn Video::ready(self : Video) -> Unit raise MediaError {
  self.ready_promise().wait() catch {
    error => raise MediaError(error.to_string())
  }
}

///|
pub async fn Video::play(self : Video) -> Unit raise MediaError {
  self.play_promise().wait() catch {
    error => raise MediaError(error.to_string())
  }
}

///|
pub async fn Video::seek(
  self : Video,
  seconds : Double,
) -> Unit raise MediaError {
  self.seek_promise(seconds).wait() catch {
    error => raise MediaError(error.to_string())
  }
}

///|
/// Release the video source after all pending ready/play/seek calls have completed.
pub extern "js" fn Video::dispose(self : Video) -> Unit =
  #| self => { self.pause(); self.removeAttribute('src'); self.load(); }
