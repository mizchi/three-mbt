export const m = (name, args = '', returns = 'Unit', js = name) => ({ name, args, returns, js });
export const expr = (name, args, returns, expression) => ({ name, args, returns, expression });
export const p = (name, returns, js = name) => expr(name, '', returns, `self.${js}`);
export const s = (name, type, js = name) => expr(`set_${name}`, `value : ${type}`, 'Unit', `{ self.${js} = value; }`);
export const rw = (name, type, js = name) => [p(name, type, js), s(name, type, js)];
export const nullable = (name, args, returns, expression) => ({ ...expr(name, args, returns, expression), nullable: true });
export const optional = (name, type, js = name) => ({ name: `set_${name}`, option: type, expression: `{ self.${js} = value; }` });
export const upcast = (name, returns) => ({ name: `as_${name}`, args: '', returns, identity: true });
export const node = () => [upcast('object3d', 'Object3D')];
export const geometry = () => [upcast('buffer_geometry', 'BufferGeometry')];
export const material = () => [upcast('material', 'Material')];
export const identity = (type) => expr('same_reference', `other : ${type}`, 'Bool', 'self === other');
export const cls = (type, args = '', methods = [], extra = {}) => ({
  type, declare: true, factory: { name: type, args, js: type[0].toLowerCase() + type.slice(1) }, methods, ...extra,
});
