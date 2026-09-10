# Three.js viewer and examples

[Live demo on GitHub Pages](https://mizchi.github.io/three-mbt/).

This workspace member contains the browser demo and executable integration
examples for `mizchi/three`. Its MoonBit module is `mizchi/three-viewer`;
[`../../moon.work`](../../moon.work) resolves the library dependency locally.

Run these commands from the repository root:

```sh
just install
just mouse          # http://127.0.0.1:4173
just mouse 8080     # Choose another port
just cat            # http://127.0.0.1:4173/cat.html
just build-mouse    # Static site in _build/mouse-site/
just test-browser   # Build workspace members and run all browser tests
```

Open `/luna-three.html` for the declarative Luna sculpture example. Ring count,
radius, palette and visibility use Luna signals and `mizchi/luna_three`.
[`src/luna_three/main.mbt`](src/luna_three/main.mbt) contains the model;
[`web/luna-three.js`](web/luna-three.js) owns the canvas, camera and controls.
`just test-luna-three-browser` verifies scene updates and GPU resource cleanup.
The static build includes the character viewer, the sculpture, and the cat.

Open `/cat.html` for **ひなたの、ねこ。**, a sitting low-poly cat made of Luna
nodes. Choose ginger, gray or cream fur; tilt its head, move its curled tail,
pause blinking and motion, inspect the wireframe, or export the current pose as
`low-poly-cat.glb`. The exported file contains the cat without the studio.
Export bakes face normals into a separate snapshot, preserving the faceted
appearance in GLTF viewers even though glTF has no `flatShading` material flag.

[`src/cat/model.mbt`](src/cat/model.mbt) exports `@cat.view(...)`, a reusable
component with reactive getters for head tilt, tail angle (radians), eye openness
(0..1), and palette (0..2). It shares flat-shaded icosahedra and materials, owns
them within the Luna component's scope, and releases them on unmount. Custom
triangular ears and a pentagonal curved tail live in
[`src/cat/geometry.mbt`](src/cat/geometry.mbt). The model uses fewer than 2,000
triangles and needs no textures or external assets.

[`src/cat_viewer/main.mbt`](src/cat_viewer/main.mbt) manages signals, blinking,
tail animation and studio nodes; [`web/cat.js`](web/cat.js) manages the canvas,
camera, controls and GLB download. `just test-cat` checks geometry, landmarks and
reactivity; `just test-cat-browser` checks WebGL, controls, exported nodes,
shared-resource cleanup and the phone layout.

`just mouse` performs an initial MoonBit build, then runs Vite with
`vite-plugin-moonbit`. MoonBit edits rebuild and
reload automatically; the browser imports `mbt:mizchi/three-viewer/mouse` through
[`web/models.js`](web/models.js), without hard-coding generated file paths.
The default character is the MoonBit rabbit; use the picker to switch to the
mouse or the purple mascot. All three support drag, wheel, pinch, keyboard
navigation, wireframe inspection, and GLB download. `?model=mouse` opens the mouse
directly; `?model=purple` opens the reference-inspired purple mascot.

The pinned `vite-plugin-moonbit@0.5.1` has a small pnpm patch to recognize the
current MoonBit watcher's `Success, waiting for filesystem changes` message.
This triggers browser updates after successful builds. `hmr.spec.mjs` verifies
two successive dependency edits in an isolated MoonBit workspace.

- [`src/mouse/model.mbt`](src/mouse/model.mbt): procedural character geometry.
- [`src/rabbit/model.mbt`](src/rabbit/model.mbt): MoonBit rabbit with thick,
  octagonal ear sections swept backward and then curled forward,
  and a white visor; the `01` and `<>` marks are actual geometry.
- [`src/parts/`](src/parts): shared shape helpers and resource disposal.
- [`src/purple/`](src/purple): smooth purple mascot with sideways drooping ears
  and a geometric smile. `field.mbt` defines blended ellipsoids, `surface.mbt`
  builds a closed indexed skin with marching tetrahedra, and `model.mbt` bends
  subdivided facial geometry onto the head. The exported body is one connected
  mesh; facial markings are separate relief meshes. No textures are needed.
- [`src/mouse/viewer.mbt`](src/mouse/viewer.mbt): rendering, controls, and export.
- [`web/`](web): HTML, CSS, and browser lifecycle glue.
- [`vite.config.mjs`](vite.config.mjs): development and static build configuration.
- [`src/`](src): other executable examples used by the browser tests.
- [`tests/browser/`](tests/browser): Playwright tests; shared test assets remain
  in the repository's [`tests/fixtures/`](../../tests/fixtures).

MoonBit workspace builds emit example ESM modules under
`_build/js/release/build/mizchi/three-viewer/<package>/<package>.js`.
The library's source directory contains no example packages.

The rabbit uses native `Group` and `Mesh` constructors, `..` setters, and
`add_children([...])` to assemble its parts. Ear coordinates use non-mutating
vector arithmetic. The shared `part` and `ellipsoid_node` helpers return
unattached `Mesh` values; conversion to `Object3D` happens at attachment.
`add_part` and `ellipsoid` are convenience helpers for attaching to an existing
parent, used by the mouse example.

`part` creates a material but shares its input geometry without cloning it.
`ellipsoid_node` creates both resources. Each model supplies dedicated resources
for every mesh, allowing `parts.dispose` to release them. That helper does not
deduplicate shared resources or detach the model from its parent.

To use the rabbit inside another workspace example, import
`"mizchi/three-viewer/rabbit"` and `"mizchi/three-viewer/parts"` in `moon.pkg`:

```moonbit
let model = @rabbit.create()
scene.add(model) |> ignore
// When the scene no longer needs the model:
scene.remove(model) |> ignore
@parts.dispose(model)
```

For a model used entirely within one function, register `defer @parts.dispose(model)`
after creation. This also applies to an async function that waits for GLB export;
`export_model` in `src/mouse/viewer.mbt` already follows this pattern. If the model
is attached to a longer-lived scene, detach it before the deferred disposal runs.
For resources shared across meshes, register one `defer resource.dispose()` per
owned geometry or material instead of combining it with `parts.dispose`.

The interactive viewer returns from its creation function before rendering ends,
so its resources are released by `dispose(viewer)` during browser teardown.

The [`src/react_three_fiber`](src/react_three_fiber) executable exports a native
React `app(asset_url)` element: a rotating, clickable box and a Suspense-loaded
GLB. Mount it using React DOM `createRoot(container).render(app(url))` in a
container with an explicit height. The browser test builds and mounts this
example independently of the imperative character viewer.
