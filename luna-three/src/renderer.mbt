///|
pub fn mount(
  container : @three.Object3D,
  node : Node,
  on_change? : () -> Unit = fn() { () },
) -> Root {
  let root : Root = {
    container,
    children: [],
    active: false,
    updating: 0,
    on_change,
    claims: Map([]),
  }
  root.children = [create_mounted(root, @luna.fragment([node]))]
  root.active = true
  @reactivity.on_cleanup(fn() { root.unmount() })
  root.changed()
  root
}

///|
/// Child scopes must not register cleanup with, or subscribe, the parent's effect.
fn[T] in_scope(owner : @signals.Owner, f : () -> T) -> T {
  let previous = @reactivity.set_current_cleanups(None)
  let result = @reactivity.untracked(fn() {
    @reactivity.run_with_owner(owner, f)
  })
  @reactivity.set_current_cleanups(previous) |> ignore
  result
}

///|
fn node_key(node : Node) -> String? {
  if node is @luna.Element(el) {
    let mut key = None
    for (_, attr) in el.attrs {
      if attr is @luna.VStatic(Key(value)) {
        key = Some(value)
      }
    }
    key
  } else {
    None
  }
}

///|
fn node_tag(node : Node) -> String {
  match node {
    @luna.Element(el) => el.tag
    @luna.Fragment(_) => "#fragment"
    @luna.Component(..) => "#component"
    @luna.Show(..) => "#show"
    @luna.For(..) => "#for"
    @luna.Switch(_) => "#switch"
    _ => "#unsupported"
  }
}

///|
fn primitive_object(node : Node) -> @three.Object3D? {
  if node is @luna.Element(el) {
    let mut object = None
    for (_, attr) in el.attrs {
      if attr is @luna.VStatic(Object(value)) {
        object = Some(value)
      }
    }
    object
  } else {
    None
  }
}

///|
fn reusable(mounted : Mounted, node : Node) -> Bool {
  if physical_equal(mounted.source, node) {
    return true
  }
  if mounted.tag != node_tag(node) {
    return false
  }
  if mounted.tag == "primitive" {
    match (primitive_object(mounted.source), primitive_object(node)) {
      (Some(a), Some(b)) => a.same_reference(b)
      _ => false
    }
  } else {
    node is @luna.Element(_)
  }
}

///|
fn reconcile(root : Root, parent : Mounted, nodes : Array[Node]) -> Unit {
  let keys : Map[String, Bool] = Map([])
  for node in nodes {
    if node_key(node) is Some(key) {
      if keys.contains(key) {
        parent.children_error = Some("Duplicate sibling key: " + key)
        return
      }
      keys.set(key, true)
    }
  }
  parent.children_error = None
  let old = parent.children
  let keyed : Map[String, Int] = Map([])
  for index, child in old {
    if child.key is Some(key) {
      keyed.set(key, index)
    }
  }
  let used : Array[Bool] = Array::make(old.length(), false)
  let matches : Array[Int?] = []
  for index, node in nodes {
    let candidate = match node_key(node) {
      Some(key) => keyed.get(key)
      None =>
        if index < old.length() && old[index].key is None {
          Some(index)
        } else {
          None
        }
    }
    if candidate is Some(i) && !used[i] && reusable(old[i], node) {
      used[i] = true
      matches.push(Some(i))
    } else {
      matches.push(None)
    }
  }
  // Release removed/replaced slots first, so a primitive may move to a new key.
  for index, child in old {
    if !used[index] {
      child.dispose()
    }
  }
  let next : Array[Mounted] = []
  for index, source in nodes {
    if matches[index] is Some(i) {
      let child = old[i]
      if !physical_equal(child.source, source) {
        child.source = source
        in_scope(child.owner, fn() { bind_element(root, child, source) })
      }
      next.push(child)
    } else {
      next.push(create_mounted(root, source))
    }
  }
  parent.children = next
}

