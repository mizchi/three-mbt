import { m, p, rw, expr, upcast, geometry, cls } from './helpers.mjs';
const addon = (type, args, methods) => cls(type, args, methods, { factory: { name: type, args, js: type[0].toLowerCase() + type.slice(1), module: 'geometry' } });
const updateMethods = (owner, type) => [
  {...expr('usage', '', 'BufferUsage', `${owner}.usage`), upstream: 'usage'},
  {...expr('set_usage', 'value : BufferUsage', type, `{ ${owner}.setUsage(value); return self; }`), upstream: 'setUsage'},
  {...expr('add_update_range', 'start : Int, count : Int', 'Unit', `${owner}.addUpdateRange(start, count)`), upstream: 'addUpdateRange'},
  {...expr('clear_update_ranges', '', 'Unit', `${owner}.clearUpdateRanges()`), upstream: 'clearUpdateRanges'},
  {...expr('update_ranges', '', 'FixedArray[BufferUpdateRange]', `${owner}.updateRanges.map(range => ({...range}))`), upstream: 'updateRanges'},
];
export const dynamicGeometry = [
  cls('BufferUpdateRange', '', [p('start', 'Int'), p('count', 'Int')], { factory: null }),
  cls('GeometryGroup', '', [p('start', 'Int'), p('count', 'Int'), p('material_index', 'Int', 'materialIndex')], { factory: null }),
  cls('InstancedBufferGeometry', '', [...geometry(), ...rw('instance_count', 'Double', 'instanceCount')]),
  addon('InstancedBufferAttribute', 'values : FixedArray[Double], item_size : Int, normalized : Bool, mesh_per_attribute : Int', [upcast('buffer_attribute', 'BufferAttribute'), ...rw('mesh_per_attribute', 'Int', 'meshPerAttribute')]),
  addon('InterleavedBuffer', 'values : FixedArray[Double], stride : Int', [
    p('count', 'Int'), p('stride', 'Int'), ...updateMethods('self', 'InterleavedBuffer'),
    expr('values', '', 'FixedArray[Double]', 'Array.from(self.array)'),
    expr('mark_needs_update', '', 'Unit', '{ self.needsUpdate = true; }'),
  ]),
  cls('InterleavedBufferAttribute', 'data : InterleavedBuffer, item_size : Int, offset : Int, normalized : Bool', [upcast('buffer_attribute', 'BufferAttribute'), p('data', 'InterleavedBuffer'), p('offset', 'Int')]),
];
export function extendGeometry(bindings) {
  bindings.find(b => b.type === 'BufferAttribute').methods.push(...updateMethods('(self.isInterleavedBufferAttribute ? self.data : self)', 'BufferAttribute'));
  bindings.find(b => b.type === 'BufferGeometry').methods.push(expr('groups', '', 'FixedArray[GeometryGroup]', 'self.groups.map(group => ({...group}))'));
}
