# three-mbt

Typed three.js bindings for MoonBit's JavaScript target, published as `mizchi/three`.
Covers math, scene graphs, WebGL rendering, modeling, GLB/glTF loading and export, and animation.
Constructors are defined as `Type::Type` and called as `@three.Type(...)`.

[Live character demo](https://mizchi.github.io/three-mbt/) ·
[Installation](#installation) · [Examples](examples/viewer) · [MIT license](LICENSE)

## Installation

Add the MoonBit package to your project:

```sh
moon add mizchi/three@0.1.0
```

The Mooncakes archive includes the JavaScript companion under `js/`, together
with its `package.json`. Register that installed directory as a local dependency
and install three.js:

```sh
# Run from the consuming MoonBit module's root, after moon add:
pnpm add three@0.185.1 @mizchi/three-mbt@link:./.mooncakes/mizchi/three/js
```

Add `"mizchi/three"` to your package's `moon.pkg` imports and build with
`moon build --target js`. Browser applications need a bundler such as Vite to
resolve the JavaScript imports. See [FFI and module resolution](#ffi-and-module-resolution)
for details and [Getting started](#getting-started) to develop this repository.

Both the MoonBit bindings and their JavaScript support are distributed by
`moon publish`; no companion npm release or repository checkout is required.
The local link resolves the existing `#module("@mizchi/three-mbt/...")` imports
and follows the companion installed by MoonBit. three.js itself and build tools
such as `vite-plugin-moonbit` remain npm dependencies.

Commit your MoonBit and pnpm manifests and lockfiles. On a fresh checkout or in
CI, restore MoonBit dependencies before installing the local JavaScript link:

```sh
moon update
moon build --target js --release
pnpm install --frozen-lockfile
pnpm exec vite build
```

The link above assumes a standalone module. In a workspace, use the actual
`.mooncakes/mizchi/three/js` path relative to the consuming `package.json`.
For a local library workspace member, link to that member's `js/` directory.

## API coverage

| Area | Supported types |
| --- | --- |
| Math | `Vector2/3/4`, `Euler`, `Quaternion`, `Matrix2/3/4`, `Color`, `ColorHSL`, `Box2/3`, `Line3`, `Triangle`, `Sphere`, `Plane`, `Ray`, `Frustum`, `Spherical`, `Cylindrical`, `SphericalHarmonics3` |
| Scene graph | `Object3D`, `Group`, `Scene`, `Layers`, `UserData`, `EventSubscription`, `LOD` |
| Cameras | `Camera`, `PerspectiveCamera`, `OrthographicCamera`, `CubeCamera`, `ArrayCamera`, `StereoCamera`, `CameraView` |
| Geometry | `BufferGeometry`, `BufferAttribute`, and the `Box`, `Plane`, `Sphere`, `Cylinder`, `Cone`, `Torus`, `TorusKnot`, `Circle`, `Ring`, `Icosahedron`, `Capsule`, `Edges`, `Wireframe`, `Polyhedron`, `Tetrahedron`, `Octahedron`, `Dodecahedron` Geometry classes |
| Materials | `MeshBasic/Standard/Physical/Phong/Lambert/Normal/Toon/Matcap/Depth/DistanceMaterial`, `ShadowMaterial`, `LineBasicMaterial`, `LineDashedMaterial`, `PointsMaterial`, `SpriteMaterial`, `ShaderMaterial`, `RawShaderMaterial`, `Uniforms` |
| Objects | `Mesh`, `SkinnedMesh`, `Bone`, `Skeleton`, `InstancedMesh`, `BatchedMesh`, `Line2`, `LineGeometry`, `LineMaterial`, `Line`, `LineSegments`, `LineLoop`, `Points`, `Sprite` |
| Lights and environment | `AmbientLight`, `DirectionalLight`, `PointLight`, `SpotLight`, `HemisphereLight`, `RectAreaLight`, `LightProbe`, `LightShadow`, `Fog`, `FogExp2`, `PMREMGenerator` |
| Textures and rendering | `Texture`, `DataTexture`, `CanvasTexture`, `CubeTexture`, `DepthTexture`, `Data3DTexture`, `DataArrayTexture`, `Video`, `VideoTexture`, `WebGLRenderer`, `WebGLRenderTarget`, `WebGLCubeRenderTarget`, `RendererInfo`, `RendererCapabilities`, `Canvas` |
| Loaders | `ObjectLoader`, `BufferGeometryLoader`, `MaterialLoader`, `AnimationLoader`, `FileLoader`, `Loader`, `RequestHeaders`, `TextureDictionary`, `GLTFLoader`, `GLTF`, `TextureLoader`, `CubeTextureLoader`, `HDRLoader`, `EXRLoader`, `LoadingManager`, `DRACOLoader`, `KTX2Loader`, Meshopt decoder integration |
| Animation | `AnimationMixer`, `AnimationClip`, `AnimationAction`, `Number/Vector/Quaternion/Color/Boolean/StringKeyframeTrack`, `AnimationObjectGroup`, `clone_skinned` |
| Controls and helpers | `Raycaster`, `Intersection`, `OrbitControls`, `MapControls`, `TransformControls`, `PointerLockControls`, `Timer`, `Axes/Grid/Box/CameraHelper`, `ArrowHelper`, `SkeletonHelper`, `Box3Helper`, `PlaneHelper`, light helpers |
| Post-processing | `EffectComposer`, `Pass`, `RenderPass`, `OutputPass`, `UnrealBloomPass`, `OutlinePass` |
| Dynamic geometry | `PackedBufferAttribute`, signed/unsigned integer and half-float buffer attributes, `InstancedInterleavedBuffer`, `InstancedBufferGeometry`, `InstancedBufferAttribute`, `InterleavedBuffer`, `InterleavedBufferAttribute`, geometry merge/weld utilities |
| Curves and shapes | `Curve2/3`, `CurvePath2/3`, Line / Quadratic / Cubic Bezier curves, `CatmullRomCurve3`, `SplineCurve`, `EllipseCurve`, `Path`, `Shape`, `ShapeGeometry`, `ExtrudeGeometry`, `TubeGeometry`, `LatheGeometry` |
| Utilities | `MathUtils`, `ShapeUtils`, `DataUtils`, `AnimationUtils`, static quaternion and triangle operations |
| Interpolation | `Interpolant`, `LinearInterpolant`, `DiscreteInterpolant`, `CubicInterpolant`, `QuaternionLinearInterpolant`, `BezierInterpolant` |
| Modeling | `ShapePath`, `ArcCurve`, `ParametricGeometry`, `ConvexGeometry`, `RoundedBoxGeometry`, `LoftGeometry`, `LoftOptions`, `TessellateModifier`, `SimplifyModifier`, `EdgeSplitModifier`, `Face`, `FrenetFrames`, MikkTSpace tangent generation, `NURBSCurve`, `NURBSSurface`, `NURBSVolume`, `NURBSUtils`, `ImprovedNoise`, `SimplexNoise`, `Flow`, `InstancedFlow`, `DecalGeometry`, `UVGenerator` |
| Mesh editing foundation | `MeshTopology`, `MeshSelection`, `MeshVertexId`, `MeshEdgeId`, `MeshFaceId`, adjacency and boundary diagnostics, seam-aware selection transforms, region extrusion, shared-edge splitting, convex edge bevels, `SceneUtils` batch extraction and expansion |
| Solid modeling | `CSG`: union, difference, and intersection of closed geometry or transformed meshes, backed by Manifold WASM |
| Profiles and editing | `SVGLoader`, `SVGResult`, `StrokeStyle`, `FontLoader`, `Font`, `TextGeometry`, `SelectionBox`, `SelectionHelper`, `VertexNormalsHelper`, `VertexTangentsHelper` |
| Placement and baking | `OBB`, `Octree`, `Capsule`, `ConvexHull`, `HullFace`, typed collision results, `MeshSurfaceSampler`, `bake_flow_geometry`, `bake_flow_instance_geometry`, `bake_mesh_geometry`, `bake_mesh_hierarchy` |
| Export and mesh interchange | `GLTFExporter`, `GLTFExportOptions`, `OBJExporter`, `OBJMTLExporter`, `TexturePaths`, `STLExporter`, `OBJLoader`, `MTLLoader`, `MTLMaterialCreator`, `STLLoader`, `PLYLoader`, `PLYExporter`, `ThreeMFLoader`, `USDLoader`, `USDZExporter`, `DRACOExporter`, `ExportError` |
| Shader and texture editing | `ShaderDefines`, `ShaderProgram`, `RenderContext`, `Source`, `TextureMipLevel`, render callbacks, RGBA partial updates and manual mipmaps |

The bindings cover common operations on the main classes, not the entire three.js API.
WebGPU/TSL, audio, and XR are outside the current scope.
glTF plugins expose typed hooks and selected parser/writer operations.
See [`src/pkg.generated.mbti`](src/pkg.generated.mbti) for the public API.

## Type definition audit

[`docs/type-audit.md`](docs/type-audit.md) lists coverage and remaining members by class.
The machine-readable report includes declaration signatures, source locations, overloads,
merged material property interfaces, excluded classes, and an inventory of other exported contracts.
Run `just audit-api` after changing the binding contract or type definitions.
`just check` verifies that both the bindings and the audit are reproducible.

“Mapped” means that at least one typed MoonBit facade exists for a member name. It does
not mean every overload, optional parameter, or property setter is supported. Inherited
methods are counted on the declaring class; concrete subclasses also list their inherited
constructors. Explicit typed facades are counted against their upstream contract. Removed math methods still present in the
`.d.ts` files are marked unavailable. WebGPU/TSL, audio/XR, and addons without imports or existing facades remain
outside the class coverage scope. Namespace functions have a separate count.

The runtime takes precedence where the type definitions disagree: for example,
`Ray::distance_to_plane()` returns `Double?` for missed intersections. A base
`KeyframeTrack::number_values()` returns an optional numeric snapshot because string
and boolean tracks also inherit that class; concrete tracks provide typed `values()`.
Array conversion methods use `FixedArray[Double]`, with explicit offsets for `from_array`
and `to_array_into`. Allocate enough elements for the operation and offset. Snapshot
getters copy array containers; elements such as vectors remain live three.js references.

## Getting started

Requires MoonBit (tested with `moonc v0.10.10` / `moon 0.1.20260824`), Node.js 24 or later, pnpm, and just.
Uses three.js `0.185.1`; the API audit is pinned to `@types/three` `0.185.4`.

The repository is a MoonBit workspace defined by [`moon.work`](moon.work).
The root module is the library `mizchi/three`. The separate
[`examples/viewer`](examples/viewer) module, `mizchi/three-viewer`, depends on
the local library through the workspace. Run the commands below from the
repository root.

`.moonignore` excludes the viewer module and `moon.work` from the library archive.
Use `moon package --list` to inspect the archive without publishing it.

```text
moon.work
moon.mod                       # mizchi/three
src/                           # Library and library tests
bindings/                      # Binding contracts
js/                            # JavaScript runtime support
examples/viewer/
  moon.mod                     # mizchi/three-viewer
  src/                         # MoonBit example packages, including mouse/ and rabbit/
  web/                         # Character demo HTML, CSS, and browser host
  vite.config.mjs              # vite-plugin-moonbit workspace integration
  tests/browser/               # Playwright integration tests
```

```sh
just install
just test
just example
# world position: 12, 4, 6

# Run all checks, including browser tests
pnpm exec playwright install chromium
just ci
```

`just test` runs MoonBit tests against real three.js in Node.js.
`just test-release` checks optimized output.
`just test-scripts` tests the type audit and checks forwarding contracts against the pinned runtime.
`just test-browser` runs ESM output in Node.js and Playwright's Chromium.
Math, scene graphs, and GLB parsing without textures are tested in Node.js.
URL loaders, image decoding, WebGLRenderer, and OrbitControls assume a browser environment.
URL loading in Node.js requires host polyfills such as `ProgressEvent`, which three.js expects.

## Low-poly character demos

[Open the live demo](https://mizchi.github.io/three-mbt/).

The default model is the MoonBit rabbit. [Open the mouse directly](https://mizchi.github.io/three-mbt/?model=mouse).
The [Pages workflow](.github/workflows/pages.yml) builds and deploys the viewer
on every push to `main`; it can also be run manually from GitHub Actions.

Explore the MoonBit rabbit and a small procedural mouse in your browser:

```sh
just install
just mouse
# Open http://127.0.0.1:4173 (or use: just mouse 8080)
```

Choose Moon rabbit or Little mouse, drag to orbit, scroll or pinch to zoom,
switch to wireframe, or download the selected character
as a GLB. With the canvas focused, use arrow keys to rotate, `+` / `-` to zoom,
and `R` to reset the camera. The export contains the character and its materials;
the studio floor and lights are excluded.

[`model.mbt`](examples/viewer/src/mouse/model.mbt) builds the mouse from scaled
icosahedrons, a cone, cylindrical whiskers, and a tapered loft following a
Catmull–Rom curve. [`viewer.mbt`](examples/viewer/src/mouse/viewer.mbt) sets up the lights,
shadows, camera, orbit controls, and GLB exporter. The small
[`browser host`](examples/viewer/web/main.js) handles DOM events, resizing, downloads,
and resource cleanup. No external models or textures are used.

[`rabbit/model.mbt`](examples/viewer/src/rabbit/model.mbt) creates a low-poly
interpretation of the MoonBit character: a magenta body, thick ears that rise
backward and curl forward, and a white
visor with geometric `01` / `<>` markings. The rabbit is a reusable MoonBit
package: `@rabbit.create()` returns an independent `Object3D` without a renderer
or DOM. The example's [`parts`](examples/viewer/src/parts) package supplies shared
mesh helpers and resource disposal.

The dev server uses [`vite-plugin-moonbit`](https://github.com/mizchi/vite-plugin-moonbit).
[`web/models.js`](examples/viewer/web/models.js) imports the executable package as
`mbt:mizchi/three-viewer/mouse`. The plugin watches the workspace and reloads the
page when MoonBit output changes; HTML, CSS, and JavaScript use Vite's normal
development workflow. `just build-mouse` produces a
self-contained static site in `_build/mouse-site/`, which can be served by any
static HTTP server. To run just this demo's browser tests:

```sh
just build
pnpm exec playwright install chromium
pnpm exec playwright test --config examples/viewer/playwright.config.mjs mouse.spec.mjs rabbit.spec.mjs
```

## Usage

Import the package in `moon.pkg`:

```moonbit
import {
  "mizchi/three",
}

supported_targets = "js"
```

```moonbit
let scene = @three.Scene()
let group = @three.Group().as_object3d()
let child = @three.Object3D()

group.position().set(10, 0, 0) |> ignore
group.scale().set(2, 2, 2) |> ignore
child.position().set(1, 2, 3) |> ignore
scene.as_object3d().add(group) |> ignore
group.add(child) |> ignore

let position = child.get_world_position(@three.Vector3(0, 0, 0))
// position = (12, 4, 6)
```

A runnable example is available in [`examples/viewer/src/scene_graph`](examples/viewer/src/scene_graph).

### Call syntax and reference semantics

Frequently used inherited operations can be called directly on concrete types:

```moonbit
let geometry = @three.BoxGeometry(1, 1, 1)
let material = @three.MeshStandardMaterial(
  0xaaaaaa, roughness=0.85, metalness=0, flat_shading=true,
)
let mesh = @three.Mesh(geometry.as_buffer_geometry(), material.as_material())
mesh.position().set(0, 1, 0) |> ignore
mesh.set_cast_shadow(true)
material.set_opacity(0.8)
geometry.dispose()
material.dispose()
```

`MeshStandardMaterial` and `MeshPhysicalMaterial` use named optional `roughness`,
`metalness`, and `flat_shading` arguments with native defaults of `1`, `0`, and
`false`. Migrate positional calls such as `(color, 0.4, 0.2)` to
`(color, roughness=0.4, metalness=0.2)`.
`CatmullRomCurve3` takes named optional `closed`, `curve_type`, and `tension`
arguments. `LoftOptions(cap_start=true, cap_end=true)` initializes the existing
mutable options object directly; its setters remain available.

`Curve2` / `Curve3` methods `get_point`, `get_point_at`, `get_tangent`, and `get_tangent_at` accept an
optional named `target`. For example, `curve.get_point(0.5)` allocates a fresh
target each call; `curve.get_point(0.5, target=buffer)` passes the supplied vector
to the native method. Existing positional target arguments must become named.

These conveniences retain the native operations and return values. Transform
getters such as `mesh.position()` return live references; mutating them updates
the original object. Use `clone()` for an independent value. Mutators continue
to return the native receiver where applicable, so standalone calls still use
`|> ignore`. Explicit `as_*()` upcasts remain necessary at parameters requiring
a base type and preserve identity without allocating a wrapper.

## Loading and rendering GLB / glTF

`load()` is a MoonBit `async` function that automatically detects GLB and glTF.
three.js resolves relative URLs for external `.bin` files and images.
Use `parse_glb(bytes, path=...)` or `parse_gltf(json, path=...)` to parse data in memory.
Failures raise `LoadError(String)`, which you can handle with `try` / `catch`.

```moonbit
async fn add_model(
  scene : @three.Scene,
  url : String,
) -> @three.AnimationMixer raise @three.LoadError {
  let model = @three.GLTFLoader().load(url)
  let root = match model.scene() {
    Some(group) => group.as_object3d()
    None => raise @three.LoadError("The model has no scene")
  }
  scene.as_object3d().add(root) |> ignore
  let mixer = @three.AnimationMixer(root)
  for clip in model.animations() {
    mixer.clip_action(clip).play() |> ignore
  }
  mixer
}
```

`GLTF::scene()` returns `Group?` because scenes are optional in glTF.
`scenes()`, `animations()`, and `cameras()` return typed arrays.
After loading, use `Object3D::as_mesh()` / `as_skinned_mesh()` to check node types.
`materials()` returns an array for both single-material and multi-material meshes.

`load_async()` returns `@js_async.Promise[GLTF]` for JavaScript interop.
The MoonBit-facing `load()` / `parse_*()` functions use `moonbitlang/async/js_async`.
Use `LoadingManager::abort()` to abort requests that support the manager’s abort signal,
or `FileLoader::abort()` for its pending fetches. This does not cancel decoder work
or guarantee cancellation for loaders that do not support abort signals.

```moonbit
// Rendering loop after storing the result of add_model() in mixer
let renderer = @three.WebGLRenderer(antialias=true)
renderer.set_size(800, 600)
renderer.dom_element().append_to_body()
let camera = @three.PerspectiveCamera(60, 800.0 / 600.0, 0.1, 1000)
camera.as_object3d().position().set(0, 1, 5) |> ignore
let controls = @three.OrbitControls(camera.as_camera(), renderer.dom_element())
let timer = @three.Timer()
renderer.set_animation_loop(fn(time_ms) {
  timer.update(time_ms) |> ignore
  let delta = timer.get_delta()
  mixer.update(delta) |> ignore
  controls.update(delta) |> ignore
  renderer.render(scene, camera.as_camera())
})
```

The ESM example in [`examples/viewer/src/model_viewer`](examples/viewer/src/model_viewer) loads and renders models.
After `just build`, `model_viewer.js` exports `load_model(url)`, `render_model(url)`,
`render_triangle()`, and `load_texture(url)`.
Playwright tests render loaded models to a render target and check the resulting pixels.

Configure decoders before loading compressed models:

```moonbit
let loader = @three.GLTFLoader()
let draco = @three.DRACOLoader().set_decoder_path("/draco/")
loader.set_draco_loader(draco).enable_meshopt() |> ignore
let ktx2 = @three.KTX2Loader().set_transcoder_path("/basis/")
ktx2.detect_support(renderer) |> ignore
loader.set_ktx2_loader(ktx2) |> ignore
```

Your application must serve the Draco / Basis JavaScript and Wasm files.
Meshopt uses the decoder bundled with the installed three.js package.
Browser tests decode and render original Draco / Meshopt compressed triangle GLBs and a GLB
with an embedded Basis UASTC KTX2 texture. They load the actual Wasm decoders from the installed
three.js package and also verify rejection when a required decoder is missing.
See [`tests/fixtures/README.md`](tests/fixtures/README.md) for fixture generation and texture attribution.

## Three.js JSON and file loaders

`Object3D`, geometry, material, texture, animation, and several math types provide
`to_json()` and `to_json_string()`, raising `SerializationError` when serialization fails.
These methods use three.js's JSON format. Update object matrices before serialization
when transforms have changed.

```moonbit
root.update_matrix_world(true)
let json = root.to_json()
// Async: waits for referenced images to finish loading.
let restored = @three.ObjectLoader().parse_json(json)
```

`ObjectLoader::load(url)` and `parse_json()` / `parse_json_string()` are asynchronous.
`BufferGeometryLoader`, `MaterialLoader`, and `AnimationLoader` offer asynchronous
`load(url)` and synchronous `parse_json()` / `parse_json_string()`.
Parsing and network failures raise `LoadError`. `MaterialLoader::set_textures()` accepts
a `TextureDictionary` keyed by texture UUID to resolve references in material JSON.
`BufferGeometryLoader` reads buffer data; use `ObjectLoader` for JSON containing
parametric geometries such as `BoxGeometry`.

All provided loaders have `as_loader()` for path, resource path, manager, credentials,
and request headers. `RequestHeaders` holds string values. A manager's
`add_handler(pattern, flags, loader)` returns a `LoadingHandler` whose `remove()`
unregisters that exact regular expression; invalid expressions raise `LoadError`.

```moonbit
let loader = @three.FileLoader()
let headers = @three.RequestHeaders()
headers.set("X-Asset-Version", "v1")
loader.as_loader().set_request_header(headers) |> ignore
let bytes = loader.load_bytes("/models/triangle.glb")
let gltf = @three.GLTFLoader().parse_glb(bytes, path="/models/")
```

`FileLoader::load_text`, `load_bytes`, and `load_json` select the response type and
validate it before crossing the FFI. Three.js coalesces requests by URL and may share
cached responses; simultaneous requests for the same URL with different response types
can therefore reject with `LoadError`. `abort()` rejects pending fetches and allows
subsequent requests. Browser integration examples are in [`examples/viewer/src/loading`](examples/viewer/src/loading).

## Interpolation and buffer storage

Numeric interpolants copy input arrays into typed buffers. `evaluate(t)` returns a
snapshot so later evaluations do not overwrite earlier results.

```moonbit
let interpolant = @three.LinearInterpolant([0, 1, 2], [0, 10, 20], 1).as_interpolant()
let midpoint = interpolant.evaluate(0.5) // [5]
```

`CubicInterpolant::set_endings()` takes `InterpolationEnding` values.
`BezierInterpolant::set_tangents()` accepts in/out `(time, value)` pairs for each
keyframe component. `KeyframeTrack::create_numeric_interpolant()` uses the selected
interpolation mode and returns `None` for string or boolean tracks.
Sample arrays must match the number of parameter positions and component size;
Quaternion interpolation uses groups of four components.

`BufferAttribute` exposes operations shared by packed and interleaved attributes.
Use `as_packed()` to obtain `PackedBufferAttribute?` for raw storage, copy/set,
GPU type, upload callbacks, and disposal. It returns `None` for interleaved attributes.
Typed constructors such as `Uint8BufferAttribute()` also offer a direct
`as_packed_buffer_attribute()` conversion. `raw_values()` returns encoded storage,
while component accessors account for normalization.

`Float16BufferAttribute()` takes encoded half-float bits; `from_floats()` converts
ordinary numbers. Use `get_x/y/z/w` and `set_x/y/z/w` for decoded half-float components.
Cloning an `InterleavedBuffer` or `InterleavedBufferAttribute` preserves interleaving
and copies its backing buffer. Existing `as_buffer_attribute()` views stay live.

## Morph targets

Use `Mesh` to access morph targets in a GLB by name or index.

```moonbit
let mesh = root.get_object_by_name("Face").unwrap().as_mesh().unwrap()
let applied = mesh.set_morph_weight("Smile", 0.75)
let names = mesh.morph_target_names()
let weights = mesh.morph_target_influences()
```

Setters return `false` for missing names or out-of-range indices; getters return `None`.
Weights are passed to three.js without clamping, including negative values. Array getters return snapshots.
For custom geometry, use `set_morph_attributes("position", attributes)` and
`set_morph_targets_relative(true)`. If you change attributes after creating the mesh,
call `update_morph_targets()` to rebuild its dictionary and weights. This resets existing weights.
Create new geometry to replace morph attributes after they have been uploaded to the GPU.

## HDR / EXR and environment lighting

`HDRLoader()` / `EXRLoader()` provide `load(url)` and `parse(bytes)`, returning a `DataTexture`.
Failures raise `LoadError`. Choose the data type with
`set_data_type(Float)` / `set_data_type(HalfFloat)`.
`values()` returns a numeric snapshot, decoding half-float values into ordinary numbers.

```moonbit
// Inside an async function, with renderer and scene already created
let hdr = @three.HDRLoader().load("/studio.hdr")
let pmrem = @three.PMREMGenerator(renderer)
let environment = pmrem.from_equirectangular(hdr.as_texture())
scene.set_environment(Some(environment.texture()))
hdr.as_texture().dispose()
pmrem.dispose()
// When the scene is no longer needed
scene.set_environment(None)
environment.dispose()
```

`from_cubemap()` and `from_scene(scene, sigma=..., near=..., far=..., size=..., position=...)`
are also available. The generated render target owns the environment texture, so keep it alive
while the texture is in use. The default `size` for `from_scene()` is 256.
Run operations that require WebGL in a browser.
See [`examples/viewer/src/pbr`](examples/viewer/src/pbr) for an example that loads HDR data and renders with it.

## userData, events, and Layers

`user_data()` on `Object3D`, `Material`, `Texture`, and `GLTF` returns a live reference.
Read glTF node extras from the corresponding node, and asset metadata from `GLTF::asset()`.

```moonbit
let data = root.user_data()
data.set_bool("selectable", false)
let selectable = data.get_bool("selectable") // Some(false)
data.set_json("metadata", { "tags": ["character"], "priority": 0 })
```

Supports String / Bool / Int / Double / UserData / Json. Getters return `None` for missing
keys or mismatched types. `get_int()` accepts only signed 32-bit integers.
Inherited properties are ignored. `set_json()` / `get_json()` copy JSON values,
while `get_object()` returns a live reference to a nested object.

```moonbit
let subscription = mixer.on_finished(fn(action, direction) {
  action.set_paused(true)
  println(direction)
})
// Stop listening. Calling this more than once is safe.
subscription.unsubscribe()
```

Supported events include Object3D added / removed / childadded / childremoved,
AnimationMixer finished / loop, Material / BufferGeometry / Texture dispose,
and OrbitControls change / start / end.
The second argument to `on_loop()` is three.js's `loopDelta`.
Subscriptions are not automatically removed; retain the `EventSubscription` and unsubscribe when finished.

`Object3D::layers()` / `Raycaster::layers()` return the object's live Layers instance.
Use `set` / `enable` / `disable` / `toggle` and related methods to manage channels 0–31.
The binding names three.js's `Layers.test` method `intersects(other)` to avoid a MoonBit keyword.

## Cloning skinned models

```moonbit
let instance = @three.clone_skinned(root)
let mixer = @three.AnimationMixer(instance)
mixer.clip_action(clip).play() |> ignore
```

`clone_skinned()` directly imports `SkeletonUtils.clone`.
It clones bones and skeletons, then remaps the cloned meshes to those bones.
Pass a root containing all referenced bones.
Create a separate `AnimationMixer` for each instance to animate them independently.
Geometry and materials remain shared with the original. To make materials independent as well,
use `Material::clone()` with `Mesh::set_material()` / `set_materials()`.

## Standard / Physical materials

Standard materials expose normal scale/type, environment / AO / light map intensities,
bump, displacement, alpha maps, and flat shading.
Physical materials expose clearcoat, transmission / thickness / attenuation, IOR, iridescence,
sheen, specular, anisotropy, dispersion, and their corresponding maps.

```moonbit
let glass = @three.MeshPhysicalMaterial(0xffffff, roughness=0.1, metalness=0)
glass.set_transmission(1)
glass.set_thickness(0.5)
glass.set_ior(1.5)
glass.set_attenuation_distance(2)
glass.attenuation_color().set_rgb(0.8, 0.9, 1) |> ignore
glass.as_standard_material().set_env_map_intensity(1.5)
```

Use `Material::as_physical_material()` to check a loaded material; it returns `Some` only for a compatible type.
Color and vector getters return live references. The iridescence thickness range is a two-element
snapshot, and its setter takes `(minimum, maximum)`.
Map setters accept `Texture?`; pass `None` to clear a map.
Call `Material::mark_needs_update()` after changes that affect shader configuration, such as adding or removing maps.

## Rendering controls and render targets

`WebGLRenderer` supports viewport / scissor rectangles, clipping planes, shadow map types,
render statistics through `info()`, and GPU limits through `capabilities()`.
`compile_async(scene, camera)` waits for shader compilation. Both it and
`read_render_target_pixels_async(...)` are MoonBit async functions that raise `RenderError` on rejection.
Pixel reads currently accept RGBA8 targets and a `Bytes` buffer of at least `width * height * 4` bytes.
Shader compilation diagnostics still follow three.js; a resolved promise alone does not prove that a shader is valid.

```moonbit
let target = @three.WebGLRenderTarget(800, 600)
target.set_samples(4)
target.set_depth_texture(Some(@three.DepthTexture(800, 600)))
renderer.set_render_target(Some(target))
renderer.set_viewport(0, 0, 800, 600)
renderer.set_scissor(0, 0, 400, 600)
renderer.set_scissor_test(true)
renderer.render(scene, camera.as_camera())
renderer.set_render_target(None)
renderer.set_scissor_test(false)
```

Configure attachments and samples before first rendering to a target.
`WebGLRenderTarget::with_attachments(width, height, count)` creates multiple color attachments;
`textures()` returns a snapshot of their references. The target owns its attached textures.
After rendering to an MSAA target, switch targets before reading its resolved pixels.
`WebGLCubeRenderTarget(size)` provides a cube texture and `as_render_target()`;
use `set_cube_render_target(target, face, mip_level)` to select a cube face (0–5).
Dispose render targets when no longer needed.

## Controls

`MapControls(camera, canvas).as_orbit_controls()` exposes OrbitControls operations with map-style defaults.
OrbitControls also provides pan / zoom / rotation toggles and speeds, polar / azimuth angle limits,
zoom limits, and distance / angle queries.

```moonbit
let transform = @three.TransformControls(camera.as_camera(), renderer.dom_element())
scene.as_object3d().add(transform.get_helper()) |> ignore
transform.attach(object) |> ignore
transform.set_mode(Translate) // Translate / Rotate / Scale
transform.set_space(Local)   // World / Local
transform.set_translation_snap(Some(0.5))
let subscription = transform.on_dragging_changed(fn(dragging) {
  orbit.set_enabled(!dragging)
})
```

Attach the controlled object to the scene before interacting with the gizmo.
TransformControls also exposes change / object-change events and optional rotation / scale snapping.
On cleanup, unsubscribe, detach the object, remove the helper from the scene, and dispose the controls.
`PointerLockControls` provides `lock(false)`, `unlock()`, movement, direction queries, and lock / unlock events.
Request pointer lock from a user gesture such as a click. Browser permission and focus rules apply.
The control integration test uses full headless Chromium (`channel: 'chromium'`),
since Chromium's headless shell rejects Pointer Lock requests.

## Post-processing

```moonbit
let composer = @three.EffectComposer(renderer)
let render = @three.RenderPass(scene, camera.as_camera()).as_pass()
let bloom = @three.UnrealBloomPass(@three.Vector2(800, 600), 1.5, 0.4, 0.8)
let output = @three.OutputPass().as_pass()
composer.add_pass(render)
composer.add_pass(bloom.as_pass())
composer.add_pass(output)
composer.render(delta_seconds)
```

Passes expose `enabled`, `clear`, `needs_swap`, and `render_to_screen` settings through `as_pass()`.
The composer supports adding, inserting, removing, and resizing passes.
OutlinePass accepts selected objects and exposes edge colors, strength, thickness, glow, and pulse period.
Use `EffectComposer::with_render_target(renderer, target)` for a custom target; the composer takes ownership.
Set `render_to_screen` to false to use `read_buffer()` as the final output.
The default composer uses half-float targets; use an RGBA8 custom target for the current byte readback API.
Dispose each pass separately, then dispose the composer. Removing a pass does not dispose it.

## Dynamic geometry

`BufferAttribute::from_uint8`, `from_uint16`, `from_uint32`, and `from_int32` take a typed array,
item size, and normalization flag. Unsigned constructors accept `FixedArray[UInt]`;
the signed constructor accepts `FixedArray[Int]`. Values must fit the chosen storage type.
`InstancedBufferAttribute` and `InterleavedBuffer` copy their input into Float32 storage.
InterleavedBufferAttribute views share their parent buffer.

```moonbit
position.set_usage(DynamicDraw) |> ignore // Set usage before first GPU upload
position.set_xyz(0, 1, 2, 3) |> ignore
position.add_update_range(0, 3)           // Component offsets and counts, not vertices
position.mark_needs_update()
```

`StaticDraw`, `DynamicDraw`, and `StreamDraw` are available. For interleaved attributes,
usage and update ranges apply to the parent buffer. `update_ranges()` returns copied range records.
`InstancedBufferGeometry::instance_count()` uses Double to preserve three.js's default Infinity;
set a nonnegative integer value when limiting the number of instances.

`merge_geometries(geometries, use_groups)` returns `None` for empty or incompatible input.
Inputs must agree on indexing and attribute layout. three.js may log a diagnostic for incompatible input.
`merge_vertices(geometry, tolerance)` welds matching vertex attributes, preserving seams where attributes differ.
`to_creased_normals(geometry, crease_angle)` follows three.js mutation semantics: non-indexed input can be
modified in place, while indexed input is expanded. Clone first if the input must remain unchanged.

## Curves and shapes

`Curve2` and `Curve3` separate Vector2 and Vector3 sampling at the type level.
Concrete curve classes expose `as_curve2()` / `as_curve3()`; samples and tangents accept a target vector.
CurvePath2 / CurvePath3 combine curves of the matching dimension.
After editing control points or arc-length settings, call `update_arc_lengths()` before using cached lengths.

```moonbit
let shape = @three.Shape()
shape.as_path().move_to(0, 0).line_to(2, 0).line_to(2, 2).line_to(0, 2).close_path() |> ignore
let options = @three.ExtrudeOptions()
options.set_depth(0.5)
options.set_bevel_enabled(false)
let solid = @three.ExtrudeGeometry([shape], options).as_buffer_geometry()
```

Shapes accept holes through `set_holes(FixedArray[Path])`; use opposite winding for holes and outer contours.
ExtrudeOptions includes steps, curve segments, bevel dimensions / segments, and an optional Curve3 extrusion path.
`set_extrude_path(None)` removes the path. TubeGeometry takes a Curve3, while LatheGeometry takes a Vector2 profile.

## Modeling workflow

Primitive constructors expose subdivision and partial-surface options through named
constructors such as `PlaneGeometry::segmented`, `BoxGeometry::segmented`,
`SphereGeometry::section`, and `CylinderGeometry::section`. Circle, ring, and torus
constructors also support angular ranges; `TorusKnotGeometry::with_winding` takes `p` and `q`.

```moonbit
let grid = @three.PlaneGeometry::segmented(2, 2, 16, 16).as_buffer_geometry()
let position = grid.get_attribute("position").unwrap()
position.set_z(0, 0.25) |> ignore
position.mark_needs_update()
grid.compute_vertex_normals()
grid.compute_bounding_box()
grid.compute_bounding_sphere()
```

`Intersection::face()` returns an optional `Face` with vertex indices `a`, `b`, and `c`,
a face normal, and a material index. Use these indices to edit the picked mesh's position
attribute. `barycoord()`, `normal()`, and `uv1()` expose optional hit details.
Raycaster line and point thresholds are configurable in world units.

`Shape::from_points` and `Path::from_points` build profiles from Vector2 arrays.
`ShapePath::to_shapes()` classifies contours and holes by winding; `extract_points()`
returns a `ShapePoints` containing sampled outer and hole contours.
Bezier control points, ellipse parameters, and spline points can be edited directly.
After editing a child curve, update its arc lengths and those of its containing CurvePath.
`CurvePath2/3::get_point()` returns `None` for an empty path or a parameter past its end.
`compute_frenet_frames()` supplies tangents, normals, and binormals for swept surfaces.

| Operation | API |
| --- | --- |
| Beveled profile / sweep | `ExtrudeGeometry`, `ExtrudeOptions::set_extrude_path` |
| Parametric surface | `ParametricGeometry(surface, slices, stacks)`; callback writes into the supplied Vector3 |
| Convex hull | `ConvexGeometry(points)` |
| Rounded box | `RoundedBoxGeometry(width, height, depth, segments, radius)` |
| Split long triangle edges | `TessellateModifier(max_edge_length, max_iterations).modify(geometry)` |
| Reduce vertex count | `SimplifyModifier().modify(geometry, vertices_to_remove)` |
| Split vertices at sharp edges | `EdgeSplitModifier().modify(geometry, cutoff_angle, keep_normals)` |

Modifiers return new geometries and raise `ModelingError` on exceptions. Dispose the
results separately. Tessellation is limited by the iteration count. Simplification
removes morph attributes and retains only position, normal, UV, tangent, and color
attributes; it does not guarantee preservation of material groups or UV seams.
Recompute vertex normals after edge splitting when the input has no normals.

Attribute utilities include `merge_attributes`, `interleave_attributes`,
`deinterleave_attribute`, `deinterleave_geometry`, and `deep_clone_attribute`.
Merge/interleave return `None` for empty or incompatible input and reject half-float
storage. Interleaving requires matching storage types and vertex counts, with 1–4
components per attribute. `deep_clone_attribute` preserves half-float decoding.
`merge_groups`, `to_triangles_draw_mode`, and `estimate_geometry_bytes` cover group
consolidation, strip/fan conversion, and buffer memory estimation.

Async `compute_mikktspace_tangents(geometry, negate_sign)` initializes the bundled
MikkTSpace Wasm module, then modifies the geometry, removing its index if present.
It requires position, normal, and UV attributes with ordinary numeric storage; convert
half-float attributes first. Pass `true` for glTF normal-map conventions. Failures raise
`ModelingError`. `compute_morphed_attributes(mesh)` returns original position/normal
references and newly computed morphed or skinned attributes in object space.

## OBJ / STL interchange

```moonbit
// Inside a function that handles ExportError / LoadError
mesh.as_object3d().update_matrix_world(true)
let bytes = @three.STLExporter().export_binary(mesh.as_object3d())
let restored = @three.STLLoader().parse(bytes)
let obj = @three.OBJExporter().parse(mesh.as_object3d())
let group = @three.OBJLoader().parse(obj)
```

`STLExporter::export_ascii` and `STLLoader::parse_ascii` support text STL.
Both loaders provide async `load(url)` and inherited loader settings through `as_loader()`.
Exports use world transforms, so update matrices first. STL stores triangle geometry
without unit metadata; it does not preserve a scene's materials. Use `MTLLoader` and
`OBJLoader::set_materials` for material-library loading, or `OBJMTLExporter` to export both files.
Saving returned text or Bytes belongs to the application.

### OBJ with material libraries

```moonbit
// Inside a function that handles ExportError
let textures = @three.TexturePaths()
textures.set(albedo_texture, "images/albedo.png")
let bundle = @three.OBJMTLExporter().export_bundle(root, "part.mtl", textures)
let obj_text = bundle.obj()
let mtl_text = bundle.mtl()
let referenced_images = bundle.texture_paths()
```

The exporter preserves world transforms and splits material groups into separate OBJ
objects. It respects triangle-aligned draw ranges without changing source geometry or
material names. Color-based materials, opacity, shininess, diffuse/specular/emissive maps,
normal/bump maps, and alpha maps are supported. Texture repeat and offset are written to
MTL; rotated or custom texture matrices must be baked into UVs first.

Supply a path for each referenced texture. The result contains text and path references;
the application saves both files and copies or encodes their images. PBR materials are
approximated as Phong materials; inspect `warnings()` for these conversions. MTL cannot
preserve the complete Three.js material model. Bake skinning and morph targets before
exporting. This facade accepts triangle meshes; expand instanced/batched geometry first.

### 3MF, USD, USDZ, and Draco

```moonbit
// Inside an async function that handles LoadError / ExportError
let manufactured = @three.ThreeMFLoader().load("/models/part.3mf")
let options = @three.USDZExportOptions()
options.set_quick_look_compatible(true)
let archive = @three.USDZExporter().export_usdz(root, options)
let restored = @three.USDLoader().parse(archive, "/models/")

let draco = @three.DRACOExporter()
draco.load_encoder("/draco/draco_encoder.js")
let compressed = draco.export_mesh(mesh, @three.DRACOExportOptions())
```

`ThreeMFLoader::parse(Bytes)` reads in-memory 3MF archives. `USDLoader` is the current
loader for USD/USDZ; `load`, `parse`, and `parse_ascii(text, path)` wait for referenced
textures. These loaders expose inherited settings through `as_loader()`. Format and
extension support follows the pinned Three.js addons; 3MF export is not provided.

USDZ options include visibility, texture-size limits, anchoring, animation clips, and
animation frame rate. Export supports the material and animation subset of the native
USDZ exporter; it is not a lossless Three.js scene archive.

Serve a compatible Draco encoder script and its companion Wasm file. `load_encoder`
installs the script's `DracoEncoderModule` global in a browser and raises `LoadError`
on failure. Node.js hosts can install that factory themselves before exporting.
`export_mesh` and `export_points` return standalone .drc bytes in local coordinates,
without materials, node transforms, or animation. Point clouds export positions and
optional colors; mesh exports can also include normals and UVs. This does not enable
Draco compression inside `GLTFExporter`.

The wrapper copies exported attributes into packed float storage and adds explicit
indices for nonindexed meshes, avoiding native exporter layout limitations. Inputs
remain unchanged. Encode/decode speeds range from 0 to 10, quantization from 0 to 30
bits, with `SequentialEncoding` or `EdgeBreakerEncoding` methods. Bake the desired pose first.

The runnable [`modeling example`](examples/viewer/src/modeling) generates a plate with a
through-hole and beveled edges. Its ESM exports are `render_part()` and async
`export_part()`. Browser tests check the hole's pixels and validate that the exported
binary STL has a closed, consistently wound surface with positive volume.

## Additional editing and interchange APIs

The [migration example](examples/viewer/src/migration) exercises mesh editing, UBO rendering,
post-processing, texture copying, file interchange, and glTF extension hooks.

### Mesh decomposition and interpolation

```moonbit
// Inside a function that handles ModelingError
let tools = @three.SceneUtils()
let instances = tools.meshes_from_instances(instanced_mesh)
let parts = tools.meshes_from_materials(mesh)
let uv_canvas = tools.uv_debug(mesh.geometry(), 512)
uv_canvas.append_to_body()
```

Instance expansion preserves per-instance transforms, colors, and morph weights.
Geometry remains shared. Materials are shared unless instance colors require cloned
materials; dispose those clones separately. Material-group decomposition creates
independent geometries with shared materials, respects triangle-aligned draw ranges,
and preserves morph weights. It leaves source indices, groups, and attributes unchanged.
Single-material input also returns a Group. Bake skinned/batched meshes first.

These operations process one mesh, not its child nodes. The returned Group preserves
the source's local transform; attach it under the same parent to preserve placement.
`multi_material_object` creates one overlapping mesh per material, sharing geometry.
`sort_instances` sorts instance data in place with an index comparator.

`Triangle::interpolate_vector2/3/4` interpolates vertex values at a point and returns
`None` for a degenerate triangle. Static `Triangle::interpolate_attribute2/3/4` takes
three attribute indices, barycentric weights, and a target vector. Match the attribute
component count to the target vector. `uv_debug` visualizes existing UVs on a browser
canvas; it does not generate UV coordinates. Use a power-of-two canvas size.

### IK and animation retargeting

```moonbit
let link = @three.IKLink(0)
link.set_rotation_min(Some(@three.Vector3(-0.5, -0.5, -0.5)))
link.set_rotation_max(Some(@three.Vector3(0.5, 0.5, 0.5)))
let chain = @three.IKChain(2, 1, [link]) // target, effector, links
let solver = @three.CCDIKSolver(skinned_mesh, [chain])
solver.update(1) |> ignore
```

Bone indices refer to the mesh's skeleton. Links run from the effector toward the root;
the target should not be part of the chain being rotated. Update world matrices before
solving. Chain iteration count, angle limits, optional blend factor, and enabled links
are configurable. `None` for the chain blend factor uses the blend passed to `update`.
`create_helper(size)` returns a CCDIKHelper; add it to the scene and dispose it separately.

```moonbit
let options = @three.RetargetOptions()
options.map_bone("Hips", "hip") // target name -> source name
options.set_hip("hip")
options.set_fps(Some(30))
let clip = @three.SkeletonUtils().retarget_clip_from_skeleton(
  target_mesh, bvh.skeleton(), bvh.clip(), options,
)
```

`retarget_meshes` and `retarget_skeletons` transfer a current pose.
`retarget_clip_meshes` samples a source skinned mesh; `retarget_clip_from_skeleton`
accepts sources such as BVH. Clip targets are SkinnedMesh because the pinned runtime
requires `target.skeleton`, despite a broader declaration. Map each relevant bone name.
Options also cover hip influence/offset/scale, bone-position preservation, target matrices,
first-frame offsets, trim times in seconds, and a custom bone-name resolver.
Retargeting follows native pose/matrix mutations; use independent rigs when original
poses must remain untouched. The wrapper copies options before native processing.

### DCC and CAD loaders

`FBXLoader`, `ColladaLoader`, `Rhino3dmLoader`, and `BVHLoader` provide asynchronous
`load(url)` and inherited settings through `as_loader()`. FBX also accepts Bytes or
ASCII text, Collada/BVH accept text, and Rhino accepts Bytes asynchronously.
Failures raise `LoadError`. FBX/Collada texture loading follows native loader timing;
the returned graph may precede completion of external images.

ColladaResult exposes an Object3D scene and animation snapshots. BVHResult exposes a
Skeleton and AnimationClip, with loader flags for position/rotation tracks.
Rhino requires the application to serve compatible `rhino3dm.js` and `rhino3dm.wasm`;
configure `set_library_path("/rhino/")` and optionally `set_worker_limit`, then
`dispose()` to terminate workers. Browser tests generate a 3DM with rhino3dm 8.32.2.
Native Rhino loading uses available render meshes; it does not add NURBS editing to
these bindings. Likewise, each loader supports its native format subset.

### Texture file output and decompression

```moonbit
// Inside an async function that handles ExportError
let texture = @three.DataTexture::from_rgba_float([0.25, 0.5, 1, 1], 1, 1)
let exr = @three.EXRExporter().export_texture(texture, @three.EXRExportOptions())
let ktx2 = @three.KTX2Exporter().export_texture(texture)
```

EXR supports RGBA float/half-float DataTexture and render-target output. Options select
half-float or float output. It writes lossless uncompressed EXR: the pinned native ZIP
paths corrupt short or incompressible blocks, so compression is intentionally not exposed.
KTX2Exporter writes supported DataTexture/Data3DTexture storage and render targets to
KTX2 containers; it does not encode Basis/UASTC compression.

`WebGLTextureUtils().decompress(texture, max_size)` returns a readable canvas texture
from a GPU-supported compressed texture. It uses its own temporary renderer, requires a
browser, and leaves ownership of the returned texture with the caller.

### UBOs, effects, and render-target copies

`Uniform(value)` creates a floating-point uniform. Constructors such as
`Uniform::from_vector4`, `from_color`, and `from_matrix4` retain typed object references.
Typed getters return optional values. Add uniforms to `UniformsGroup().set_name(name)`,
then attach groups with `ShaderMaterial::set_uniforms_groups`. Match declaration order
and GLSL `layout(std140)` block names. Group lists are snapshots with live Uniform entries.
Keep the layout and value types stable after upload; value changes upload automatically.
Dispose groups independently of materials.

Object3D's before/after-shadow hooks receive a ShadowRenderContext with the renderer,
object, view camera, shadow camera, geometry, depth material, and optional group.
Setters replace callbacks; matching clear methods remove them.

Additional composer passes are ShaderPass, GTAOPass, SMAAPass, and BokehPass.
ShaderPass accepts a ShaderMaterial and input texture-uniform name and owns that material
for disposal. GTAO exposes typed output modes, AO settings, denoise settings, and optional
G-buffer textures. Bokeh accepts a PerspectiveCamera and exposes focus/aperture/max-blur
controls. SMAA loads its embedded lookup images asynchronously. Dispose passes separately
from the composer; place OutputPass after effects that operate in linear color space.

FramebufferTexture captures the active framebuffer with `copy_framebuffer_to_texture`.
`copy_texture` copies a full texture; `copy_texture_2d/3d` select regions, offsets, and
mip levels. Initialize render targets before copying their textures. WebGL3DRenderTarget
and WebGLArrayRenderTarget expose typed textures and depth; renderer setters select the
destination slice/layer and mip level. Match formats and storage types for GPU copies.

### glTF extension hooks

```moonbit
let registration = exporter.register(fn(writer) {
  let plugin = @three.GLTFExporterPlugin()
  plugin.set_write_node(fn(_node, definition) {
    definition.as_user_data().set_json(
      "extensions", { "EXT_example": { "tag": "editable" } },
    )
    writer.mark_extension("EXT_example", false)
  })
  plugin
})
// After the relevant exports have finished:
registration.unregister()
```

Register factories on GLTFLoader/GLTFExporter; each parse creates a plugin from its
parser/writer. Returned registration handles preserve callback identity and support
idempotent `unregister()`. The owner's unregister method also checks handle ownership.
Removing a registration affects future operations, not already-created plugins.

Loader plugins support before/after-root hooks (sync or Promise), plus filtered async
overrides for nodes, meshes, materials, textures, buffer views, and node attachments.
The predicate returns false to fall back to native loading. Avoid requesting the same
dependency from its own override, which would recurse. Parser helpers expose typed
dependencies, definitions, and a JSON snapshot.

Exporter plugins provide node/mesh/texture/material hooks and before/after-parse hooks.
Material hooks can return a Promise. GLTFDefinition's UserData view is live;
`set_extension` merges one JSON extension without replacing others and raises
`SerializationError` on failure. Use it when several plugins share the extensions map.
GLTFWriter marks used/required extensions and can process referenced textures.
These facades cover common extension tasks, not every internal parser/writer method.

## SVG profiles and text

```moonbit
// In an async function that handles LoadError
let svg = @three.SVGLoader().load("/profiles/plate.svg")
let options = @three.ExtrudeOptions()
options.set_depth(2)
options.set_bevel_enabled(false)
for path in svg.paths() {
  let shapes = path.to_shapes()
  let solid = @three.ExtrudeGeometry(shapes, options).as_buffer_geometry()
  // Add a mesh using solid, and retain it for later disposal.
}
```

`parse(text)` reads SVG in memory; `load(url)` is asynchronous. Both require the
browser's DOMParser and raise `LoadError` on parsing or loading errors. Paths retain
SVG transforms and fill rules, including even-odd holes. SVG coordinates have positive
Y downward; apply the desired scale/orientation when placing the result in a scene.
`default_dpi` and `default_unit` control unit conversion. `SVGResult::xml_string()`
serializes the root element without exposing DOM objects across the FFI.

`SVGLoader::points_to_stroke(points, style, arc_divisions, min_distance)` builds stroke
geometry and returns `None` when there are too few points. Create styles with
`StrokeStyle(width, color, join, cap, miter_limit)`: joins are `MiterJoin`, `RoundJoin`,
or `BevelJoin`; caps are `ButtCap`, `RoundCap`, or `SquareCap`.
`create_fill_material(path)` and `create_stroke_material(path)` return optional materials
using the SVG path's style. This workflow converts geometry; it is not a complete SVG browser renderer.

```moonbit
let font = @three.FontLoader().load("/fonts/example.typeface.json")
let options = @three.TextGeometryOptions(font, 2, 0.25)
options.as_extrude_options().set_bevel_enabled(false)
let text = @three.TextGeometry("Hello", options).as_buffer_geometry()
```

FontLoader also provides `parse_json` and `parse_json_string`. Fonts use three.js
typeface JSON, not raw TTF/OTF files. `Font::generate_shapes(text, size, direction)`
returns editable outlines and raises `ModelingError` if generation fails.
Directions are `LeftToRight`, `RightToLeft`, and `TopToBottom`; this does not provide
complex-script shaping. TextGeometryOptions exposes shared extrusion settings through
`as_extrude_options()`. Defaults use no bevel; set bevel dimensions explicitly when enabling it.

## Selection and gizmo constraints

`SelectionBox(camera, scene, depth).select(start, end)` takes Vector3 points whose X/Y
components are normalized device coordinates in [-1, 1]. Update camera and object world
matrices before selecting. Native selection tests object bounding-sphere centers, so an
object that only overlaps the rectangle may not be selected. Results are snapshots.
Use `instance_ids(mesh)` and `batch_ids(mesh)` to retrieve selected instance IDs;
instanced selections are reported separately from ordinary objects.

```moonbit
let selection = @three.SelectionBox(camera, scene, 100)
let objects = selection.select(@three.Vector3(-0.5, 0.5, 0), @three.Vector3(0.5, -0.5, 0))
let helper = @three.SelectionHelper(renderer, "selection-rectangle")
helper.element().set_css_text("position:fixed;border:1px solid blue;background:rgba(0,0,255,0.1)")
```

Attach the renderer's canvas to the DOM before dragging. SelectionHelper displays the
rectangle using native pointer listeners; the application converts canvas-relative pointer
coordinates to NDC and invokes SelectionBox. Disable conflicting camera/gizmo controls
while selecting. Call `dispose()` to remove the rectangle and listeners.

TransformControls now includes `min_x/max_x`, `min_y/max_y`, and `min_z/max_z` movement
limits; `show_xy`, `show_yz`, `show_xz`, `show_xyze`, and `show_e` handles; and `set_colors`.
`set_viewport(Some(Vector4(x, y, width, height)))` supports a sub-canvas viewport in CSS
pixels with a bottom-left origin; `None` restores the whole canvas. Existing translation,
rotation, and scale snapping remains available.

## Material libraries and PLY

```moonbit
let materials = @three.MTLLoader().load("/models/part.mtl")
materials.preload()
let loader = @three.OBJLoader()
loader.set_materials(materials) |> ignore
let model = loader.load("/models/part.obj")
```

MTLLoader also supports `parse(text, path)` for in-memory material libraries. The path
resolves texture URLs. `MTLMaterialOptions` configures side, wrapping, RGB normalization,
zero-RGB handling, and the interpretation of `Tr`. Material creation may start separate
texture requests; completion of `load()` or `preload()` does not wait for those images.
Use the loading manager to track them. `Material::as_phong_material()` exposes the usual
MTL surface properties. Dispose created materials and their textures when finished.

PLYLoader supports async `load`, binary `parse(Bytes)`, and `parse_ascii(String)`.
PLYExporter provides synchronous `export_ascii(root, options)` and
`export_binary(root, options)`, raising `ExportError` on failure. Update world matrices
before export. `PLYExportOptions::set_little_endian` chooses binary byte order;
`set_exclude_attributes` filters normal, UV, color, or index output. PLY preserves
supported vertex attributes but not scene materials or hierarchy.

`PLYPropertyNames::set(source, target)` remaps imported property names.
`PLYCustomProperties::set(attribute, properties)` groups PLY properties into an attribute;
pass it to `set_custom_property_name_mapping` on the loader. The export option's live
`custom_properties()` mapping provides the inverse naming for custom attributes.

## NURBS, curve deformation, and surface tools

`NURBSCurve(degree, knots, control_points)` uses Vector4 control points `(x, y, z, weight)`
and exposes the ordinary Curve3 API through `as_curve3()`. `NURBSSurface` takes two
degrees, two knot arrays, and a rectangular grid of Vector4 control points. Use its
`get_point(u, v, target)` callback with ParametricGeometry to tessellate a surface.
Supply nondecreasing knots and compatible degrees/control-point counts: each knot
array has `control_count + degree + 1` entries. Use positive weights for ordinary models.
Constructors copy knot arrays and control points. Control-point getters copy containers
but retain live Vector4 references; update curve arc lengths after editing them.

```moonbit
let flow = @three.Flow(mesh, 1)
flow.update_curve(0, curve)
flow.uniforms().set_spine_offset(0)
scene.as_object3d().add(flow.object().as_object3d()) |> ignore
flow.move_along_curve(0.1)
```

Flow bends the mesh's local X axis along a curve in the WebGL vertex shader.
`spine_offset` aligns the model with the path; `path_offset` and `path_segment` control
placement. InstancedFlow supports per-instance curve selection and movement. Initialize
curves before assigning/moving instances. Invalid indices, uninitialized curves, and
zero-length curves raise `ModelingError`. Flow updates the source curve's arc-length cache.

The modifier clones objects and materials while sharing source geometry. Dispose its
cloned materials and `spline_texture()` separately; InstancedFlow also owns an InstancedMesh
that needs disposal. GPU deformation leaves CPU vertex data unchanged, so raycasting,
bounds, and mesh exports do not automatically reflect the bent surface. Use the baking
functions below to create CPU geometry for those operations.

`DecalGeometry(mesh, position, orientation, size)` clips the mesh to a projection box.
Update the mesh's world matrix first. The resulting vertices are in world space; avoid
applying the source object's transform a second time. Dispose the generated geometry independently.

`ExtrudeOptions::set_uv_generator(Some(UVGenerator(top, side)))` supplies custom UVs.
Callbacks receive the ExtrudeGeometry, a read-only `UVVertices` view, and vertex indices.
Read XYZ components with `vertices.get(index * 3 + component)` during the callback;
the view avoids copying the entire growing buffer for each face. Return exactly three
Vector2 values for a top triangle and four for a side quad. `None` restores native UVs.

`VertexNormalsHelper(object, size, color)` and `VertexTangentsHelper(...)` visualize
existing normal/tangent attributes. Recompute those attributes as needed, call `update()`
after mesh edits, and `dispose()` on cleanup. Their line geometry is accessible through
`as_line_segments()`.

The modeling example includes SVG extrusion, shader-based curve movement, and pointer
selection. Integration tests also fetch SVG/font/MTL/PLY files and verify load failures.
Subdivision surfaces, remeshing, and automatic UV unwrapping
remain outside the implemented modeling API.

## Loft, NURBS volume, and procedural noise

`LoftGeometry(sections, options)` connects ordered cross sections with matching
point counts. `LoftOptions()` closes each section by default; start and end caps
are opt-in. Sections must follow a consistent winding and vertex correspondence.
Use simple, planar contours for caps. The wrapper validates finite coordinates,
section sizes, and cap options, but does not detect contour self-intersections.
It copies the input sections, and `sections()` returns independent point snapshots.

```moonbit
let sections : FixedArray[FixedArray[@three.Vector3]] = [
  [
    @three.Vector3(-1, 0, -1), @three.Vector3(-1, 0, 1),
    @three.Vector3(1, 0, 1), @three.Vector3(1, 0, -1),
  ],
  [
    @three.Vector3(-0.5, 2, -0.5), @three.Vector3(-0.5, 2, 0.5),
    @three.Vector3(0.5, 2, 0.5), @three.Vector3(0.5, 2, -0.5),
  ],
]
let options = @three.LoftOptions()
options.set_cap_start(true)
options.set_cap_end(true)
let geometry = @three.LoftGeometry(sections, options).as_buffer_geometry()
```

`NURBSVolume` takes three degrees, three knot vectors, and a rectangular
`FixedArray[FixedArray[FixedArray[Vector4]]]` control grid ordered by u, v, w.
Control points use `(x, y, z, weight)` with finite coordinates and positive weights.
Each knot vector must match its degree and control count and have clamped endpoints.
`get_point(u, v, w, target)` evaluates normalized parameters in `[0, 1]` and writes
to `target`. Knot and control-point getters return independent snapshots;
`set_control_point()` explicitly changes a control point.

`NURBSUtils()` exposes span lookup, basis functions and derivatives, homogeneous
B-spline evaluation, rational curve derivatives, binomial coefficients, and surface
and volume evaluation. These utility parameters use the active knot domain.
Curve derivative arrays contain orders `0..order`, including the position at index
zero; orders are limited to 64. Basis derivatives require `order <= degree`.
The facade corrects r185's extra derivative entry and nonzero weights on higher
homogeneous zero derivatives. Surface and volume utilities return their target vector,
although the native functions return `void`.

`ImprovedNoise().noise(x, y, z)` provides Perlin noise. `SimplexNoise` supports
`noise(x, y)`, `noise3d(x, y, z)`, and `noise4d(x, y, z, w)`.
`SimplexNoise::seeded(seed)` uses a local deterministic generator without changing
global randomness. `SimplexNoise::with_random(callback)` requires values in `[0, 1)`.
The Loft and NURBSVolume constructors, validated NURBS operations, and custom-random
constructor raise `ModelingError` for invalid inputs.

## Vertex, edge, and face editing

`MeshTopology(geometry)` builds an immutable snapshot of a triangle mesh, with typed
vertex, edge, and face IDs. IDs belong to one snapshot; passing an ID from another
snapshot raises `ModelingError`. `vertex_id()`, `edge_id()`, and `face_id()` return
`None` for missing indices. A face index follows the source triangle order, including
degenerate triangles. All stored triangles are inspected, regardless of draw range.

Use `MeshTopology::from_welded(geometry, tolerance)` to treat coincident render
vertices as one editing vertex. Zero tolerance joins exact positions; a positive
tolerance joins positions within that distance of an existing representative.
This is an explicit geometric grouping: coincident disconnected parts can also join.
It preserves the original render vertices, UV seams, and material groups.
`source_indices(vertex)` lists the corresponding render vertex indices.

```moonbit
let topology = @three.MeshTopology::from_welded(geometry, 0.000001)
let selection = @three.MeshSelection(topology)
selection.set_face(topology.face_id(0).unwrap(), true)
selection.grow_vertices()
let edited = selection.translated_geometry(@three.Vector3(0, 0.25, 0))
```

Topology queries expose vertex/edge/face adjacency, face normals, connected faces,
boundary edges, edges incident to more than two faces, inconsistent shared-edge
winding, and degenerate faces. These diagnostics do not detect self-intersections
or nonmanifold vertices and do not certify that a mesh is a valid solid.

`MeshSelection` owns mutable selection state separately from connectivity.
`set_vertex()`, `set_edge()`, and `set_face()` toggle explicit selections.
`effective_vertices()` combines them without duplicates; `grow_vertices()` adds
one adjacency step, and `select_connected_faces()` selects a connected component.
`clear()` resets all selections.

`translated_geometry()` and `transformed_geometry()` return independent geometry
from the snapshot, moving every render copy of each selected editing vertex once.
Transforms must be finite affine matrices. With a nonempty selection, output positions
use Float32 storage, normals and bounds are recomputed, and stale tangents are removed.
Other attributes and material groups are retained. An empty selection returns an
unchanged independent copy. These operations are relative to the original snapshot;
build a new topology from the edited output to accumulate edits. Skinning and morph
attributes must be baked before creating a topology. Dispose output geometries after use.

### Region extrusion and edge splitting

`selection.extruded_geometry(offset, side_material)` extrudes explicitly selected
faces together as regions. It replaces their triangles with translated caps and adds
two side triangles per region boundary edge, including boundaries around holes.
Shared edges inside the selection receive no walls. Existing cap and unselected-face
materials are retained; `side_material` is a nonnegative index into the mesh's material
array. A region on an open surface keeps its original base open. Selecting every face
of a closed component translates that component without adding walls.

```moonbit
let topology = @three.MeshTopology::from_welded(geometry, 0)
let region = @three.MeshSelection(topology)
for face in topology.faces() {
  if topology.face_normal(face).y() > 0.9 {
    region.set_face(face, true)
  }
}
let extruded = region.extruded_geometry(@three.Vector3(0, 1, 0), 0)
```

The offset is a finite, nonzero displacement in geometry-local coordinates; it is
not a per-face normal distance. Caps retain their UVs. Each wall receives its own
vertices and, when the source has a `uv` attribute, rectangular UVs spanning the edge
length and offset length. This is local wall mapping, not atlas unwrapping. Other
continuous attributes are copied from the corresponding boundary endpoints.

`selection.split_edges_geometry(fraction)` splits explicitly selected edges and
retriangulates every incident face. The fraction must be strictly between zero and
one and is measured from the first endpoint returned by `edge_vertices()` to the
second. Multiple selected edges on one triangle are processed together; selecting
all three creates four triangles. Use a welded topology for render seams so both
sides split at the same position while retaining their separate UVs and attributes.

```moonbit
let next = @three.MeshTopology::from_welded(extruded, 0)
let edges = @three.MeshSelection(next)
for edge in next.edges() {
  edges.set_edge(edge, true)
}
let refined = edges.split_edges_geometry(0.5)
```

Both operations return independent indexed geometry and leave the snapshot and
selection unchanged. Extrusion uses only face selections; splitting uses only edge
selections. An empty relevant selection returns an unchanged copy after validating
the operation parameters. Output indices and face numbering can change, so construct
a new topology and acquire new IDs for subsequent edits.

For nonempty edits, continuous vertex attributes with one to four components are
decoded and stored as Float32. Edge splits interpolate these values, including
normalized colors and interleaved attributes. Discrete integer shader attributes and
instanced attributes are rejected. Normals and bounds are recomputed, stale tangents
are removed, and unused render vertices are omitted. Material assignments are retained
through rebuilt groups. Dispose returned geometries when finished.

Connectivity edits require a full draw range and nonoverlapping, triangle-aligned
material groups covering every triangle, or no groups. They reject degenerate faces,
inconsistent winding, nonmanifold edges or vertex fans, touching extrusion boundary
loops, and output triangles that collapse in Float32 storage. Welded vertices must
have exactly coincident source positions; approximate proximity grouping must be
resolved before these operations. These failures raise `ModelingError` and leave the
input unchanged. Self-intersections and collisions with other geometry are not checked.

### Convex edge bevels

`selection.beveled_geometry(width, bevel_material)` adds a single planar chamfer
along selected convex ridges. It requires one connected, closed, outward-facing convex
solid, with render seams welded to exactly coincident positions. Coplanar triangulation
diagonals are ignored. If a straight ridge has multiple edge segments, select all of
them; partial-ridge selections raise `ModelingError`.

```moonbit
let topology = @three.MeshTopology::from_welded(geometry, 0)
let selection = @three.MeshSelection(topology)
for edge in topology.edges() {
  selection.set_edge(edge, true)
}
let beveled = selection.beveled_geometry(0.1, 6)
```

`width` is the positive setback measured perpendicular to the original ridge within
each adjacent face, in geometry-local units. For a right-angle edge, a width of `0.1`
cuts back both faces by `0.1`. Multiple selected ridges are clipped together; neighboring
chamfers meet at mitered corners. The method does not create rounded profiles or separate
vertex-cap patches. Cuts that remove an original supporting face, erase a selected
chamfer, or cannot preserve its width and closure at Float32 precision are rejected.
Widths are not automatically clamped.

Original face materials and interpolated UVs are retained. New chamfers use the
nonnegative `bevel_material` index, so provide a mesh material array containing that
slot. They receive planar, local-unit UVs when the source has a `uv` attribute.
Other supported continuous attributes, including normalized colors, are interpolated
from the clipped boundary. Normals are recomputed with hard boundaries between face
polygons, and tangents are removed. This is a custom editing operation built on the
topology layer; it is not a native three.js bevel modifier.

The returned indexed geometry is independent of the source, and the selection remains
unchanged. Rebuild the topology for further edits and dispose output geometry when done.
An empty selection returns an independent copy after parameter validation; a selection
containing only coplanar edges also returns a copy once mesh validation passes.
The connectivity-edit attribute, group, and draw-range restrictions above apply.
Open surfaces, concave meshes, rounded or multisegment bevels, and partial straight
ridges are outside this API's current scope. Invalid or unsupported inputs raise
`ModelingError` without changing the source.

Subdivision surfaces, UV unwrapping, and undo history remain unimplemented.
Edge splitting adds triangles without smoothing the surface. The browser example in
[`examples/viewer/src/topology/main.mbt`](examples/viewer/src/topology/main.mbt) creates a noisy
capped loft and also extrudes a cube region, splits its edges, renders the side-wall
material, and exports binary STL. Its bevel example renders a chamfer with a separate
material and exports the result. Tests check shared-edge closure and exported volume.

## CSG solid operations

`CSG` provides union, difference, and intersection using
[Manifold](https://manifoldcad.org/docs/jsapi/documents/Using_Manifold.html).
It supports closed concave solids, holes, internal cavities, disconnected results,
and empty results. This is a custom integration, not a native three.js API.
The optional runtime dependency is pinned to `manifold-3d@3.5.3`:

```sh
pnpm add manifold-3d@3.5.3
```

Initialize one engine and reuse it for multiple operations. In unbundled Node.js,
`initialize()` locates the installed package's WASM. In browsers, serve the matching
`node_modules/manifold-3d/manifold.wasm` file and pass its URL explicitly. The package
does not load WASM when `CSG()` is constructed.

```moonbit
// Inside an async function that handles ModelingError
let csg = @three.CSG()
csg.initialize_from_url("/vendor/manifold.wasm")
let solid = csg.subtract_mesh(block, cutter)
// solid has identity transforms; its geometry is in world coordinates.
scene.as_object3d().add(solid.as_object3d()) |> ignore
```

`initialize_from_bytes(data)` accepts an owned snapshot of WASM bytes, including
bytes read from Node.js files. `ready()` reports successful initialization. Concurrent
initialization calls share the first pending attempt; once initialized, subsequent
calls reuse that engine. Failed initialization can be retried. To switch WASM binaries,
create a new `CSG` instance. Initialization failures raise `ModelingError`.

After initialization, these operations run synchronously and raise `ModelingError`
for invalid operands or unsupported output:

| Geometry API | Mesh API | Result |
| --- | --- | --- |
| `union_geometry(left, right, right_material_offset)` | `union_mesh(left, right)` | Combined solid |
| `subtract_geometry(left, right, right_material_offset)` | `subtract_mesh(left, right)` | Left solid with the right solid removed |
| `intersect_geometry(left, right, right_material_offset)` | `intersect_mesh(left, right)` | Common volume |

Geometry APIs work in the supplied coordinate system and return independent indexed
`BufferGeometry`. Left material indices remain unchanged; right material indices are
increased by the nonnegative `right_material_offset`, including cut faces introduced
by subtraction. For example, use offset `6` to place a box operand's right-side materials
after the left box's six slots. Clear or assign the cutter's groups before the operation
when all cut faces should use one material slot.

Mesh APIs snapshot each mesh's current CPU geometry and update its world matrix,
including ancestors. They bake those world transforms, correct winding for mirrored
transforms, and return an identity-transform `Mesh`. Its material array concatenates
the left and right arrays and shares the original material objects. A single material
applies to all faces of that input mesh, matching three.js rendering semantics.
Put the result under an identity-transform parent, or explicitly convert its geometry
to the destination parent's local coordinate system. Input geometry, materials, local
transforms, and parent relationships remain unchanged.

Both operands must have matching continuous vertex attribute names and component
counts, excluding normals and tangents. UVs, normalized colors, and interleaved
attributes are decoded and interpolated through the operation. Output attributes use
Float32 storage; normals are recomputed with material runs kept separate, and tangents
are removed. Custom authored normals are not retained. Material provenance is carried
through the solver's original IDs. Geometry groups must cover complete triangles
without gaps or overlaps, and the full draw range must be active.

`weld_tolerance()` defaults to `0.000001` in operand coordinates (world units for Mesh
APIs). `set_weld_tolerance(value)` accepts finite nonnegative values; zero requires exact
position matches. The input snapshot joins nearby render-seam positions using this
tolerance while retaining separate UV/color vertices. It rejects collapsed triangles,
open boundaries, inconsistent winding, and nonmanifold edges or vertex fans. Choose a
tolerance smaller than the features you need to preserve. Nonempty inputs must represent
oriented solids with positive total volume; inner cavity shells have the opposite winding
from outer shells. Self-intersecting or overlapping input shells are not repaired.

Skinning, morphs, shader deformations, and instancing must be baked or expanded first.
Mesh world transforms must be finite, affine, and invertible. Output is checked for
finite attributes, triangle degeneracy, and closure after Float32 conversion. Edge-only
or point-only contacts that become nonmanifold in the returned geometry are rejected.
Identical subtraction and disjoint intersection return valid empty geometries.

Dispose returned geometries when finished. Mesh results share input materials and
textures; those remain caller-owned. Every operation releases its temporary Manifold
objects, including on failure, while the CSG instance retains the initialized engine.
For large interactive models, run these synchronous CPU operations in a Worker.

Browser bundlers must resolve `manifold-3d` and serve its WASM asset. The pinned JS
module includes conditional Node-only imports; the esbuild example uses
`external: ['node:*']` with `platform: 'browser'` and `format: 'esm'`. Those branches
are not executed in a browser. For unbundled browser ESM, map `manifold-3d` to the
package's `manifold.js` and initialize with an explicit WASM URL.

[`examples/viewer/src/csg/main.mbt`](examples/viewer/src/csg/main.mbt) subtracts a cylindrical tool
from a block, renders the hole and cut-face material, and exports STL and GLB.
Tests cover analytic volume, closed topology, material and UV export, initialization
errors, mirrored parents, repeated operations, and use of beveled geometry as input.

## Expanding batched meshes for editing

`SceneUtils().batch_instance_ids(batch)` lists active IDs, skipping deleted slots.
`batch_geometry(batch, geometry_id)` extracts an independent geometry with local
indices and only the actual vertices and indices, excluding reserved capacity.
`meshes_from_batch(batch, only_visible)` produces a new group of ordinary meshes.
It preserves the batch's local transform, per-instance matrices and visibility,
instance tint and alpha, shadow flags, layers, and render order. Source child nodes
are not included. The result can be edited or passed to `bake_mesh_hierarchy()`.

Each output mesh owns a geometry and a cloned material; textures remain shared.
Dispose the output geometries and materials when finished. Materials must be single
materials, and non-white instance tints require a color-based material. Custom shader
hooks are not reconstructed. Extraction and expansion failures raise `ModelingError`.
The source batch remains unchanged, including after `optimize()` or instance deletion.

## Baking Flow for export and picking

```moonbit
// Inside a function that handles ModelingError / ExportError
let geometry = @three.bake_flow_geometry(flow)
let baked = @three.Mesh(geometry, original_material).as_object3d()
baked.apply_matrix4(flow.object().as_object3d().matrix_world()) |> ignore
baked.update_matrix_world(true)
let stl = @three.STLExporter().export_binary(baked)
```

`bake_flow_geometry(flow)` produces a new BufferGeometry for Flow's root mesh;
`bake_flow_instance_geometry(instanced_flow, index)` bakes one instance. Both raise
`ModelingError` for invalid or unsupported inputs. The source geometry remains unchanged.
Indices, UVs, colors, and groups are copied; positions, normals, and bounds are updated.
Tangents are removed because they describe the original surface; regenerate them when
using tangent-space normal maps.

Baking reproduces the pinned WebGL CurveModifier's half-float spline texture and linear
filtering, including repeat seams. It returns the shader's transformed coordinates before
the final model/view transform. Preserve the Flow object's world transform on a standalone
replacement, as above, and use the original unmodified material to avoid applying Flow twice.
For instanced Flow, preserve the object's transform, not its instance matrix: the addon
uses instance matrix translation slots to encode curve metadata.

Initialize the curves before baking. Changed spline texture layouts/filtering and meshes
with skinning or morph attributes are rejected. Baking handles the root geometry, not child
meshes. GPU animation remains live on the original object; a baked result is a snapshot.
Dispose the result separately. Browser tests compare live and baked curved surfaces for
ordinary and instanced Flow, including nonidentity object transforms.

### Baking morph targets, skinning, and child meshes

```moonbit
// Inside a function that handles ModelingError
let geometry = @three.bake_mesh_geometry(mesh)
let static_tree = @three.bake_mesh_hierarchy(root)
```

`bake_mesh_geometry` captures current morph weights and bone transforms into a new
mesh-local geometry. It updates positions, normals, and bounds, preserves indices,
UVs, colors, and groups, and removes skin/morph attributes and stale tangents.
Evaluate the animation mixer before calling it to capture the desired frame.

`bake_mesh_hierarchy` captures all descendant meshes and returns a new container
Group. Its first child preserves the input root's world transform; descendants retain
local transforms. Non-mesh nodes become transform groups, including bone attachment
nodes. Matrices are frozen with `matrix_auto_update = false`; enable automatic updates
before editing position/rotation/scale. Materials and textures remain shared with the
source, while output geometries are independently owned and must be disposed.

InstancedMesh and BatchedMesh inputs are rejected with `ModelingError`. These methods
capture CPU morph/skin deformation; arbitrary shader displacement requires a dedicated
baker. Use the separate Flow baking functions for CurveModifier deformation.

## Collision queries and surface placement

`OBB(center, half_size, rotation)` represents an oriented bounding box. It supports
point containment, clamping, ray intersection, and overlap against spheres, planes,
Box3, and other OBBs. `from_box3` and `apply_matrix4` support placing bounds with an
object. Supply an orthonormal rotation and nonnegative half-sizes; arbitrary shear
cannot be represented by an OBB. Missed `intersect_ray` queries return `None`.

```moonbit
let tree = @three.Octree().from_graph_node(scene.as_object3d())
let hit = tree.ray_intersect(ray)
let overlap = tree.sphere_intersect(sphere)
```

Octree copies world-space triangles from a graph; rebuild it after moving or editing
source meshes. Alternatively, use `add_triangle` followed by `build`. Its layers,
triangles per leaf, and maximum level are configurable. `clear()` resets the tree.
Ray hits expose distance, position, and triangle. Sphere, box, and Capsule collisions
expose a separation normal and penetration depth; native `false` misses become `None`.
The application applies collision response. Queries follow the addon's triangle winding
semantics, rather than treating the scene as an arbitrary closed solid.

`ray_triangles`, `sphere_triangles`, `box_triangles`, and `capsule_triangles` return
candidate triangle snapshots for narrower queries. `triangle_sphere_intersect`,
`triangle_box_intersect`, and `triangle_capsule_intersect` return optional contact
records with normal, point, and depth. `bounds`, `triangles`, and `sub_trees` expose
the tree structure. Candidates are not guaranteed intersections. The wrapper explicitly
collects ray candidates because the pinned runtime appends to an output array despite
its type declaration claiming a return value.

`ConvexHull().set_from_points(points)` builds a hull from at least four points;
use nondegenerate, noncoplanar input. It supports `set_from_object`, point containment,
ray queries, tolerance, and `make_empty`. `faces()` returns `HullFace` records with
normal, midpoint, area, plane constant, and three vertices. Containers are snapshots;
the vectors remain live references. `HullFace` is distinct from raycast `Face`.

```moonbit
let sampler = @three.MeshSurfaceSampler(mesh)
sampler.set_weight_attribute(Some("density"))
sampler.build() |> ignore
sampler.sample(position) |> ignore
// Position is in mesh-local space.
position.apply_matrix4(mesh.as_object3d().matrix_world()) |> ignore
```

Sampling uses triangle area, optionally weighted by the first component of a vertex
attribute. `None` disables weighting; the named attribute must exist to enable it.
Weights must be finite and nonnegative, with positive total weighted area. `build()`
and sampling raise `ModelingError` for invalid or unbuilt distributions.
`sample_full(position, normal, color, uv)` also interpolates attributes; normals fall
back to face normals, while absent color/UV attributes leave their targets unchanged.
`set_random_generator` accepts a callback returning values in [0, 1) for deterministic
placement. Rebuild after editing data or changing weights; create a new sampler after
replacing geometry attributes, since the addon retains their references.

## UV editing and model state

Texture exposes `channel` for UV-set selection, its live Matrix3, `matrix_auto_update`,
and `transform_uv`. The latter mutates the target Vector2 and applies the texture matrix,
wrapping, and flip-Y behavior. Call `update_matrix()` after changing offset/repeat/rotation
when using CPU UV queries; disabling automatic updates allows a custom matrix. Changing
the UV channel on an already rendered material may require `Material::mark_needs_update()`.

Curve2/3, CurvePath2/3, Path, Shape, and NURBSCurve provide `to_json` /
`to_json_string` and mutating `from_json` / `from_json_string`. Restoration updates
arc-length caches, including curves whose lengths were previously queried.
Failures raise `SerializationError`. Restore data into a matching concrete curve type;
base-curve casts do not change the underlying JavaScript class. Shape serialization
retains holes. Native CurvePath restoration supports core curve constructors;
restore addon curves such as NURBSCurve separately when composing mixed paths.

Primitive, extrusion, text, tube, lathe, shape, and parametric geometries expose
`parameters_json()` for constructor metadata. This is a JSON snapshot, not a live setter
or an exact editing history: changing it does not regenerate geometry. Functions,
including parametric callbacks and custom UV generators, are not retained by JSON.
Store application identifiers for callbacks and recreate them when rebuilding a model.

## Editing batched parts and navigation bindings

`BatchedMesh::set_geometry_at(id, geometry)` replaces geometry shared by every instance
that references that geometry ID. Attribute layout must match and replacement data must
fit the geometry's reserved range. `get_geometry_range_at(id)` exposes used/reserved
vertex and index ranges. `set_geometry_size` resizes overall vertex/index capacity;
`set_instance_count` changes maximum instance capacity. These operations raise
`ModelingError` when native validation fails.

`get_bounding_box_at` and `get_bounding_sphere_at` take a **geometry ID**, write to the
provided target, and return `None` for invalid/deleted geometry. Bounds are in geometry
space; combine the selected instance matrix and batch world matrix for placement queries.
Recompute aggregate batch bounds after changes when using `bounding_box()` or `bounding_sphere()`.

```moonbit
controls.set_keys("KeyA", "KeyW", "KeyD", "KeyS")
controls.set_mouse_buttons(MousePan, MouseDolly, MouseRotate)
controls.set_touches(TouchPan, TouchDollyRotate)
controls.listen_to_key_events()
```

OrbitControls key mappings use `KeyboardEvent.code`; this binding listens on `window`.
Stop keyboard navigation with `stop_listen_to_key_events()` and dispose controls on
cleanup. Mouse actions include rotate, dolly, pan, and disabled; touch actions include
rotate, pan, combined dolly/pan, combined dolly/rotate, and disabled. `set_cursor_style`
takes `AutoCursor` or `GrabCursor`. Target-radius limits, keyboard speeds, cursor position,
and explicit pan/dolly/rotate operations are also available. Call `update()` after explicit
navigation operations. Browser tests exercise remapped keyboard and pointer input.

## Exporting GLB / glTF

```moonbit
// Inside an async function
let options = @three.GLTFExportOptions()
options.set_animations(clips)
options.set_only_visible(true)
let exporter = @three.GLTFExporter()
let bytes = exporter.export_glb(scene.as_object3d(), options~)
let json = exporter.export_gltf(scene.as_object3d(), options~)
```

`export_glb()` returns Bytes; `export_gltf()` returns JSON text with embedded resources.
Options are optional and include TRS output, visibility filtering, maximum texture size,
animation clips, and custom glTF extensions from userData. Output format is determined by the method.
Options and the clip list are copied when export starts; scene objects and clip contents remain live.
Keep those inputs stable until export finishes.

Export requires browser APIs including FileReader (and image/canvas APIs for textures).
Rejected exports raise `ExportError(String)`. Some unsupported data is skipped with a three.js warning,
including non-serializable userData, rather than rejecting the export. Prefer Standard / Basic materials
and complete Vector / Quaternion tracks for glTF-compatible animation channels.
Saving or downloading the returned data is the application's responsibility.
Round-trip tests verify geometry, animation, metadata, and visibility filtering.

The runnable functions in [`examples/viewer/src/advanced`](examples/viewer/src/advanced) cover rendering controls,
control input, post-processing, dynamic geometry, and export.

## Cube, video, and volume textures

`CubeTextureLoader().load(urls)` requires exactly six URLs, ordered +X, -X, +Y, -Y, +Z, -Z.
It returns a CubeTexture and raises LoadError for invalid face counts or loading failures.
Use `as_texture()` with scene backgrounds or material environment maps.
`CubeCamera(near, far, target)` can capture a scene into a WebGLCubeRenderTarget through `update(renderer, scene)`.

```moonbit
// Inside an async function
let video = @three.Video("/movie.webm")
video.ready()
let texture = @three.VideoTexture(video)
texture.as_texture().set_color_space(SRGB)
texture.as_texture().mark_needs_update() // Upload the initial paused frame
material.set_map(Some(texture.as_texture()))
video.play()
```

Video elements default to muted, inline playback and anonymous CORS.
`ready()`, `play()`, and `seek(seconds)` raise MediaError on failure. Seek times must be finite
and within the video duration. Serve seekable videos with HTTP Range support.
After seeking a paused video, call `mark_needs_update()` to upload the selected frame.
VideoTexture otherwise follows three.js frame callbacks. `looping`, `muted`, and `volume` are configurable.
Dispose the texture and video when finished; complete pending media operations before disposing the video.

`Data3DTexture(bytes, width, height, depth)` and `DataArrayTexture(...)` use RGBA8 data by default.
Call `mark_needs_update()` before the first upload. `set_bytes()` replaces the data and marks it for upload;
`bytes()` returns a copy. Keep dimensions and byte length consistent, and create a new texture to change
dimensions after GPU allocation. DataArrayTexture supports `add_layer_update(layer)` / `clear_layer_updates()`.

TextureFormat provides Red, RG, and RGBA formats. `Texture::format()` returns None for other formats,
including compressed formats. Setting a format does not convert the supplied data.
Sample volumes and arrays with GLSL3 `sampler3D` / `sampler2DArray` uniforms and `as_texture()`.
Both ShaderMaterial and RawShaderMaterial support `set_glsl_version(Some(GLSL3))`.
Raw shaders must declare their own inputs, matrix uniforms, precision, and fragment outputs.

## Material pipeline and shadows

Material exposes typed Blending, BlendFactor, BlendEquation, DepthFunction, StencilFunction,
and StencilOperation settings. Separate alpha blend factors/equations accept None to use the RGB settings.
Constant blending uses the live `blend_color()` and `blend_alpha` properties.
Additional flags include vertex colors, color writes, alpha hashing / coverage, polygon offset,
premultiplied alpha, dithering, and tone mapping.

```moonbit
let mask = @three.MeshBasicMaterial(0xffffff).as_material()
mask.set_color_write(false)
mask.set_depth_write(false)
mask.set_stencil_write(true)
mask.set_stencil_func(Always)
mask.set_stencil_ref(1)
mask.set_stencil_zpass(Replace)
```

Stencil operations require a stencil attachment, for example `target.set_stencil_buffer(true)`
before rendering. Render the mask before any materials that test its stencil value.
`set_clipping_planes(planes)` copies the list but retains the plane references; an empty list disables clipping.
Enable `renderer.set_local_clipping_enabled(true)` for per-material clipping.
`clip_intersection` and `clip_shadows` control how planes affect clipping and shadows.

MeshToonMaterial, MeshMatcapMaterial, MeshDepthMaterial, MeshDistanceMaterial, and ShadowMaterial
are available alongside RawShaderMaterial. LightShadow provides manual update controls and VSM blur samples.
Use `Camera::as_orthographic_camera()` / `as_perspective_camera()` to configure a shadow camera's projection.
Scene also exposes background blurriness / intensity / rotation and environment intensity / rotation.

## Batched meshes, wide lines, and helpers

```moonbit
let batch = @three.BatchedMesh(100, 10000, 20000, material)
let geometry_id = batch.add_geometry(geometry)
let instance_id = batch.add_instance(geometry_id)
batch.set_matrix_at(instance_id, @three.Matrix4().make_translation(2, 0, 0)) |> ignore
batch.set_color_at(instance_id, @three.Color::from_hex(0xff0000)) |> ignore
scene.as_object3d().add(batch.as_object3d()) |> ignore
```

BatchedGeometryId and BatchedInstanceId are distinct opaque types. IDs belong to their originating batch;
do not use them with another batch or after deletion. Deleted IDs can be reused by three.js.
Respect the constructor's instance, vertex, and index capacities; invalid IDs and capacity/layout violations
follow three.js's JavaScript exception behavior. Deleting geometry also deletes its associated instances.
`optimize()` compacts geometry storage. The batch copies source geometry and owns its internal GPU resources;
dispose the batch and its shared material separately. Intersection exposes an optional `batch_id()` for picking.
InstancedMesh also supports color queries and per-instance morph get/set operations.

`LineGeometry().set_positions(...)`, `LineMaterial(color, linewidth)`, and `Line2(geometry, material)`
provide wide polylines. LineMaterial supports screen/world units, resolution, and dash settings;
call `compute_line_distances()` when using dashed lines. Dispose geometry and material separately.

ArrowHelper, SkeletonHelper, Box3Helper, PlaneHelper, and directional / point / spot / hemisphere light
helpers are available. Remove helpers from the scene and dispose their resources when no longer needed.
Call `init_area_lights()` before rendering RectAreaLight with WebGLRenderer.
The asset examples in [`examples/viewer/src/assets`](examples/viewer/src/assets) exercise compressed loading,
texture sampling, stencil/clipping, batched instances, wide lines, and area lighting.

## Custom shaders

```moonbit
let uniforms = @three.Uniforms()
uniforms.set_float("time", 0)
uniforms.set_color("tint", @three.Color::from_hex(0xff0000))
let shader = @three.ShaderMaterial(vertex_source, fragment_source, uniforms)
uniforms.set_float("time", 1.5)
```

Uniforms provide typed access to numbers, Bool, Color, Vector, Matrix, and Texture values.
Getters return `None` for missing keys or mismatched types.

### Patching built-in materials

`ShaderDefines()` provides typed integer, float, boolean, and string entries.
`Material::set_defines` copies them and marks the material for recompilation;
`defines()` returns the live dictionary when present. Mark the material for update
after changing that dictionary directly.

`set_on_before_compile(callback, cache_key)` exposes a mutable `ShaderProgram` with
vertex/fragment sources and live `uniforms()`, plus the renderer. Use a distinct cache
key for each distinct generated shader program; uniform-only changes do not require
recompilation. Installing or clearing the callback marks the material for update.

Material and Object3D have `set_on_before_render`; Object3D also has
`set_on_after_render`. Their `RenderContext` contains the renderer, scene, camera,
geometry, object, material, and optional geometry group. Each setter replaces the
previous callback. Use matching `clear_on_*` methods when finished. Callbacks are not
preserved by material cloning or JSON serialization. Shader hooks target WebGLRenderer.

### Texture sources, partial updates, and mipmaps

```moonbit
// Inside a function that handles ModelingError
let texture = @three.DataTexture::from_rgba(
  b"\xff\x00\x00\xff\xff\x00\x00\xff", 2, 1,
).as_texture()
texture.mark_needs_update()
// Replace the second pixel and schedule its upload.
texture.write_rgba(4, b"\x00\xff\x00\xff")
```

`Texture::source()` is live; `set_source` attaches a Source and schedules an upload.
`Source::from_rgba` copies RGBA8 bytes, and `from_canvas` references a Canvas.
Sources expose size, version, and `data_ready`. `rgba_bytes()` returns an optional
byte snapshot. When changing a shared source, notify each texture that needs a new
upload with `mark_needs_update()`; Source notification alone does not advance a
texture's version.

`write_rgba(start, bytes)` checks storage and bounds, writes bytes, records an update
range, and schedules upload. Offsets and counts are components (bytes for RGBA8), not
pixels. `add_update_range`, `clear_update_ranges`, and `update_ranges` expose range
management. Shared Source users see the same CPU data.

`TextureMipLevel(bytes, width, height)` copies an RGBA8 level.
`set_rgba_mipmaps(levels)` copies the level list and its data, disables automatic
mipmap generation, and schedules upload. Supply a complete chain starting with the
base level, matching the texture's dimensions, then halve dimensions down to 1 × 1.
Select a mipmap minification filter; `rgba_mipmaps()` returns snapshots.
The [completion example](examples/viewer/src/completion) and browser tests cover shader
callbacks, partial uploads, manual mip selection, 3MF/USDZ, and Draco.

## FFI and module resolution

Following the [reference fs bindings](https://github.com/mizchi/js.mbt/blob/main/src/node/fs/fs.mbt),
module functions are imported with `#module()` and `extern "js"`.
However, three.js ES classes require `new`. Binding a class name directly as an FFI function
makes the current compiler emit an ordinary function call, which fails at runtime.

Small factories in [`js/constructors.js`](js/constructors.js) handle the `new` call:

```moonbit
#module("@mizchi/three-mbt/constructors")
pub extern "js" fn Vector3::Vector3(x : Double, y : Double, z : Double) -> Vector3 = "vector3"
```

Methods use inline JavaScript in `extern "js"` to delegate directly to calls such as `self.add(other)`.
three.js manages math and scene state; the MoonBit layer does not duplicate that state.
Both ESM and CommonJS output work without a global `THREE` or handwritten `require()` calls.

In this repository, `pnpm install` links the companion npm package through `link:./js`.
Other projects also need this companion package in addition to the MoonBit dependency.
Install the MoonBit package from Mooncakes:

```sh
moon add mizchi/three@0.1.0
```

The companion is included in the same Mooncakes version. Link to the installed
copy so Node.js and bundlers resolve its package exports:

```sh
pnpm add three@0.185.1 @mizchi/three-mbt@link:./.mooncakes/mizchi/three/js
```

For local development instead of the registry version, register both projects in
a `moon.work` file in their parent directory and point the JavaScript link at
the local library checkout's `js/` directory:

```moonbit
members = ["three-mbt", "my-app"]
```

Add `import { "mizchi/three@0.1.0" }` to the consuming project's `moon.mod` to use the local
implementation from the workspace. In browsers, bundle the generated ESM or configure an import map
that resolves `@mizchi/three-mbt/constructors`, `@mizchi/three-mbt/loaders`,
`@mizchi/three-mbt/events`, `@mizchi/three-mbt/controls`, `@mizchi/three-mbt/postprocessing`,
`@mizchi/three-mbt/geometry`, `@mizchi/three-mbt/exporters`, `@mizchi/three-mbt/textures`, `@mizchi/three-mbt/materials`,
`@mizchi/three-mbt/objects`, `@mizchi/three-mbt/statics`, `@mizchi/three-mbt/interpolation`,
`@mizchi/three-mbt/modeling`, `@mizchi/three-mbt/modeling-utils`,
`@mizchi/three-mbt/modeling-io`, `@mizchi/three-mbt/modeling-edit`,
`@mizchi/three-mbt/modeling-workflow`, `@mizchi/three-mbt/bake`,
`@mizchi/three-mbt/material-edit`, `@mizchi/three-mbt/asset-formats`,
`@mizchi/three-mbt/spatial-detail`, `@mizchi/three-mbt/obj-mtl`,
`@mizchi/three-mbt/scene-tools`, `@mizchi/three-mbt/rigging`,
`@mizchi/three-mbt/asset-extra`, `@mizchi/three-mbt/render-extra`,
`@mizchi/three-mbt/parametric`, `@mizchi/three-mbt/topology`,
`@mizchi/three-mbt/csg`,
`@mizchi/three-mbt/gltf-plugins`, `three`, and `three/addons/`.

## API contracts

- Constructors use `Type::Type`; methods use `snake_case`.
  three.js overloads are split into functions with explicit types.
- Math types are mutable. Methods such as `add`, `normalize`, and `invert` modify and return the receiver.
  Use `clone()` when you need an independent value.
- `same_reference()` checks JavaScript reference identity; `equals()` checks value equality for math types.
- Getters such as `position()`, `rotation()`, `quaternion()`, `scale()`, and `matrix()` return live references.
  `children()` and `Matrix4::elements()` return `FixedArray` snapshots.
  References to the child nodes themselves are preserved.
- Use `as_object3d()` to explicitly upcast `Group` and `Scene`. This does not create a copy.
- `parent()` and `get_object_by_name()` convert `null` / `undefined` to `None`.
- Angles are in radians. Euler order is constrained to the six `EulerOrder` variants.
  `Euler::set()` preserves the current order when the order argument is omitted.
- `Quaternion()` creates an identity rotation. Callers must normalize axis-angle axes and rotation quaternions.
- Matrix elements are column-major. `multiply()` multiplies on the right; `premultiply()` multiplies on the left.
  Inverting a singular matrix produces a zero matrix, matching three.js.
- `get_world_*()` writes the result into the supplied target and returns it. Matrix updates follow three.js semantics.
- Use scene graphs as acyclic trees. As in three.js, `attach()` / `look_at()` have limitations under parents
  with non-uniform scales. Avoid changing the hierarchy during `traverse()`.
- Color hex input/output uses sRGB; RGB components use the working color space, which defaults to linear sRGB.
  Changes to three.js ColorManagement from external JavaScript also apply to these bindings.
- For Scene backgrounds, use `background()` / `set_background(Color?)` or
  `background_texture()` / `set_background_texture(Texture?)` as appropriate.
  Environment maps use `environment()` / `set_environment(Texture?)`.
- `BufferAttribute` provides common component access for regular and interleaved attributes.
  `from_floats()` creates a `Float32BufferAttribute`; callers must keep `item_size` and data length consistent.
- `DataTexture::from_rgba()` expects RGBA8 Bytes (width × height × 4 bytes).
  Call `mark_needs_update()` after changing Texture settings when required.
- Changes to vertices, instances, and materials also require update notifications, following three.js semantics.
  Explicitly `dispose()` geometries, materials, and textures.
  Removing an object from a scene does not release GPU resources. Owners must manage shared resources.
- On shutdown, call `renderer.stop_animation_loop()`, `controls.dispose()`, and `renderer.dispose()`.
  Release animation resources with `mixer.stop_all_action()` followed by `uncache_root(root)`.

## Development

[`bindings/api.mjs`](bindings/api.mjs) and the domain-specific `bindings/*.mjs` files define the API.
They specify argument types, return types, and JavaScript mappings used to generate `src/*_generated.mbt`.
Additional class types and `js/core-factories.js` are also generated.
Enum / Option conversions, asynchronous operations, and Renderer option handling live in separate handwritten `.mbt` files.

```sh
just generate   # Regenerate FFI bindings and update the public interface
just check      # Check generated files, types, warnings, and formatting
just ci
just fixtures   # Regenerate the repository's GLB / glTF test fixtures
```

When adding an API, write a test for the expected behavior first, confirm that it fails, then add the definition.
`just check` detects manual edits to generated files.

## License

MIT. See [LICENSE](LICENSE).
