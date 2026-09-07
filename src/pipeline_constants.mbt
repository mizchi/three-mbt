///|
pub(all) enum Blending {
  None = 0
  Normal = 1
  Additive = 2
  Subtractive = 3
  Multiply = 4
  Custom = 5
} derive(Eq, Debug)

///|
pub(all) enum BlendEquation {
  Add = 100
  Subtract = 101
  ReverseSubtract = 102
  Min = 103
  Max = 104
} derive(Eq, Debug)

///|
pub(all) enum BlendFactor {
  Zero = 200
  One = 201
  SrcColor = 202
  OneMinusSrcColor = 203
  SrcAlpha = 204
  OneMinusSrcAlpha = 205
  DstAlpha = 206
  OneMinusDstAlpha = 207
  DstColor = 208
  OneMinusDstColor = 209
  SrcAlphaSaturate = 210
  ConstantColor = 211
  OneMinusConstantColor = 212
  ConstantAlpha = 213
  OneMinusConstantAlpha = 214
} derive(Eq, Debug)

///|
pub(all) enum StencilFunction {
  Never = 512
  Less = 513
  Equal = 514
  LessEqual = 515
  Greater = 516
  NotEqual = 517
  GreaterEqual = 518
  Always = 519
} derive(Eq, Debug)

///|
pub(all) enum StencilOperation {
  Zero = 0
  Keep = 7680
  Replace = 7681
  Increment = 7682
  Decrement = 7683
  Invert = 5386
  IncrementWrap = 34055
  DecrementWrap = 34056
} derive(Eq, Debug)

///|
pub(all) enum DepthFunction {
  Never = 0
  Always = 1
  Less = 2
  LessEqual = 3
  Equal = 4
  GreaterEqual = 5
  Greater = 6
  NotEqual = 7
} derive(Eq, Debug)

///|
pub(all) enum DepthPacking {
  Basic = 3200
  RGBA = 3201
  RGB = 3202
  RG = 3203
} derive(Eq, Debug)
