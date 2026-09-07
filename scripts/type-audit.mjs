import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import * as THREE from 'three';
import { bindings } from '../bindings/api.mjs';
import { parseDeclarations, parseModuleExports, bindingCoverage, inheritConstructors } from './type-audit-lib.mjs';

const root = resolve('node_modules/@types/three');
function files(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap(d =>
    d.isDirectory() ? files(resolve(dir, d.name)) : [resolve(dir, d.name)]);
}
const coverage = bindingCoverage(bindings);
// Handwritten typed wrappers; generated forwarding is discovered automatically.
const wrappers={
 SkeletonUtils:{clone:['clone_skinned']},
 Object3D:{parent:['parent'],getObjectByName:['get_object_by_name'],clone:['clone']},
 Euler:{constructor:['Euler'],order:['order'],set:['set'],reorder:['reorder'],setFromVector3:['set_from_vector3']},
 Quaternion:{constructor:['Quaternion','from_xyzw']},
 Scene:{background:['background','set_background','background_texture']},
 GLTFLoader:{loadAsync:['load','load_async'],parse:['parse_glb','parse_gltf'],parseAsync:['parse_glb','parse_gltf'],setMeshoptDecoder:['enable_meshopt']},
 WebGLRenderer:{constructor:['WebGLRenderer','with_canvas'],setSize:['set_size'],compileAsync:['compile_async'],readRenderTargetPixelsAsync:['read_render_target_pixels_async'],outputColorSpace:['set_output_color_space']},
 ShaderMaterial:{constructor:['ShaderMaterial']},
 Texture:{colorSpace:['color_space','set_color_space']},
 DataTexture:{constructor:['from_rgba']},
 HDRLoader:{loadAsync:['load'],createDataTexture:['parse']},EXRLoader:{loadAsync:['load'],createDataTexture:['parse']},
 TextureLoader:{loadAsync:['load']},KTX2Loader:{loadAsync:['load']},CubeTextureLoader:{loadAsync:['load']},
 GLTFExporter:{parseAsync:['export_glb','export_gltf']},PMREMGenerator:{fromScene:['from_scene']},
};
for(const [name,items] of Object.entries(wrappers)) { const entry=coverage.get(name)??new Map();coverage.set(name,entry);for(const [key,bindings] of Object.entries(items))entry.set(key,{kind:'mapped',bindings}); }

for (const [upstream, facade] of [['Curve', 'Curve3'], ['CurvePath', 'CurvePath3'], ['WebGLInfo', 'RendererInfo'], ['WebGLCapabilities', 'RendererCapabilities']]) {
  if (coverage.has(facade)) coverage.set(upstream, coverage.get(facade));
}
const addonNames = new Set();
for (const file of files(resolve('js')).filter(f => f.endsWith('.js'))) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]three\/addons\//g)) {
    for (const name of match[1].split(',')) addonNames.add(name.trim().split(/\s+as\s+/)[0]);
  }
}
const sources = files(root).filter(f => f.endsWith('.d.ts')).map(file => ({file: relative(root, file), text: readFileSync(file, 'utf8')}));
const all = inheritConstructors(sources.flatMap(({file, text}) => parseDeclarations(text, file)));
const otherExports = sources.flatMap(({file, text}) => parseModuleExports(text, file));
const excluded = /^(Audio|AudioListener|AudioAnalyser|AudioContext|PositionalAudio|AudioLoader|WebXR)/;
const classes = [], outside = [];
for (const declaration of all) {
  const runtime = THREE[declaration.name];
  const isCore = declaration.file.startsWith('src/') && (typeof runtime === 'function' || coverage.has(declaration.name));
  const selectedAddon = declaration.file.startsWith('examples/') && (addonNames.has(declaration.name) || coverage.has(declaration.name));
  if ((!isCore && !selectedAddon) || excluded.test(declaration.name)) {
    outside.push({name: declaration.name, file: declaration.file});
    continue;
  }
  // The ray intersection's structural Face facade is unrelated to ConvexHull.Face.
  const mapped = declaration.file === 'examples/jsm/math/ConvexHull.d.ts' && declaration.name === 'Face'
    ? coverage.get('HullFace') : coverage.get(declaration.name);
  classes.push({...declaration, bound: !!mapped, members: declaration.members.map(member => {
    // Math methods live on prototypes (unlike WebGLRenderer's instance methods).
    // Keep declarations removed from the runtime visible, without implementing them.
    let runtimePresent = null;
    if (declaration.file.startsWith('src/math/') && runtime && member.kind === 'method') {
      const owner = member.key.startsWith('static ') ? runtime : runtime.prototype;
      const key = member.name === '[Symbol.iterator]' ? Symbol.iterator : member.name;
      runtimePresent = typeof owner?.[key] === 'function';
    }
    return {...member, runtimePresent,
      status: runtimePresent === false ? 'unavailable' : mapped?.get(member.key)?.kind ?? 'missing',
      bindings: mapped?.get(member.key)?.bindings ?? []};
  })});
}
classes.sort((a, b) => a.name.localeCompare(b.name));
const counts = {classes: classes.length, boundClasses: classes.filter(c => c.bound).length, mapped: 0, partial: 0, missing: 0, unavailable: 0};
for (const c of classes) for (const m of c.members) counts[m.status]++;
// MathUtils is a module namespace, not a ClassDeclaration in DefinitelyTyped.
const namespaces = [{name: 'MathUtils', members: otherExports.filter(e => e.file === 'src/math/MathUtils.d.ts' && ['function', 'value'].includes(e.kind) && e.name !== 'MathUtils').map(e => ({...e,
  status: coverage.get('MathUtils')?.get(`static ${e.name}`)?.kind ?? 'missing',
  bindings: coverage.get('MathUtils')?.get(`static ${e.name}`)?.bindings ?? [],
}))}];
const geometryUtilities = {
  deepCloneAttribute: 'deep_clone_attribute', mergeGeometries: 'merge_geometries',
  mergeAttributes: 'merge_attributes', interleaveAttributes: 'interleave_attributes',
  estimateBytesUsed: 'estimate_geometry_bytes', mergeVertices: 'merge_vertices',
  toTrianglesDrawMode: 'to_triangles_draw_mode', computeMorphedAttributes: 'compute_morphed_attributes',
  computeMikkTSpaceTangents: 'compute_mikktspace_tangents', mergeGroups: 'merge_groups',
  deinterleaveAttribute: 'deinterleave_attribute', deinterleaveGeometry: 'deinterleave_geometry',
  toCreasedNormals: 'to_creased_normals',
};
namespaces.push({name: 'BufferGeometryUtils', members: otherExports
  .filter(e => e.file === 'examples/jsm/utils/BufferGeometryUtils.d.ts' && e.kind === 'function')
  .map(e => ({...e, status: geometryUtilities[e.name] ? 'mapped' : 'missing',
    bindings: geometryUtilities[e.name] ? [geometryUtilities[e.name]] : []}))});
