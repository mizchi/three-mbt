# luna-three

`mizchi/luna_three` is a JavaScript-target custom renderer for Luna's
`Node[Unit, Property]`. Declare three.js scenes with MoonBit components and
signals, using `mizchi/three` for the actual objects and GPU resources.
It runs in Node.js for modeling/export and in a browser for rendering.

This module is developed locally in the repository's `moon.work`; it has not
been published. The workspace resolves `mizchi/three@0.1.3` to the root library
and uses the published `mizchi/luna@0.24.1` / `mizchi/signals@0.6.5`.
There is no additional JavaScript companion or React dependency for this renderer.
The existing `@mizchi/three-mbt` companion and `three` are required.

## Use in the workspace

Add `"mizchi/luna_three@0.1.0"`, `"mizchi/luna@0.24.1"` and
`"mizchi/signals@0.6.5"` to the consuming module's imports. Import the packages:

```moonbit
// moon.pkg
import {
  "mizchi/three",
  "mizchi/luna_three" @lt,
  "mizchi/luna/core" @luna,
  "mizchi/luna/js/resource" @reactivity,
  "mizchi/signals",
}

supported_targets = "js"
```

```moonbit
let x = @reactivity.signal(0.0)
let scene = @three.Scene()
let root = @lt.mount(scene.as_object3d(), @luna.component(fn() {
  @lt.group([
    @lt.mesh(
      geometry=Box(1, 1, 1),
      material=Standard(0x49c6bb, 0.4, 0.2),
      props=[
        @lt.prop(Name("box")),
        @lt.dynamic(fn() { Position(x.get(), 0, 0) }),
      ],
    ),
    @lt.ambient_light(intensity=2),
    @lt.directional_light(props=[@lt.prop(Position(3, 5, 4))]),
  ])
}))

x.set(2.0) // Updates the existing mesh synchronously.
// Render/export scene with mizchi/three, then release this tree:
root.unmount()
```

Keep `Root` alive for as long as the scene is in use. When mounted inside a
Luna owner, owner cleanup also unmounts it. Explicit `unmount()` is idempotent.
The host owns `WebGLRenderer`, canvas size, camera selection, controls and the
animation loop. `mount(..., on_change=...)` can invalidate a host's demand loop;
it also notifies on unmount. Read `Root.error()` to diagnose invalid nodes.

## Modeling and reactivity

- `group`, `mesh`, `primitive`, `ambient_light`, `directional_light`, and
  `perspective_camera` produce native Luna virtual nodes, without allocating
  three.js resources until mounted.
- `Geometry`: `Box(width, height, depth)`, `Sphere(radius, widthSegments,
  heightSegments)`, `Plane(width, height)`, `Cylinder(topRadius, bottomRadius,
  height, radialSegments)`, `Cone(radius, height, radialSegments)`,
  `Torus(radius, tube, radialSegments, tubularSegments)`, or `Borrowed(geometry)`.
- `Material`: `Basic(color)`, `Standard(color, roughness, metalness)`, `Normal`,
  or `Borrowed(material)`. Colors are RGB integers, rotations are radians.
- `prop(Property)` is static; `dynamic(() -> Property)` tracks signals.
  Properties include transforms, name, visibility, shadow flags, geometry,
  material, light color/intensity, and perspective camera parameters.
  Later properties override earlier properties in the same slot. This allows
  a dynamic `Geometry(...)` or `Material(...)` to override a mesh's initial spec.
- Components run once per mount. Put reactive values inside `dynamic` getters
  or Luna control nodes. Updating a property preserves its Object3D; material
  values update in place when the material kind is unchanged. Geometry changes
  construct a replacement. Removed properties restore their original values.
- Luna `fragment`, `component`, `show`, `for_each`, and `switch_` are supported.
  Fragments and control nodes do not insert extra Object3D groups.
  `show` retains its child while true and cleans its scope when false.
  `switch_` retains the selected branch until the selected case changes.
- Use `key="stable-id"` on elements returned by `for_each`. Keys are scoped to
  siblings. Reordering retains matching element objects and resources; unkeyed
  elements match by position and kind. Cached virtual nodes retain their scopes;
  newly returned component/control nodes mount new scopes.
  `Key` and a primitive's `Object` must be static: change them
  by returning a new node from a list.
- A property update reapplies only changed values. Host animation may mutate
  other properties without unrelated signal updates resetting the animation.

An example of a reactive list:

```moonbit
@luna.for_each(fn() {
  items.get().map(fn(id) {
    @lt.mesh(
      key=id,
      geometry=Sphere(0.5, 24, 16),
      material=Basic(0xffb86b),
      props=[@lt.prop(Name(id))],
    )
  })
})
```

## Ownership and diagnostics

Geometry and materials constructed from specs are disposed when replaced or
unmounted. Borrowed geometry/materials and `primitive` objects remain
caller-owned, including their pre-existing children and resources. Only
declaratively mounted children of a primitive are detached during cleanup.
Other host children in a container remain intact.

For loaded GLTF, custom geometry, CSG results, textures, shader materials or
other three.js types, use `primitive(object)` or `Borrowed(resource)` and
release those resources in their owner's lifecycle. Sharing one Object3D still
means reparenting it; clone when multiple instances are needed. An object may
occupy only one slot in a root and cannot contain the mount container. Do not
share the same Object3D between independently mounted roots.

`Root.error()` reports unsupported nodes, mismatched properties, dynamic keys,
duplicate sibling keys and invalid primitive ownership. Invalid property/list
updates preserve the last valid state and recover when corrected. Invalid
initial elements have no scene object. Low-level `@luna.h` attribute names are
ignored: each typed `Property` determines its slot.

This initial renderer does not implement DOM/HTML nodes, text, events/actions,
async/Suspense nodes, error boundaries, R3F hooks, raycast pointer events,
portals, automatic canvas creation, or arbitrary string-based three.js props.
These are reported as unsupported where represented by Luna nodes/attributes.
Use the host's render loop and three.js raycaster for animation and interaction.

## Development

```sh
just test-luna-three
just test-luna-three-browser
just mouse
# http://127.0.0.1:4173/luna-three.html
just build-mouse
# _build/mouse-site/luna-three.html
```

The [sculpture example](../examples/viewer/src/luna_three/main.mbt) demonstrates
keyed parametric meshes, dynamic geometry/materials, conditional mounting and
cleanup. The Playwright test exercises real WebGL drawing, controls and GPU
resource release.

`api.mbt` defines the typed contract; `pkg.generated.mbti` is regenerated with
`moon info --target js`. `renderer.mbt` manages Luna scopes and reconciliation,
`state.mbt` holds mounted state and ordering, `properties.mbt` applies property
diffs, and `resources.mbt` constructs/disposes three.js resources. These use the
root library's generated bindings; the small ordering bridge accounts for
Object3D's lack of a public insert-before method.

## Packaging

Run `just package` from the repository root. It creates and validates both module
archives in `_build/publish/` without publishing them. Packaging policy uses
`.moonignore`; no deprecated manifest fields are needed.

MoonBit inherits parent ignore rules inside a Git repository. Since the parent
excludes `luna-three/`, directly running `moon package` or `moon publish` from
this directory can produce an empty archive. The
[packaging script](../scripts/package.mjs) copies this module to a temporary
directory outside Git, keeping the actual local three dependency through a
temporary workspace. It verifies required archive files and removes the temporary
directory on success or failure, without editing source files or Git settings.

For publication, extract `mizchi-luna_three-<version>.zip` outside this repository
and run `moon publish` from that directory after the three dependency is released.
