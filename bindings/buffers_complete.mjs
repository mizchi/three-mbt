import { m, p, rw, expr, nullable, upcast, cls } from './helpers.mjs';

const componentSetters = type => [
  ...['x', 'y', 'z', 'w'].map(c => m(`set_${c}`, 'index : Int, value : Double', type, `set${c.toUpperCase()}`)),
  ...['xy', 'xyz', 'xyzw'].map(cs => m(`set_${cs}`, `index : Int, ${[...cs].map(c => `${c} : Double`).join(', ')}`, type, `set${cs.toUpperCase()}`)),
];
export const buffersComplete = [
  // InterleavedBufferAttribute is a supported view of BufferAttribute's common
  // operations, but does not implement copy/set/dispose. Narrow before using these.
  cls('PackedBufferAttribute', '', [
    upcast('buffer_attribute', 'BufferAttribute'), p('id', 'Int'), p('version', 'Int'), ...rw('gpu_type', 'AttributeGPUType', 'gpuType'),
    expr('raw_values', '', 'FixedArray[Double]', 'Array.from(self.array)'),
    m('clone', '', 'PackedBufferAttribute'), m('copy', 'source : PackedBufferAttribute', 'PackedBufferAttribute'),
    m('copy_at', 'index : Int, source : PackedBufferAttribute, source_index : Int', 'PackedBufferAttribute', 'copyAt'),
    m('copy_array', 'values : FixedArray[Double]', 'PackedBufferAttribute', 'copyArray'),
    m('set', 'values : FixedArray[Double], offset : Int', 'PackedBufferAttribute'),
    m('apply_matrix3', 'matrix : Matrix3', 'PackedBufferAttribute', 'applyMatrix3'),
    m('on_upload', 'callback : () -> Unit', 'PackedBufferAttribute', 'onUpload'), m('dispose'),
  ], {factory: null, facadeFor: 'BufferAttribute'}),
  ...[
    ['Int8BufferAttribute', 'Int'], ['Int16BufferAttribute', 'Int'], ['Int32BufferAttribute', 'Int'],
    ['Uint8BufferAttribute', 'UInt'], ['Uint8ClampedBufferAttribute', 'UInt'], ['Uint16BufferAttribute', 'UInt'], ['Uint32BufferAttribute', 'UInt'],
    // Float16's native constructor accepts encoded bits; from_floats converts numbers.
    ['Float16BufferAttribute', 'UInt'], ['Float32BufferAttribute', 'Double'],
  ].map(([type, value]) => cls(type, `values : FixedArray[${value}], item_size : Int, normalized : Bool`, [
    upcast('buffer_attribute', 'BufferAttribute'), upcast('packed_buffer_attribute', 'PackedBufferAttribute'),
  ], {factory: {name: type, args: `values : FixedArray[${value}], item_size : Int, normalized : Bool`, js: `typed${type}`}})),
  cls('InstancedInterleavedBuffer', 'values : FixedArray[Double], stride : Int, mesh_per_attribute : Int', [
    upcast('interleaved_buffer', 'InterleavedBuffer'), ...rw('mesh_per_attribute', 'Int', 'meshPerAttribute'),
  ], {factory: {name: 'InstancedInterleavedBuffer', args: 'values : FixedArray[Double], stride : Int, mesh_per_attribute : Int', js: 'instancedInterleavedBuffer', module: 'geometry'}}),
];

export function extendBuffers(bindings) {
  const add = (type, methods) => {
    const binding = bindings.find(b => b.type === type);
    for (const method of methods) if (!binding.methods.some(m => m.name === method.name)) binding.methods.push(method);
  };
  add('BufferAttribute', [
    nullable('as_packed', '', 'PackedBufferAttribute', 'self.isBufferAttribute === true ? self : null'), ...componentSetters('BufferAttribute'),
    m('apply_matrix4', 'matrix : Matrix4', 'BufferAttribute', 'applyMatrix4'),
    m('apply_normal_matrix', 'matrix : Matrix3', 'BufferAttribute', 'applyNormalMatrix'),
    m('transform_direction', 'matrix : Matrix4', 'BufferAttribute', 'transformDirection'),
  ]);
  add('InterleavedBuffer', [p('version', 'Int'), p('uuid', 'String'),
    m('set', 'values : FixedArray[Double], offset : Int', 'InterleavedBuffer'),
    m('copy', 'source : InterleavedBuffer', 'InterleavedBuffer'),
    m('copy_at', 'index : Int, source : InterleavedBuffer, source_index : Int', 'InterleavedBuffer', 'copyAt'),
    expr('clone', '', 'InterleavedBuffer', 'self.clone({})'),
    m('on_upload', 'callback : () -> Unit', 'InterleavedBuffer', 'onUpload'),
  ]);
  add('InterleavedBufferAttribute', [
    ...rw('name', 'String'), p('item_size', 'Int', 'itemSize'), p('count', 'Int'), p('normalized', 'Bool'),
    ...componentSetters('InterleavedBufferAttribute'),
    ...['x', 'y', 'z', 'w'].map(c => m(`get_${c}`, 'index : Int', 'Double', `get${c.toUpperCase()}`)),
    m('get_component', 'index : Int, component : Int', 'Double', 'getComponent'),
    m('set_component', 'index : Int, component : Int, value : Double', 'InterleavedBufferAttribute', 'setComponent'),
    m('apply_matrix4', 'matrix : Matrix4', 'InterleavedBufferAttribute', 'applyMatrix4'),
    m('apply_normal_matrix', 'matrix : Matrix3', 'InterleavedBufferAttribute', 'applyNormalMatrix'),
    m('transform_direction', 'matrix : Matrix4', 'InterleavedBufferAttribute', 'transformDirection'),
    expr('mark_needs_update', '', 'Unit', '{ self.needsUpdate = true; }'),
    // Retains interleaving and clones the backing buffer.
    expr('clone', '', 'InterleavedBufferAttribute', 'self.clone({})'),
  ]);
  add('InstancedBufferAttribute', [upcast('packed_buffer_attribute', 'PackedBufferAttribute')]);
}