for (const [name,dir] of [['SceneUtils','utils'],['SkeletonUtils','utils'],['WebGLTextureUtils','utils'],['NURBSUtils','curves']]) {
  namespaces.push({name, members: otherExports
    .filter(e=>e.file===`examples/jsm/${dir}/${name}.d.ts`&&e.kind==='function')
    .map(e=>({...e,status:coverage.get(name)?.get(e.name)?.kind??'missing',
      bindings:coverage.get(name)?.get(e.name)?.bindings??[]}))});
}
const report = {
  versions: {three: JSON.parse(readFileSync('node_modules/three/package.json')).version, types: JSON.parse(readFileSync(root + '/package.json')).version},
  scope: 'Runtime-exported WebGL core classes, existing core facades, currently imported addon classes and existing addon facades; excludes audio/XR, private/protected members and names with an underscore prefix or suffix. Includes merged local property interfaces. Inherited methods are counted on their declaring class; inherited constructors are reported on concrete subclasses with their original source location.',
  caveat: 'Mapped means at least one typed facade/overload exists, not full signature compatibility or both getter and setter coverage. Partial means an indirect reference was detected. Unavailable means a math method declared in the types is absent from the pinned runtime. Namespace counts are separate. Other functions, constants, interfaces and structural option objects are inventoried in otherExports, outside class-member counts.',
  counts, classes, namespaces, outside, otherExports,
  knownTypeDifferences: [
    {member: 'NURBSUtils.calcBSplineDerivatives / calcNURBSDerivatives', declared: 'derivative arrays', runtime: 'r185 appends an extra entry and sets homogeneous zero-derivative weights to 1', binding: 'returns orders 0..n and corrects higher homogeneous derivatives to zero before rational conversion'},
    {member: 'NURBSUtils.calcSurfacePoint / calcVolumePoint', declared: 'Vector3 return', runtime: 'void; writes to target', binding: 'validated facade returns the supplied Vector3 target'},
    {member: 'FBXLoader.parse', declared: 'ArrayBuffer | string', runtime: 'ArrayBuffer', binding: 'parse_ascii encodes text as UTF-8 before parsing'},
    {member: 'SkeletonUtils.retargetClip target', declared: 'Object3D | Skeleton', runtime: 'requires target.skeleton', binding: 'SkinnedMesh target; source can be SkinnedMesh or Skeleton'},
    {member: 'RetargetOptions', declared: 'preserveHipPosition', runtime: 'preserveBonePositions', binding: 'preserve_bone_positions controls the actual runtime flag'},
    {member: 'SceneUtils.createMeshesFromMultiMaterialMesh', declared: 'Group', runtime: 'returns the input Mesh for a single material; mutates geometry while merging groups', binding: 'always returns a new Group and preserves input geometry'},
    {member: 'Ray.distanceToPlane', declared: 'number', runtime: 'number | null', binding: 'Double?'},
    {member: 'KeyframeTrack.values', declared: 'Float32Array', runtime: 'String and Boolean tracks also inherit KeyframeTrack', binding: 'number_values returns an Option; concrete string/boolean tracks expose typed values'},
    {member: 'BufferGeometryUtils.interleaveAttributes', declared: 'InterleavedBufferAttribute', runtime: 'InterleavedBufferAttribute[] | null', binding: 'FixedArray[InterleavedBufferAttribute]?'},
    {member: 'BufferGeometryUtils.deinterleaveAttribute', declared: '(BufferGeometry) => void', runtime: '(InterleavedBufferAttribute) => BufferAttribute', binding: '(InterleavedBufferAttribute) -> PackedBufferAttribute'},
    {member: 'BufferGeometryUtils.mergeAttributes / mergeGeometries', declared: 'non-null result', runtime: 'null for incompatible inputs', binding: 'optional result; empty input also returns None'},
    {member: 'SVGResult.xml', declared: 'XMLDocument', runtime: 'SVG root element', binding: 'xml_string serializes the element; DOM internals are not exposed'},
    {member: 'SelectionHelper pointer handlers and points', declared: 'public methods and properties', runtime: 'underscore-prefixed private members', binding: 'uses native event listeners; only public state and dispose are bound'},
    {member: 'TransformControls.minx', declared: 'minx', runtime: 'minX', binding: 'min_x / set_min_x'},
    {member: 'Flow.curveArray', declared: 'number[]', runtime: 'Curve[] with empty slots before updateCurve', binding: 'curve(index) returns Curve3?'},
    {member: 'MeshSurfaceSampler.sampleFace / binarySearch', declared: 'public methods', runtime: 'underscore-prefixed private methods', binding: 'public sample / sample_full only'},
    {member: 'MeshSurfaceSampler.setRandomGenerator', declared: 'absent', runtime: 'public callback setter', binding: 'set_random_generator(() -> Double)'},
    {member: 'Octree.getRayTriangles', declared: 'Triangle[]', runtime: 'void; appends to the supplied array', binding: 'ray_triangles returns the filled array'},
    {member: 'BatchedMesh.getGeometryRangeAt / getBoundingBoxAt / getBoundingSphereAt', declared: 'nullable results for invalid geometry IDs', runtime: 'range lookup throws on invalid/deleted IDs; bounds can retain deleted geometry', binding: 'validate through range lookup and return None for invalid/deleted IDs'},
  ],
};
const totals = c => ['mapped', 'partial', 'missing', 'unavailable'].map(status => c.members.filter(m => m.status === status).length);
const md = [
  '# Type definition audit', '', `three.js ${report.versions.three}; @types/three ${report.versions.types}.`, '', report.scope, '', report.caveat, '',
  `Classes with bindings: ${counts.boundClasses}/${counts.classes}. Member names: ${counts.mapped} mapped, ${counts.partial} partial, ${counts.missing} missing, ${counts.unavailable} unavailable.`, '',
  'Run `just audit-api` to regenerate; `just check` rejects stale reports. Signatures, source locations, excluded classes and other exported contracts: [type-audit.json](type-audit.json).', '',
  '## Known type/runtime differences', '',
  ...report.knownTypeDifferences.map(d => `- \`${d.member}\`: types declare ${d.declared}; runtime: ${d.runtime}. MoonBit: ${d.binding}.`), '',
  '## Class coverage', '', '| Class | Mapped | Partial | Missing | Unavailable |', '| --- | ---: | ---: | ---: | ---: |',
  ...classes.map(c => `| ${c.name} | ${totals(c).join(' | ')} |`), '',
  '## Namespace coverage', '', ...namespaces.flatMap(n => [
    `### ${n.name}`, '', `${n.members.filter(m => m.status === 'mapped').length}/${n.members.length} exported member names mapped.`, '',
    'Remaining: ' + (n.members.filter(m => m.status !== 'mapped').map(m => '\`' + m.name + '\`').join(', ') || 'none'), '',
  ]),
  '## Remaining class members', '', ...classes.filter(c => c.members.some(m => m.status !== 'mapped')).flatMap(c => [
    `### ${c.name}`, '', c.members.filter(m => m.status !== 'mapped').map(m => '\`' + m.key + '\`' + (m.status !== 'missing' ? ` (${m.status})` : '') + (m.deprecated ? ' (deprecated)' : '')).join(', '), '',
  ]), '',
].join('\n');
mkdirSync('docs', {recursive: true});
for (const [file, text] of [['docs/type-audit.json', JSON.stringify(report, null, 2) + '\n'], ['docs/type-audit.md', md]]) {
  if (process.argv.includes('--check')) {
    if (readFileSync(file, 'utf8') !== text) throw Error(`Stale ${file}; run just audit-api`);
  } else writeFileSync(file, text);
}
console.log(JSON.stringify(counts));
