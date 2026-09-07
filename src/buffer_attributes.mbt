///|
#module("@mizchi/three-mbt/geometry")
pub extern "js" fn BufferAttribute::from_uint8(
  values : FixedArray[UInt],
  item_size : Int,
  normalized : Bool,
) -> BufferAttribute = "uint8Attribute"

///|
#module("@mizchi/three-mbt/geometry")
pub extern "js" fn BufferAttribute::from_uint16(
  values : FixedArray[UInt],
  item_size : Int,
  normalized : Bool,
) -> BufferAttribute = "uint16Attribute"

///|
#module("@mizchi/three-mbt/geometry")
pub extern "js" fn BufferAttribute::from_uint32(
  values : FixedArray[UInt],
  item_size : Int,
  normalized : Bool,
) -> BufferAttribute = "uint32Attribute"

///|
#module("@mizchi/three-mbt/geometry")
pub extern "js" fn BufferAttribute::from_int32(
  values : FixedArray[Int],
  item_size : Int,
  normalized : Bool,
) -> BufferAttribute = "int32Attribute"

///|
/// Encodes numbers as IEEE 754 half floats. The native constructor takes raw bits.
#module("@mizchi/three-mbt/geometry")
pub extern "js" fn Float16BufferAttribute::from_floats(
  values : FixedArray[Double],
  item_size : Int,
) -> Float16BufferAttribute = "float16AttributeFromFloats"
