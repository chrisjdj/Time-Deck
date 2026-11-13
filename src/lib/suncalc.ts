// suncalc is CommonJS; normalise the default/namespace interop across Vite dev, Rollup and Vitest.
import * as NS from 'suncalc';

const SunCalc = (Reflect.get(NS, 'default') ?? NS) as typeof NS;
export default SunCalc;
