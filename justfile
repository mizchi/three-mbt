default:
    @just --list

install:
    pnpm install --frozen-lockfile

fmt:
    moon fmt

generate:
    node scripts/generate.mjs
    moon fmt
    moon info --target js
    node scripts/type-audit.mjs

audit-api:
    node scripts/type-audit.mjs

fixtures:
    node tests/fixtures/generate.mjs

# Optional: requires ffmpeg with the libvpx-vp9 encoder.
fixtures-video:
    node tests/fixtures/video.mjs

check:
    node scripts/generate.mjs --check
    node scripts/type-audit.mjs --check
    moon check --target js --deny-warn
    moon fmt --check

test:
    moon test --target js --deny-warn

test-luna-three:
    moon test luna-three/src --target js --deny-warn

test-luna-three-browser: build
    pnpm exec playwright test --config examples/viewer/playwright.config.mjs luna-three.spec.mjs

test-scripts:
    node --test tests/scripts/*.test.mjs

test-release:
    moon test --target js --release --deny-warn

build:
    moon build --target js --release --deny-warn
    moon info --target js

# Build and verify both archives without publishing them.
package:
    node scripts/package.mjs

example:
    moon run examples/viewer/src/scene_graph --target js

# Vite watches MoonBit through vite-plugin-moonbit and reloads the viewer.
mouse port="4173": build
    pnpm exec vite --config examples/viewer/vite.config.mjs --port {{port}}

# Create a self-contained static demo in _build/mouse-site/.
build-mouse: build
    pnpm exec vite build --config examples/viewer/vite.config.mjs

test-browser: build
    pnpm exec playwright test --config examples/viewer/playwright.config.mjs

ci: check test-scripts test test-release test-browser
