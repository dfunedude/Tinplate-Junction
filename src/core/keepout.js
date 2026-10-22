// ===== core/keepout: the ground the scenery in world/scenery.js stands on =====
// Preset layouts keep their track clear of it (tests/presets.test.js) and trolley wire masts stay off
// it (core/wire.js). If something in world/scenery.js moves, move its zone here too.

export const KEEP_OUT = {
  // [centre x, centre z, radius] in inches: the transformer, the lamp posts, the telegraph poles, the trees
  circles: [[40.5, 23.5, 6.4], [-38.5, -23.2, 1.2], [-19.5, -23.2, 1.2],
    ...[-6, 6, 18, 30, 42].map(x => [x, -27.5, 1.9]),
    ...[[-44, -26], [-41.5, -22.5], [-45, -19], [44, -27], [40.5, -26.5], [44.5, -22], [-44, 25.5], [-40.5, 27]].map(([x, z]) => [x, z, 2.4])],
  // [x0, x1, z0, z1]: the station
  rects: [[-35.5, -22.5, -29.4, -21.8]],
};
