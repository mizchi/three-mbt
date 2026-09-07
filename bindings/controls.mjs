import { m, p, rw, expr, nullable, optional, upcast, cls } from './helpers.mjs';
const addon = (type, methods) => cls(type, 'camera : Camera, canvas : Canvas', methods, { factory: { name: type, args: 'camera : Camera, canvas : Canvas', js: type[0].toLowerCase() + type.slice(1), module: 'controls' } });
const camel = n => n.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
export const controls = [
  addon('MapControls', [upcast('orbit_controls', 'OrbitControls')]),
  addon('TransformControls', [
    ...rw('enabled', 'Bool'), p('dragging', 'Bool'), nullable('object', '', 'Object3D', 'self.object'),
    m('attach', 'object : Object3D', 'TransformControls'), m('detach', '', 'TransformControls'), m('reset'),
    m('get_helper', '', 'Object3D', 'getHelper'), m('dispose'),
    expr('mode', '', 'TransformMode', '["translate", "rotate", "scale"].indexOf(self.mode)'),
    expr('set_mode', 'value : TransformMode', 'Unit', 'self.setMode(["translate", "rotate", "scale"][value])'),
    expr('space', '', 'TransformSpace', 'self.space === "local" ? 1 : 0'),
    expr('set_space', 'value : TransformSpace', 'Unit', 'self.setSpace(value === 1 ? "local" : "world")'),
    ...['translation_snap', 'rotation_snap', 'scale_snap'].flatMap(n => [nullable(n, '', 'Double', `self.${camel(n)}`), optional(n, 'Double', camel(n))]),
    ...rw('size', 'Double'), ...['show_x', 'show_y', 'show_z'].flatMap(n => rw(n, 'Bool', camel(n))),
  ]),
  addon('PointerLockControls', [
    ...rw('enabled', 'Bool'), p('is_locked', 'Bool', 'isLocked'), ...rw('pointer_speed', 'Double', 'pointerSpeed'),
    ...['min_polar_angle', 'max_polar_angle'].flatMap(n => rw(n, 'Double', camel(n))),
    m('lock', 'unadjusted_movement : Bool'), m('unlock'), m('dispose'),
    m('move_forward', 'distance : Double', 'Unit', 'moveForward'), m('move_right', 'distance : Double', 'Unit', 'moveRight'),
    m('get_direction', 'target : Vector3', 'Vector3', 'getDirection'),
  ]),
];
export function extendControls(bindings) {
  bindings.find(b => b.type === 'OrbitControls').methods.push(
    ...['enable_pan', 'enable_zoom', 'enable_rotate', 'screen_space_panning', 'zoom_to_cursor'].flatMap(n => rw(n, 'Bool', camel(n))),
    ...['pan_speed', 'zoom_speed', 'rotate_speed', 'auto_rotate_speed', 'min_zoom', 'max_zoom', 'min_polar_angle', 'max_polar_angle', 'min_azimuth_angle', 'max_azimuth_angle'].flatMap(n => rw(n, 'Double', camel(n))),
    m('get_distance', '', 'Double', 'getDistance'), m('get_polar_angle', '', 'Double', 'getPolarAngle'), m('get_azimuthal_angle', '', 'Double', 'getAzimuthalAngle'),
  );
}
