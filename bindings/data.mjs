import { m, expr, nullable, cls } from './helpers.mjs';

export const dataBindings = [
  cls('UserData', '', [
    expr('keys', '', 'FixedArray[String]', 'Object.keys(self)'),
    expr('has', 'key : String', 'Bool', 'Object.hasOwn(self, key)'),
    expr('remove', 'key : String', 'Bool', '{ if (!Object.hasOwn(self, key)) return false; return delete self[key]; }'),
    ...[
      ['string', 'String', 'typeof value === "string"'], ['bool', 'Bool', 'typeof value === "boolean"'],
      ['double', 'Double', 'typeof value === "number"'],
      ['int', 'Int', 'Number.isInteger(value) && value >= -2147483648 && value <= 2147483647'],
      ['object', 'UserData', 'value !== null && typeof value === "object" && !Array.isArray(value)'],
    ].flatMap(([name, type, predicate]) => [
      nullable(`get_${name}`, 'key : String', type, `{ const value = Object.hasOwn(self, key) ? self[key] : undefined; return ${predicate} ? value : null; }`),
      expr(`set_${name}`, `key : String, value : ${type}`, 'Unit', '{ Object.defineProperty(self, key, { value, enumerable: true, configurable: true, writable: true }); }'),
    ]),
  ], { factory: null }),
  cls('Layers', '', [
    expr('mask', '', 'UInt', 'self.mask >>> 0'), m('set', 'channel : Int'), m('enable', 'channel : Int'),
    m('disable', 'channel : Int'), m('toggle', 'channel : Int'), m('intersects', 'other : Layers', 'Bool', 'test'),
    m('is_enabled', 'channel : Int', 'Bool', 'isEnabled'), m('enable_all', '', 'Unit', 'enableAll'), m('disable_all', '', 'Unit', 'disableAll'),
  ]),
];
