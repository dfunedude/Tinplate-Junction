// ===== stock/catalog: every engine and car on the Train tab =====
import { LIVERIES } from './liveries.js';
import { buildSteam, buildTender } from './steam.js';
import { buildF3, buildGP9 } from './diesels.js';
import { buildBoxcar, buildHopper, buildTank, buildGondola, buildFlatcar, buildCaboose } from './freight.js';
import { buildCharger, buildCoach, buildBilevel } from './passenger.js';
import { buildSubway, buildSubwayCar } from './transit.js';
import { buildHighSpeed, buildPowerCarRear, buildHsCoach } from './highspeed.js';

// Each builder returns { front, back, pivots, body, trucks, spin, head?, lamps?, update? }.
// Local frame: +x forward, y up from the rail head, z to the right.
// `set` is the kind of train it belongs to (see FAMILIES); `tail` cars stay at the back of the train.
export const VEHICLES = {
  steam: { name: '2-6-4 Steam', kind: 'loco', set: 'freight', sound: 'whistle', build: buildSteam },
  f3: { name: 'F3 Diesel', kind: 'loco', set: 'freight', sound: 'horn', build: buildF3 },
  gp9: { name: 'GP9 Diesel', kind: 'loco', set: 'freight', sound: 'horn', build: buildGP9 },
  tender: { name: 'Tender', kind: 'tender', set: 'freight', build: buildTender },
  boxcar: { name: 'Boxcar', set: 'freight', build: buildBoxcar },
  hopper: { name: 'Hopper', set: 'freight', build: buildHopper },
  tank: { name: 'Tank car', set: 'freight', build: buildTank },
  gondola: { name: 'Gondola', set: 'freight', build: buildGondola },
  flatcar: { name: 'Log car', set: 'freight', build: buildFlatcar },
  caboose: { name: 'Caboose', set: 'freight', tail: true, build: buildCaboose },
  charger: { name: 'Charger Diesel', kind: 'loco', set: 'passenger', sound: 'chime', build: buildCharger },
  coach: { name: 'Coach', set: 'passenger', build: buildCoach },
  bilevel: { name: 'Bi-level', set: 'passenger', build: buildBilevel },
  subway: { name: 'Subway', kind: 'loco', set: 'subway', sound: 'horn', build: buildSubway },
  subwaycar: { name: 'Subway car', set: 'subway', build: buildSubwayCar },
  highspeed: { name: 'High-speed', kind: 'loco', set: 'highspeed', sound: 'chime', build: buildHighSpeed },
  hscoach: { name: 'High-speed car', set: 'highspeed', build: buildHsCoach },
  hstail: { name: 'Rear power car', set: 'highspeed', tail: true, build: buildPowerCarRear },
};
// The kinds of train, each with the train it comes out of the box as. In a matched set the cars
// wear the engine's paint scheme.
const starter = (...types) => types.map(type => ({ type, li: 0 }));
export const FAMILIES = {
  freight: { name: 'Freight', train: starter('steam', 'boxcar', 'hopper', 'tank', 'caboose') },
  passenger: { name: 'Passenger', matched: true, train: starter('charger', 'coach', 'coach', 'coach') },
  subway: { name: 'Subway', matched: true, train: starter('subway', 'subwaycar', 'subwaycar', 'subwaycar') },
  highspeed: { name: 'High-speed', matched: true, train: starter('highspeed', 'hscoach', 'hscoach', 'hscoach', 'hstail') },
};
export function buildVehicle(type, li = 0) {
  const list = LIVERIES[type];
  const idx = ((li % list.length) + list.length) % list.length;
  const v = VEHICLES[type].build(list[idx], idx);
  v.type = type;
  v.li = idx;
  return v;
}
