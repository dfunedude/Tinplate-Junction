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
// a streetcar with one pole up to the wire and the other hooked down
const STREETCAR_SIL = `<path d="M3.5 16V9.5Q3.5 6 7 6h34q3.5 0 3.5 3.5V16z"/><rect x="10" y="3.6" width="28" height="3" rx="1.2"/><path style="fill:var(--deck-raised)" d="M7.5 8.5h3v3.5h-3zM13 8.5h3v3.5h-3zM18.5 8.5h3v3.5h-3zM24 8.5h3v3.5h-3zM29.5 8.5h3v3.5h-3zM35 8.5h3v3.5h-3zM40.5 8.5h1.5v3.5h-1.5z"/><path d="M30 3.6L12 0.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M18 3.6L36 2.6" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>${wheel(10, 19, 2.3)}${wheel(15, 19, 2.3)}${wheel(33, 19, 2.3)}${wheel(38, 19, 2.3)}`;
const SIL = {
  steam: `<rect x="3" y="3" width="10" height="13" rx="1"/><rect x="10" y="7" width="24" height="9" rx="4.5"/><rect x="29" y="3" width="3" height="5"/><path d="M34 12h4l3 5h-7z"/>${wheel(17, 18.5, 3.4)}${wheel(25, 18.5, 3.4)}${wheel(8)}${wheel(36, 20, 1.8)}`,
  f3: `<path d="M3 16V6a2 2 0 0 1 2-2h28c6 0 11 5 12 12z"/>${wheel(10)}${wheel(15)}${wheel(31)}${wheel(36)}`,
  gp9: `<rect x="2" y="14" width="44" height="2"/><rect x="5" y="7" width="24" height="7" rx="1.5"/><rect x="29" y="3" width="7" height="11" rx="1"/><rect x="36" y="8" width="7" height="6" rx="1.5"/>${wheel(10)}${wheel(15)}${wheel(33)}${wheel(38)}`,
  boxcar: `<rect x="3" y="3" width="42" height="13" rx="1"/><rect x="20" y="5" width="8" height="10" style="fill:var(--deck-raised)"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  hopper: `<path d="M4 4h40v8l-8 5H12l-8-5z"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  tank: `<rect x="3" y="6" width="42" height="10" rx="5"/><rect x="14" y="3" width="5" height="4"/><rect x="29" y="3" width="5" height="4"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  gondola: `<rect x="3" y="9" width="42" height="7" rx="1"/><rect x="9" y="5" width="5" height="4" rx="1"/><rect x="17" y="5" width="5" height="4" rx="1"/><rect x="26" y="5" width="5" height="4" rx="1"/><rect x="34" y="5" width="5" height="4" rx="1"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  flatcar: `<rect x="2" y="13" width="44" height="3"/><circle cx="18" cy="9" r="4"/><circle cx="27" cy="9" r="4"/><circle cx="22.5" cy="4.5" r="3.5"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  caboose: `<rect x="5" y="6" width="38" height="10" rx="1"/><rect x="19" y="2" width="10" height="5" rx="1"/><rect x="2" y="15" width="44" height="1.5"/>${wheel(10)}${wheel(15)}${wheel(33)}${wheel(38)}`,  charger: `<path d="M2 16V5.5A1.5 1.5 0 0 1 3.5 4H33l5 4.5 6 4V16z"/><path style="fill:var(--deck-raised)" d="M34 6l3.4 3H34z"/>${wheel(9)}${wheel(14)}${wheel(33)}${wheel(38)}`,
  coach: `<rect x="2" y="4" width="44" height="12" rx="3"/><path style="fill:var(--deck-raised)" d="M7 7h4v3H7zM13.5 7h4v3h-4zM20 7h4v3h-4zM26.5 7h4v3h-4zM33 7h4v3h-4zM39.5 7h3v3h-3z"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  bilevel: `<rect x="2" y="1" width="44" height="15" rx="2.5"/><path style="fill:var(--deck-raised)" d="M6 4h5v3H6zM13 4h5v3h-5zM20 4h5v3h-5zM27 4h5v3h-5zM34 4h5v3h-5zM6 10h5v3H6zM13 10h5v3h-5zM30 10h5v3h-5zM37 10h5v3h-5zM21.5 9h5v7h-5z"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  subway: `<rect x="2" y="3" width="44" height="13" rx="2"/><path style="fill:var(--deck-raised)" d="M5 6h5v4H5zM12.5 6h2v8h-2zM17 6h5v4h-5zM24 6h2v8h-2zM28.5 6h5v4h-5zM35.5 6h2v8h-2z"/><circle cx="42" cy="8" r="2" style="fill:var(--deck-raised)"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  subwaycar: `<rect x="2" y="3" width="44" height="13" rx="2"/><path style="fill:var(--deck-raised)" d="M5 6h5v4H5zM12.5 6h2v8h-2zM17 6h5v4h-5zM24 6h2v8h-2zM28.5 6h5v4h-5zM35.5 6h2v8h-2zM40 6h4v4h-4z"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  highspeed: `<path d="M2 16V7a3 3 0 0 1 3-3h18c9 0 17 5 23 12z"/><path style="fill:var(--deck-raised)" d="M26 5.6c3.6.6 7 2.2 9.6 4.4H26z"/><path d="M8 4l4.5-3 3.5 3" fill="none" stroke="currentColor" stroke-width="1.2"/>${wheel(9)}${wheel(14)}${wheel(31)}${wheel(36)}`,
  hscoach: `<rect x="2" y="4" width="44" height="12" rx="4"/><path style="fill:var(--deck-raised)" d="M6 7h3v2.5H6zM11 7h3v2.5h-3zM16 7h3v2.5h-3zM21 7h3v2.5h-3zM26 7h3v2.5h-3zM31 7h3v2.5h-3zM36 7h3v2.5h-3zM41 7h2v2.5h-2z"/>${wheel(8)}${wheel(13)}${wheel(35)}${wheel(40)}`,
  hstail: `<g transform="matrix(-1 0 0 1 48 0)"><path d="M2 16V7a3 3 0 0 1 3-3h18c9 0 17 5 23 12z"/><path style="fill:var(--deck-raised)" d="M26 5.6c3.6.6 7 2.2 9.6 4.4H26z"/><path d="M8 4l4.5-3 3.5 3" fill="none" stroke="currentColor" stroke-width="1.2"/>${wheel(9)}${wheel(14)}${wheel(31)}${wheel(36)}</g>`,
  trolley: `${STREETCAR_SIL}<circle cx="45" cy="13" r="1.3"/>`,
  trolleycar: STREETCAR_SIL,
  opencar: `<rect x="3" y="4.6" width="42" height="2.6" rx="1.2"/><rect x="10" y="2.4" width="28" height="2.6" rx="1"/><rect x="3" y="12.6" width="42" height="3.4" rx="0.6"/><path d="M4 7h1.4v6H4zM10.5 7h1.4v6h-1.4zM17 7h1.4v6H17zM23.5 7h1.4v6h-1.4zM30 7h1.4v6H30zM36.5 7h1.4v6h-1.4zM42.6 7h1.4v6h-1.4z"/><path d="M7 10h2.6v2.6H7zM13.5 10h2.6v2.6h-2.6zM20 10h2.6v2.6H20zM26.5 10h2.6v2.6h-2.6zM33 10h2.6v2.6H33zM39 10h2.6v2.6H39z"/>${wheel(10, 19, 2.3)}${wheel(15, 19, 2.3)}${wheel(33, 19, 2.3)}${wheel(38, 19, 2.3)}`,
};
export const sil = t => `<svg viewBox="0 0 48 22" fill="currentColor" aria-hidden="true">${SIL[t]}</svg>`;
