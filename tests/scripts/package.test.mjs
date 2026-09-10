import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'three/addons/libs/fflate.module.js';
import { packageWorkspace } from '../../scripts/package.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('workspace archives stay separate and complete without deprecated packaging options', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'three-package-test-'));
  const sourcePaths = ['moon.mod', '.moonignore', 'moon.work', 'luna-three/moon.mod', 'luna-three/.moonignore'];
  const before = await Promise.all(sourcePaths.map(path => readFile(join(root, path))));
  try {
    const archives = await packageWorkspace({ root, outputDir });
    assert.equal(archives.length, 2);
    for (const archive of archives) {
      assert.doesNotMatch(archive.diagnostics, /deprecated|Warning:/i);
      const files = unzipSync(await readFile(archive.path));
      const sourceDir = archive.member === '.' ? root : join(root, archive.member);
      for (const path of ['moon.mod', 'LICENSE', 'README.md', 'src/moon.pkg', 'src/pkg.generated.mbti']) {
        assert.deepEqual(Buffer.from(files[path] ?? []), await readFile(join(sourceDir, path)), path);
      }
      assert.ok(!Object.keys(files).some(path => /^(?:_build|target|\.git|\.mooncakes|node_modules|examples|luna-three)\//.test(path)));
      if (archive.member === '.') {
        assert.ok(files['js/package.json']);
        assert.ok(files['src/object3d_generated.mbt']);
        assert.match(strFromU8(files['moon.mod']), /name = "mizchi\/three"/);
      } else {
        assert.deepEqual(Buffer.from(files['src/api.mbt']), await readFile(join(sourceDir, 'src/api.mbt')));
        assert.match(strFromU8(files['moon.mod']), /name = "mizchi\/luna_three"/);
      }
    }
    const after = await Promise.all(sourcePaths.map(path => readFile(join(root, path))));
    assert.deepEqual(after, before, 'packaging must not rewrite the workspace or ignore rules');
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
