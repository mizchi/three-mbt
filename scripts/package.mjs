import { execFile } from 'node:child_process';
import { cp, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { unzipSync } from 'three/addons/libs/fflate.module.js';

const exec = promisify(execFile);
const repository = fileURLToPath(new URL('../', import.meta.url));
const generatedDirectories = new Set(['.git', '.mooncakes', '_build', 'target', 'node_modules']);
const requiredFiles = ['moon.mod', 'LICENSE', 'README.md', 'src/moon.pkg', 'src/pkg.generated.mbti'];

async function createArchive({ member, source, workspace, target }) {
  const { stdout, stderr } = await exec('moon', ['package', '--target-dir', target], {
    cwd: source,
    env: { ...process.env, MOON_WORK: workspace },
    maxBuffer: 16 * 1024 * 1024,
  });
  const diagnostics = stdout + stderr;
  const directory = join(target, 'publish');
  const archives = (await readdir(directory)).filter(name => name.endsWith('.zip'));
  if (archives.length !== 1) throw new Error(`Expected one archive for ${member}, found ${archives.length}`);
  const path = join(directory, archives[0]);
  const files = unzipSync(await readFile(path));
  const required = [...requiredFiles, ...(member === '.'
    ? ['js/package.json', 'src/object3d_generated.mbt'] : ['src/api.mbt'])];
  for (const name of required) {
    if (!files[name] || !Buffer.from(files[name]).equals(await readFile(join(source, name)))) {
      throw new Error(`${member}: archive is missing or changed ${name}`);
    }
  }
  for (const name of Object.keys(files)) {
    const top = name.split('/')[0];
    if (generatedDirectories.has(top) || top === 'examples' || top === 'luna-three') {
      throw new Error(`${member}: unexpected archive entry ${name}`);
    }
  }
  return { member, path, diagnostics };
}

// Moon's Git-aware ignore walker inherits the parent repository's exclusions.
// Stage only the nested module outside that repository, retaining the actual local
// three dependency through an explicit temporary workspace. Never edit ignore
// files or Git metadata to change packaging behavior.
export async function packageWorkspace({ root = repository, outputDir = join(root, '_build/publish') } = {}) {
  root = resolve(root);
  outputDir = resolve(outputDir);
  const temporary = await mkdtemp(join(tmpdir(), 'three-mbt-package-'));
  try {
    const library = await createArchive({ member: '.', source: root,
      workspace: join(root, 'moon.work'), target: join(temporary, 'build-three') });

    const original = join(root, 'luna-three');
    const staged = join(temporary, 'luna-three');
    await cp(original, staged, { recursive: true, filter: path => {
      const top = relative(original, path).split(sep)[0];
      return !generatedDirectories.has(top);
    } });
    const workspace = join(temporary, 'moon.work');
    await writeFile(workspace, `members = [\n  ${JSON.stringify(root)},\n  "luna-three",\n]\n`);
    const renderer = await createArchive({ member: 'luna-three', source: staged,
      workspace, target: join(temporary, 'build-luna-three') });

    // Validate both archives before replacing any previously built output.
    await mkdir(outputDir, { recursive: true });
    const results = [];
    for (const archive of [library, renderer]) {
      const path = join(outputDir, basename(archive.path));
      await copyFile(archive.path, path);
      results.push({ ...archive, path });
    }
    return results;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    for (const archive of await packageWorkspace()) {
      process.stdout.write(archive.diagnostics);
      process.stdout.write(`Verified archive: ${archive.path}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.stderr ?? error.message}\n`);
    process.exitCode = 1;
  }
}
