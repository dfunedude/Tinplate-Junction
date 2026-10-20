// ===== ui/icons: inline SVG for the track palette and the engine and car chips =====

const ICON = {
  rails: d => `<svg viewBox="0 0 44 24" aria-hidden="true"><g fill="none" stroke-linecap="round"><path d="${d}" stroke="currentColor" stroke-width="5.5"/><path d="${d}" style="stroke:var(--deck-raised)" stroke-width="1.8"/></g></svg>`,
};
export const PALETTE = [
  ['straight', 'Straight', ICON.rails('M5 12H39')],
  ['half', 'Half', ICON.rails('M13 12H31')],
  ['curveL', 'Curve left', ICON.rails('M5 19Q25 19 37 6')],
  ['curveR', 'Curve right', ICON.rails('M5 5Q25 5 37 18')],
  ['switchL', 'Switch left', ICON.rails('M5 16H39M9 16Q24 16 37 5')],
  ['switchR', 'Switch right', ICON.rails('M5 8H39M9 8Q24 8 37 19')],
  ['cross90', 'Crossing', ICON.rails('M9 4L35 20M9 20L35 4')],
  ['bumper', 'Bumper', ICON.rails('M5 12H31') .replace('</g>', '<path d="M35 5V19" stroke="currentColor" stroke-width="4"/></g>')],
];
const wheel = (x, y = 19, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const SIL = {
  steam: `<rect x="3" y="3" width="10" height="13" rx="1"/><rect x="10" y="7" width="24" height="9" rx="4.5"/><rect x="29" y="3" width="3" height="5"/><path d="M34 12h4l3 5h-7z"/>${wheel(17, 18.5, 3.4)}${wheel(25, 18.5, 3.4)}${wheel(8)}${wheel(36, 20, 1.8)}`,
  f3: `<path d="M3 16V6a2 2 0 0 1 2-2h28c6 0 11 5 12 12z"/>${wheel(10)}${wheel(15)}${wheel(31)}${wheel(36)}`,
  gp9: `<rect x="2" y="14" width="44" height="2"/><rect x="5" y="7" width="24" height="7" rx="1.5"/><rect x="29" y="3" width="7" height="11" rx="1"/><rect x="36" y="8" width="7" height="6" rx="1.5"/>${wheel(10)}${wheel(15)}${wheel(33)}${wheel(38)}`,
  boxcar: `<rect x="3" y="3" width="42" height="13" rx="1"/><rect x="20" y="5" width="8" height="10" style="fill:var(--deck-raised)"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  hopper: `<path d="M4 4h40v8l-8 5H12l-8-5z"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  tank: `<rect x="3" y="6" width="42" height="10" rx="5"/><rect x="14" y="3" width="5" height="4"/><rect x="29" y="3" width="5" height="4"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  gondola: `<rect x="3" y="9" width="42" height="7" rx="1"/><rect x="9" y="5" width="5" height="4" rx="1"/><rect x="17" y="5" width="5" height="4" rx="1"/><rect x="26" y="5" width="5" height="4" rx="1"/><rect x="34" y="5" width="5" height="4" rx="1"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  flatcar: `<rect x="2" y="13" width="44" height="3"/><circle cx="18" cy="9" r="4"/><circle cx="27" cy="9" r="4"/><circle cx="22.5" cy="4.5" r="3.5"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  caboose: `<rect x="5" y="6" width="38" height="10" rx="1"/><rect x="19" y="2" width="10" height="5" rx="1"/><rect x="2" y="15" width="44" height="1.5"/>${wheel(10)}${wheel(15)}${wheel(33)}${wheel(38)}`,
};
export const sil = t => `<svg viewBox="0 0 48 22" fill="currentColor" aria-hidden="true">${SIL[t]}</svg>`;
