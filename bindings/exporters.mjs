import { rw, expr, cls } from './helpers.mjs';
export const exporters = [
  cls('GLTFExporter', '', [], { factory: { name: 'GLTFExporter', args: '', js: 'gLTFExporter', module: 'exporters' } }),
  cls('GLTFExportOptions', '', [
    ...rw('trs', 'Bool'), ...rw('only_visible', 'Bool', 'onlyVisible'), ...rw('max_texture_size', 'Double', 'maxTextureSize'),
    ...rw('include_custom_extensions', 'Bool', 'includeCustomExtensions'),
    expr('animations', '', 'FixedArray[AnimationClip]', 'self.animations.slice()'), expr('set_animations', 'clips : FixedArray[AnimationClip]', 'Unit', '{ self.animations = clips.slice(); }'),
  ], { factory: { name: 'GLTFExportOptions', args: '', js: 'gLTFExportOptions', module: 'exporters' } }),
];