///|
fn create_mounted(root : Root, source : Node) -> Mounted {
  let node : Mounted = {
    root,
    source,
    tag: node_tag(source),
    key: node_key(source),
    owner: @signals.Owner::new(@reactivity.get_owner()),
    stop_binding: fn() { () },
    object: None,
    children: [],
    geometry: None,
    material: None,
    previous: Map([]),
    defaults: Map([]),
    error: None,
    children_error: None,
  }
  in_scope(node.owner, fn() {
    match source {
      @luna.Element(_) => bind_element(root, node, source)
      @luna.Fragment(children) => reconcile(root, node, children)
      @luna.Component(render~) => reconcile(root, node, [render()])
      @luna.Show(condition~, child~) => {
        let (_, stop) = @reactivity.create_root_with_dispose(fn() {
          @reactivity.render_effect(fn() {
            let visible = condition()
            root.updating += 1
            in_scope(node.owner, fn() {
              if visible {
                if node.children.is_empty() {
                  reconcile(root, node, [child()])
                }
              } else {
                reconcile(root, node, [])
              }
            })
            root.updating -= 1
            root.changed()
          })
          |> ignore
        })
        node.stop_binding = stop
      }
      @luna.For(render~) => bind_list(root, node, render)
      @luna.Switch(value) => {
        // Track conditions, but render the selected component outside tracking.
        let selected = Ref(-2)
        let (_, stop) = @reactivity.create_root_with_dispose(fn() {
          @reactivity.render_effect(fn() {
            let mut index = -1
            for i, case_ in value.cases {
              if (case_.when)() {
                index = i
                break
              }
            }
            if selected.val != index {
              selected.val = index
              root.updating += 1
              in_scope(node.owner, fn() {
                let children = if index >= 0 {
                  [(value.cases[index].render)()]
                } else if value.fallback is Some(fallback) {
                  [fallback()]
                } else {
                  []
                }
                reconcile(root, node, children)
              })
              root.updating -= 1
              root.changed()
            }
          })
          |> ignore
        })
        node.stop_binding = stop
      }
      _ =>
        node.error = Some(
          "Unsupported Luna node: use Element, Fragment, Component, Show, For or Switch",
        )
    }
  })
  node
}

///|
fn bind_list(root : Root, node : Mounted, render : () -> Array[Node]) -> Unit {
  let (_, stop) = @reactivity.create_root_with_dispose(fn() {
    @reactivity.render_effect(fn() {
      let children = render()
      root.updating += 1
      in_scope(node.owner, fn() { reconcile(root, node, children) })
      root.updating -= 1
      root.changed()
    })
    |> ignore
  })
  node.stop_binding = stop
}

///|
fn bind_element(root : Root, node : Mounted, source : Node) -> Unit {
  guard source is @luna.Element(el) else { return }
  let existing = node.object is Some(_)
  (node.stop_binding)()
  let (_, stop) = @reactivity.create_root_with_dispose(fn() {
    @reactivity.render_effect(fn() {
      let props : Map[String, Property] = Map([])
      let mut error = None
      for (_, attr) in el.attrs {
        match attr {
          @luna.VStatic(value) => props.set(value.slot(), value)
          @luna.VDynamic(get) => {
            let value = get()
            if value is Key(_) || value is Object(_) {
              error = Some(
                "Key and Object must be static; change them through a keyed list",
              )
            } else {
              props.set(value.slot(), value)
            }
          }
          _ =>
            error = Some(
              "Luna event handlers and actions are not supported by the 3D renderer",
            )
        }
      }
      let had_object = node.object is Some(_)
      match error {
        Some(_) => node.error = error
        None => apply_properties(node, props)
      }
      if !had_object && node.object is Some(_) {
        root.updating += 1
        in_scope(node.owner, fn() { reconcile(root, node, el.children) })
        root.updating -= 1
        root.changed()
      } else {
        root.notify()
      }
    })
    |> ignore
  })
  node.stop_binding = stop
  // These children belong to the element, independently of its property effects.
  if existing && node.object is Some(_) {
    reconcile(root, node, el.children)
  }
}
