# React Three Fiber bindings

`mizchi/three/react_three_fiber` binds React Three Fiber 9.7 / React 19 for the
MoonBit JavaScript target. This subpackage is included starting with
`mizchi/three@0.1.3`.

Install these optional peers when using this subpackage:

```sh
pnpm add @react-three/fiber@9.7.0 react@19.2.8 react-dom@19.2.8 three@0.185.1
```

Use the same `@mizchi/three-mbt` companion link as the parent package. The
`@mizchi/three-mbt/react-three-fiber` export is shipped in its `js/` directory.
Core three.js imports do not import React or Fiber.

```moonbit
import {
  "mizchi/three",
  "mizchi/three/react_three_fiber" @r3f,
}
```

## Components and elements

These functions create native React elements; they do not construct three.js
objects until React renders them. Props use native R3F property names and
semantics. Make fresh props for a render and configure them with `..`.

```moonbit
fn spinning_box() -> @r3f.Node {
  let mesh = @r3f.use_object_ref()
  let clicks = @r3f.use_state(0)
  @r3f.use_frame(fn(_state, delta) {
    if mesh.current() is Some(object) {
      object.rotate_y(delta) |> ignore
    }
  })
  let props = @r3f.Props()
    ..set_ref(mesh)
    ..on_click(fn(event) {
      event.stop_propagation()
      clicks.update(fn(n) { n + 1 })
    })
  @r3f.mesh(props, [
    @r3f.box_geometry(@r3f.Props()..set_args([
      @r3f.Arg::number(1), @r3f.Arg::number(1), @r3f.Arg::number(1),
    ])),
    @r3f.mesh_standard_material(
      @r3f.Props()..set_color(if clicks.value() % 2 == 0 { 0xad207b } else { 0x33aa66 }),
    ),
  ])
}

// Invoke once from the host; React subsequently renders this stable component.
fn app() -> @r3f.Node {
  let box = @r3f.component(spinning_box)
  @r3f.canvas(@r3f.CanvasProps(), [
    box.element(),
    @r3f.ambient_light(@r3f.Props()..set_intensity(2)),
  ])
}
```

Export `app` from your executable package and pass its result to React DOM:

```js
import { createRoot } from 'react-dom/client';
import { app } from 'mbt:your/module';
const root = createRoot(document.getElementById('root'));
root.render(app());
// Later, when the application no longer needs the canvas:
// root.unmount();
```

Give the containing DOM element an explicit height. `component` must be called
outside component render functions so its identity is stable across renders.
Call components through `Component.element()` to let React manage hooks.
Existing JavaScript React components can consume the exported `Node` directly.

`element(name, props, children)` supports other registered intrinsic elements.
`Props.set_number`, `set_string`, and `set_bool` cover additional scalar props,
including R3F dashed property paths. The props bag has typed values but does not
validate which properties are supported by each intrinsic element; constructor
`args` must match that three.js constructor. Use `Arg` conversions for arguments.
Named helpers cover meshes, groups, scenes, points, lines, instancing, common
geometries, materials, lights, and cameras. `primitive` mounts an existing
`Object3D` without cloning it. `set_geometry` and `set_material` share references.

## Hooks and state

- `use_three()` returns the native `RootState`; `use_three_select(selector)`
  subscribes to a selected value. Mutating a three.js object's properties does
  not itself notify a selector.
- `use_frame(callback, priority=0)` receives `(state, deltaSeconds)` before each
  frame. `use_frame_xr` also receives `XRFrame?`. Positive priority takes over
  rendering; your callback must then call the renderer explicitly.
- `use_store()` exposes `get_state()` and `subscribe(callback)`. Unsubscribe with
  the returned `Subscription`; React does not manage these manual subscriptions.
- `use_state(initial)` returns `State[T]`: `value()` is the current render's
  snapshot, `set(value)` replaces it, and `update(fn)` uses React's functional
  update. Function values are stored as values, not accidentally invoked.
- `use_ref(initial)` provides a stable `Ref[T]`; changes to `current` through
  `set` do not rerender. `use_object_ref()` returns a nullable native object ref,
  with `current()` available after mount and reset to `None` on unmount.
