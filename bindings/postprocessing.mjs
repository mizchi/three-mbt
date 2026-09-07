import { m, p, rw, expr, upcast, cls } from './helpers.mjs';
const addon = (type, args, methods) => cls(type, args, methods, { factory: { name: type, args, js: type[0].toLowerCase() + type.slice(1), module: 'postprocessing' } });
const pass = () => upcast('pass', 'Pass');
export const postprocessing = [
  cls('Pass', '', [...['enabled', 'clear'].flatMap(n => rw(n, 'Bool')), ...rw('needs_swap', 'Bool', 'needsSwap'), ...rw('render_to_screen', 'Bool', 'renderToScreen'), m('set_size', 'width : Int, height : Int', 'Unit', 'setSize'), m('dispose')], { factory: null }),
  addon('EffectComposer', 'renderer : WebGLRenderer', [
    m('add_pass', 'pass : Pass', 'Unit', 'addPass'), m('insert_pass', 'pass : Pass, index : Int', 'Unit', 'insertPass'), m('remove_pass', 'pass : Pass', 'Unit', 'removePass'),
    expr('passes', '', 'FixedArray[Pass]', 'self.passes.slice()'), m('render', 'delta_seconds : Double'), m('set_size', 'width : Int, height : Int', 'Unit', 'setSize'),
    m('set_pixel_ratio', 'ratio : Double', 'Unit', 'setPixelRatio'), ...rw('render_to_screen', 'Bool', 'renderToScreen'),
    p('read_buffer', 'WebGLRenderTarget', 'readBuffer'), p('write_buffer', 'WebGLRenderTarget', 'writeBuffer'), m('dispose'),
  ]),
  addon('RenderPass', 'scene : Scene, camera : Camera', [pass(), ...rw('clear_depth', 'Bool', 'clearDepth')]),
  addon('OutputPass', '', [pass()]),
  addon('UnrealBloomPass', 'resolution : Vector2, strength : Double, radius : Double, threshold : Double', [pass(), ...['strength', 'radius', 'threshold'].flatMap(n => rw(n, 'Double'))]),
  addon('OutlinePass', 'resolution : Vector2, scene : Scene, camera : Camera', [pass(),
    expr('selected_objects', '', 'FixedArray[Object3D]', 'self.selectedObjects.slice()'), expr('set_selected_objects', 'objects : FixedArray[Object3D]', 'Unit', '{ self.selectedObjects = objects.slice(); }'),
    p('visible_edge_color', 'Color', 'visibleEdgeColor'), p('hidden_edge_color', 'Color', 'hiddenEdgeColor'),
    ...['edge_strength', 'edge_glow', 'edge_thickness', 'pulse_period'].flatMap(n => rw(n, 'Double', n.replace(/_([a-z])/g, (_, c) => c.toUpperCase()))),
  ]),
];
