///|
#external
priv type JsValue

///|
#external
priv type Nullable[T]

///|
fn[T] js_value(value : T) -> JsValue = "%identity"

///|
fn[T] js_cast(value : JsValue) -> T = "%identity"

///|
extern "js" fn js_is_null(value : JsValue) -> Bool =
  #| value => value == null

///|
extern "js" fn js_null() -> JsValue =
  #| () => null

///|
fn[T] Nullable::to_option(self : Nullable[T]) -> T? {
  let raw = js_value(self)
  if js_is_null(raw) {
    None
  } else {
    Some(js_cast(raw))
  }
}

///|
fn[T] Nullable::from_option(value : T?) -> Nullable[T] {
  match value {
    None => js_cast(js_null())
    Some(value) => js_cast(js_value(value))
  }
}

///|
#external
priv type JsResult[T]

///|
extern "js" fn js_result_is_ok(value : JsValue) -> Bool =
  #| value => value.ok

///|
extern "js" fn js_result_value(value : JsValue) -> JsValue =
  #| value => value.value

///|
extern "js" fn js_result_error(value : JsValue) -> String =
  #| value => value.error

///|
fn[T] JsResult::into_result(self : JsResult[T]) -> Result[T, String] {
  let raw = js_value(self)
  if js_result_is_ok(raw) {
    Ok(js_cast(js_result_value(raw)))
  } else {
    Err(js_result_error(raw))
  }
}