- `use_memo(create, dependencies)` and `use_effect(effect, dependencies)` use
  React's dependency comparison. Build dependencies with `Dependency::of(value)`.
  An effect returns its cleanup callback. React Strict Mode may run setup and
  cleanup an extra time in development.
- `use_graph(object)` exposes named node and material lookups as `Option` values.

R3F hooks require a component beneath `Canvas` or a configured Fiber root.
Follow React's hook ordering rules: call hooks unconditionally at the top level
of components. `useLoader` suspension and errors propagate to native React
Suspense and error boundaries; do not catch them in a MoonBit hook wrapper.

`RootState` exposes the renderer, scene, camera, raycaster, pointer, clock, size,
and viewport. `invalidate`, `advance`, `set_dpr`, `set_size`, `set_camera`, and
`set_frameloop` forward to R3F. `Frameloop` has `Always`, `Demand`, and `Never`.
`Clock.elapsed_time()` reads the R3F clock without advancing it.

## Loading and resource ownership

```moonbit
fn asset(url : String) -> @r3f.Node {
  let gltf = @r3f.use_loader(@r3f.Loader::gltf(), url)
  @r3f.primitive(
    @r3f.Props()..set_object(gltf.scene().unwrap().as_object3d()),
  )
}
```

Render this component inside `suspense(fallback, children)`. `Loader::texture()`
loads textures; `use_loaders(loader, urls)` preserves array order.
`Loader::from_gltf(loader)` accepts an existing, configured native GLTFLoader
for Draco, KTX2, or other loader setup. Keep that loader instance stable, for
example in `use_memo`. `preload(url)` primes the cache and `clear(url)` removes
its entry; clearing does not dispose GPU resources.

R3F normally disposes declaratively created resources when unmounting them.
`Props.set_dispose_automatic(false)` sets native `dispose={null}` and disables
that behavior for the subtree; passing `true` removes the override and restores
the inherited/default policy. Primitive objects and cached loader assets remain
caller-owned. Reusing an Object3D still reparents it; clone it explicitly when
separate instances are needed.

A component function returns before its rendered objects finish being used.
Do not `defer resource.dispose()` in a render function. For manually owned
resources, release them in the owner's effect cleanup or application teardown,
after all consumers have unmounted. Shared resources should have one owner and
one cleanup; per-component cleanup must not dispose a cache still used elsewhere.

## Manual roots and additional exports

For a host-owned canvas, call `register_three()` to register native three.js
constructors, then `create_root(canvas)`. Await `FiberRoot.configure(RootOptions)`
before `render(node)`; `configure` returns a MoonBit JS `Promise[Unit]`.
`RootOptions.set_pointer_events()` enables R3F's DOM pointer event manager.
The host manages canvas size and calls `unmount()` during teardown.

`create_portal(children, container)` renders into another Object3D.
`add_effect`, `add_after_effect`, and `add_tail` register global callbacks and
return an explicit `Subscription` for cleanup. These are global R3F effects,
not component hooks.

This first binding layer targets the web renderer. React Native Canvas, custom
reconciler internals, custom event-manager contracts, arbitrary React component
props, and the full set of R3F TypeScript overloads are not yet wrapped.

## Development

`bindings/react-three-fiber.mjs` defines the public types, signatures, and native
mappings. `scripts/generate-react-three-fiber.mjs`, invoked by `just generate`,
regenerates the MoonBit FFI and companion JS. `api.mbt` contains typed enum and
nullable conversions. Generic FFI erasure is private to the generated bridge;
public loader, ref, selector, and state APIs retain their type parameters.

The workspace example is `examples/viewer/src/react_three_fiber`.
`react-three-fiber.spec.mjs` verifies real rendering, hooks, pointer events,
Suspense GLB loading, automatic disposal, and effect cleanup in Chromium.

References: [R3F hooks](https://r3f.docs.pmnd.rs/api/hooks),
[Canvas](https://r3f.docs.pmnd.rs/api/canvas),
[objects and disposal](https://r3f.docs.pmnd.rs/api/objects).
