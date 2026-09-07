///|
pub(all) enum DracoEncodingMethod {
  SequentialEncoding = 0
  EdgeBreakerEncoding = 1
} derive(Eq, Debug)

///|
pub(all) enum MouseAction {
  MouseRotate = 0
  MouseDolly = 1
  MousePan = 2
  MouseDisabled = 3
} derive(Eq, Debug)

///|
pub(all) enum TouchAction {
  TouchRotate = 0
  TouchPan = 1
  TouchDollyPan = 2
  TouchDollyRotate = 3
  TouchDisabled = 4
} derive(Eq, Debug)

///|
pub(all) enum OrbitCursorStyle {
  AutoCursor
  GrabCursor
} derive(Eq, Debug)

///|
pub(all) enum TextDirection {
  LeftToRight
  RightToLeft
  TopToBottom
} derive(Eq, Debug)

///|
pub(all) enum StrokeLineJoin {
  MiterJoin
  RoundJoin
  BevelJoin
} derive(Eq, Debug)

///|
pub(all) enum StrokeLineCap {
  ButtCap
  RoundCap
  SquareCap
} derive(Eq, Debug)

///|
pub(all) enum Side {
  FrontSide = 0
  BackSide = 1
  DoubleSide = 2
} derive(Eq, Debug)

///|
pub(all) enum Wrapping {
  RepeatWrapping = 1000
  ClampToEdgeWrapping = 1001
  MirroredRepeatWrapping = 1002
} derive(Eq, Debug)

///|
pub(all) enum MagnificationFilter {
  Nearest = 1003
  Linear = 1006
} derive(Eq, Debug)

///|
pub(all) enum MinificationFilter {
  Nearest = 1003
  NearestMipmapNearest = 1004
  NearestMipmapLinear = 1005
  Linear = 1006
  LinearMipmapNearest = 1007
  LinearMipmapLinear = 1008
} derive(Eq, Debug)

///|
pub(all) enum ToneMapping {
  NoToneMapping = 0
  LinearToneMapping = 1
  ReinhardToneMapping = 2
  CineonToneMapping = 3
  ACESFilmicToneMapping = 4
  AgXToneMapping = 6
  NeutralToneMapping = 7
} derive(Eq, Debug)

///|
pub(all) enum LoopMode {
  LoopOnce = 2200
  LoopRepeat = 2201
  LoopPingPong = 2202
} derive(Eq, Debug)

///|
pub(all) enum ColorSpace {
  NoColorSpace
  SRGB
  LinearSRGB
} derive(Eq, Debug)

///|
pub(all) enum HDRDataType {
  Float = 1015
  HalfFloat = 1016
} derive(Eq, Debug)

///|
pub(all) enum TextureMapping {
  UV = 300
  CubeReflection = 301
  CubeRefraction = 302
  EquirectangularReflection = 303
  EquirectangularRefraction = 304
  CubeUVReflection = 306
} derive(Eq, Debug)

///|
extern "js" fn Texture::color_space_ffi(self : Texture) -> String =
  #| self => self.colorSpace

///|
pub fn Texture::color_space(self : Texture) -> ColorSpace {
  match self.color_space_ffi() {
    "srgb" => SRGB
    "srgb-linear" => LinearSRGB
    _ => NoColorSpace
  }
}

///|
pub(all) enum OutputColorSpace {
  SRGB
  LinearSRGB
} derive(Eq, Debug)

///|
fn OutputColorSpace::to_js(self : OutputColorSpace) -> String {
  match self {
    SRGB => "srgb"
    LinearSRGB => "srgb-linear"
  }
}

///|
fn ColorSpace::to_js(self : ColorSpace) -> String {
  match self {
    NoColorSpace => ""
    SRGB => "srgb"
    LinearSRGB => "srgb-linear"
  }
}

///|
extern "js" fn Texture::set_color_space_ffi(
  self : Texture,
  value : String,
) -> Unit =
  #| (self, value) => { self.colorSpace = value; }

///|
pub fn Texture::set_color_space(self : Texture, value : ColorSpace) -> Unit {
  self.set_color_space_ffi(value.to_js())
}

///|
extern "js" fn WebGLRenderer::set_output_color_space_ffi(
  self : WebGLRenderer,
  value : String,
) -> Unit =
  #| (self, value) => { self.outputColorSpace = value; }

///|
pub fn WebGLRenderer::set_output_color_space(
  self : WebGLRenderer,
  value : OutputColorSpace,
) -> Unit {
  self.set_output_color_space_ffi(value.to_js())
}

///|
pub(all) enum NormalMapType {
  TangentSpace = 0
  ObjectSpace = 1
} derive(Eq, Debug)

///|
pub(all) enum ShadowMapType {
  Basic = 0
  PCF = 1
  PCFSoft = 2
  VSM = 3
} derive(Eq, Debug)

///|
pub(all) enum TransformMode {
  Translate = 0
  Rotate = 1
  Scale = 2
} derive(Eq, Debug)

///|
pub(all) enum TransformSpace {
  World = 0
  Local = 1
} derive(Eq, Debug)

///|
pub(all) enum BufferUsage {
  StaticDraw = 35044
  DynamicDraw = 35048
  StreamDraw = 35040
} derive(Eq, Debug)

///|
pub(all) enum CatmullRomType {
  Centripetal = 0
  Chordal = 1
  CatmullRom = 2
} derive(Eq, Debug)

///|
pub(all) enum TextureFormat {
  RGBA = 1023
  Red = 1028
  RG = 1030
} derive(Eq, Debug)

///|
pub(all) enum GLSLVersion {
  GLSL1 = 100
  GLSL3 = 300
} derive(Eq, Debug)

///|
pub(all) enum InterpolationMode {
  Discrete = 2300
  Linear = 2301
  Smooth = 2302
  Bezier = 2303
} derive(Eq, Debug)

///|
pub(all) enum AnimationBlendMode {
  Normal = 2500
  Additive = 2501
} derive(Eq, Debug)

///|
pub(all) enum CoordinateSystem {
  WebGL = 2000
  WebGPU = 2001
} derive(Eq, Debug)

///|
pub(all) enum CombineOperation {
  Multiply = 0
  Mix = 1
  Add = 2
} derive(Eq, Debug)

///|
pub(all) enum InterpolationEnding {
  ZeroCurvature = 2400
  ZeroSlope = 2401
  WrapAround = 2402
} derive(Eq, Debug)

///|
pub(all) enum AttributeGPUType {
  Float = 1015
  Int = 1013
} derive(Eq, Debug)

///|
pub(all) enum TrianglesDrawMode {
  Triangles = 0
  Strip = 1
  Fan = 2
} derive(Eq, Debug)

///|
pub(all) enum GTAOOutput {
  Off = 7
  Default = 0
  Diffuse = 1
  Depth = 2
  Normal = 3
  AO = 4
  Denoise = 5
} derive(Eq, Debug)
