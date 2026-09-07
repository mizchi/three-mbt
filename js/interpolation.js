import { LinearInterpolant, DiscreteInterpolant, CubicInterpolant, QuaternionLinearInterpolant, BezierInterpolant } from 'three';

// Copy input arrays; numeric interpolants cannot be backed by string/boolean tracks.
export const linearInterpolant = (positions, values, size) => new LinearInterpolant(new Float64Array(positions), new Float64Array(values), size);
export const discreteInterpolant = (positions, values, size) => new DiscreteInterpolant(new Float64Array(positions), new Float64Array(values), size);
export const cubicInterpolant = (positions, values, size) => new CubicInterpolant(new Float64Array(positions), new Float64Array(values), size);
export const quaternionLinearInterpolant = (positions, values, size) => new QuaternionLinearInterpolant(new Float64Array(positions), new Float64Array(values), size);
export const bezierInterpolant = (positions, values, size) => new BezierInterpolant(new Float64Array(positions), new Float64Array(values), size);
