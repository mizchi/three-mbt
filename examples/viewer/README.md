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
just build-mouse    # Static site in _build/mouse-site/
just test-browser   # Build workspace members and run all browser tests
```

`just mouse` performs an initial MoonBit build, then runs Vite with
`vite-plugin-moonbit`. MoonBit edits rebuild and
reload automatically; the browser imports `mbt:mizchi/three-viewer/mouse` through
[`web/models.js`](web/models.js), without hard-coding generated file paths.
The default character is the MoonBit rabbit; use the picker to switch to the
mouse. Both support drag, wheel, pinch, keyboard navigation, wireframe inspection,
and GLB download. `?model=mouse` opens the mouse directly.

The pinned `vite-plugin-moonbit@0.5.1` has a small pnpm patch to recognize the
current MoonBit watcher's `Success, waiting for filesystem changes` message.
This triggers browser updates after successful builds. `hmr.spec.mjs` verifies
two successive dependency edits in an isolated MoonBit workspace.

- [`src/mouse/model.mbt`](src/mouse/model.mbt): procedural character geometry.
- [`src/rabbit/model.mbt`](src/rabbit/model.mbt): MoonBit rabbit with folded ears
  and a white visor; the `01` and `<>` marks are actual geometry.
- [`src/parts/`](src/parts): shared shape helpers and resource disposal.
- [`src/mouse/viewer.mbt`](src/mouse/viewer.mbt): rendering, controls, and export.
- [`web/`](web): HTML, CSS, and browser lifecycle glue.
- [`vite.config.mjs`](vite.config.mjs): development and static build configuration.
- [`src/`](src): other executable examples used by the browser tests.
- [`tests/browser/`](tests/browser): Playwright tests; shared test assets remain
  in the repository's [`tests/fixtures/`](../../tests/fixtures).

MoonBit workspace builds emit example ESM modules under
`_build/js/release/build/mizchi/three-viewer/<package>/<package>.js`.
The library's source directory contains no example packages.

To use the rabbit inside another workspace example, import
`"mizchi/three-viewer/rabbit"` and `"mizchi/three-viewer/parts"` in `moon.pkg`:

```moonbit
let model = @rabbit.create()
scene.add(model) |> ignore
// When the scene no longer needs the model:
scene.remove(model) |> ignore
@parts.dispose(model)
```
