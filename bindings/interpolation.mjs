import { p, expr, nullable, upcast, cls } from './helpers.mjs';

const args = 'positions : FixedArray[Double], values : FixedArray[Double], value_size : Int';
export const interpolation = [
  cls('Interpolant', '', [
    expr('evaluate', 'time : Double', 'FixedArray[Double]', 'Array.from(self.evaluate(time))'),
    expr('parameter_positions', '', 'FixedArray[Double]', 'Array.from(self.parameterPositions)'),
    expr('sample_values', '', 'FixedArray[Double]', 'Array.from(self.sampleValues)'),
    expr('result_buffer', '', 'FixedArray[Double]', 'Array.from(self.resultBuffer)'),
    p('value_size', 'Int', 'valueSize'),
  ], {factory: null}),
  ...['LinearInterpolant', 'DiscreteInterpolant', 'CubicInterpolant', 'QuaternionLinearInterpolant', 'BezierInterpolant'].map(type => cls(type, args, [upcast('interpolant', 'Interpolant')], {
    factory: {name: type, args, js: type[0].toLowerCase() + type.slice(1), module: 'interpolation'},
  })),
];
export function extendInterpolation(bindings) {
  const add = (type, methods) => bindings.find(b => b.type === type).methods.push(...methods);
  add('CubicInterpolant', [
    expr('set_endings', 'start : InterpolationEnding, end : InterpolationEnding', 'Unit', '{ self.settings = { endingStart: start, endingEnd: end }; }'),
    expr('ending_start', '', 'InterpolationEnding', '(self.settings ?? self.DefaultSettings_).endingStart'),
    expr('ending_end', '', 'InterpolationEnding', '(self.settings ?? self.DefaultSettings_).endingEnd'),
  ]);
  add('BezierInterpolant', [
    expr('set_tangents', 'in_tangents : FixedArray[Double], out_tangents : FixedArray[Double]', 'Unit', '{ self.inTangents = new Float64Array(in_tangents); self.outTangents = new Float64Array(out_tangents); }'),
    expr('clear_tangents', '', 'Unit', '{ self.inTangents = undefined; self.outTangents = undefined; }'),
  ]);
  add('KeyframeTrack', [
    nullable('create_numeric_interpolant', '', 'Interpolant', 'Array.from(self.values).every(value => typeof value === "number") ? self.createInterpolant() : null'),
  ]);
}
