// ===== state: the live layout, train, sound and smoke, and what the controls are doing =====
import { Layout } from './core/layout.js';
import { Train } from './sim/train.js';
import { Smoke } from './fx/smoke.js';
import { Sound } from './fx/sound.js';

export const layout = new Layout();
export const views = new Map();
export const sound = new Sound();
export const smoke = new Smoke();
export const train = new Train(layout);
export const state = { mode: 'run', throttle: 0, lampOn: true, dark: 0, sel: null, active: null, undo: [], drag: null };
export const DEFAULT_CONSIST = [{ type: 'steam', li: 0 }, { type: 'boxcar', li: 0 }, { type: 'hopper', li: 0 }, { type: 'tank', li: 0 }, { type: 'caboose', li: 0 }];
export const MAX_CARS = 11;
