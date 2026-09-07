///|
pub extern "js" fn UserData::UserData() -> UserData =
  #| () => Object.create(null)

///|
extern "js" fn UserData::json_text(
  self : UserData,
  key : String,
) -> Nullable[String] =
  #| (self, key) => { if (!Object.hasOwn(self, key)) return null; try { return JSON.stringify(self[key]) ?? null; } catch { return null; } }

///|
/// Returns None for missing or non-serializable values. JSON null is Some(Null).
pub fn UserData::get_json(self : UserData, key : String) -> Json? {
  match self.json_text(key).to_option() {
    None => None
    Some(text) => (@json.parse(text) |> Some) catch { _ => None }
  }
}

///|
extern "js" fn UserData::set_json_text(
  self : UserData,
  key : String,
  text : String,
) -> Unit =
  #| (self, key, text) => { Object.defineProperty(self, key, { value: JSON.parse(text), enumerable: true, configurable: true, writable: true }); }

///|
/// Stores an independent JSON value. Use set_object() when sharing is intended.
pub fn UserData::set_json(self : UserData, key : String, value : Json) -> Unit {
  self.set_json_text(key, value.stringify())
}
