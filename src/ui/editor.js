// ===== ui/editor: laying, dragging, rotating and deleting track; switches; presets =====
import { PI, TAU, TABLE_W, TABLE_D, normAng, clamp } from '../core/geometry.js';
import { APPEND } from '../core/pieces.js';
import { PRESETS, appendPiece, buildPreset } from '../core/presets.js';
import { PieceView, showMarkers } from '../world/track.js';
import { layout, views, sound, train, overhead, state } from '../state.js';
import { save } from '../storage.js';
import { toast } from './dom.js';
import { updateStat, updateButtons } from './hud.js';
import { view } from './camera.js';

export function syncViews() {
  for (const [p, v] of views) if (!layout.pieces.includes(p)) { v.dispose(); views.delete(p); }
  for (const p of layout.pieces) { if (!views.has(p)) views.set(p, new PieceView(p)); else views.get(p).sync(); }
  overhead.invalidate();
  refreshMarkers(); highlight(); updateStat(); updateButtons();
}
// the open ends get markers in Track mode; the active one (where the next piece goes) stands out
export function refreshMarkers() {
  const free = layout.freeEnds();
  if (state.active && !free.some(f => f.p === state.active.p && f.i === state.active.i)) state.active = null;
  const a = state.active;
  showMarkers(state.mode === 'track' ? free : [], f => !!a && a.p === f.p && a.i === f.i);
}
export function highlight() {
  for (const [p, v] of views) {
    let mode = null;
    if (state.mode === 'track' && p === state.sel) mode = state.drag && state.drag.snap ? 'snap' : 'sel';
    v.setHighlight(mode);
  }
}
function pushUndo() { state.undo.push(JSON.stringify(layout.serialize())); if (state.undo.length > 80) state.undo.shift(); updateButtons(); }
function pieceOffTable(p) {
  for (const r of p.def.routes) for (let i = 0; i <= 8; i++) {
    const q = layout.toWorld(p, r.at(r.len * i / 8));
    if (Math.abs(q.x) > TABLE_W / 2 - 1.4 || Math.abs(q.z) > TABLE_D / 2 - 1.4) return true;
  }
  return false;
}
function freeEndNear(x, z) {
  let best = null, bd = Infinity;
  for (const f of layout.freeEnds()) { const d = Math.hypot(f.x - x, f.z - z); if (d < bd) { bd = d; best = f; } }
  return best ? { p: best.p, i: best.i } : null;
}
function freeSpot() {
  const t = view.target;
  for (let r = 0; r < 60; r += 6) for (let a = 0; a < TAU; a += PI / 4) {
    const x = clamp(t.x + Math.cos(a) * r, -38, 38), z = clamp(t.z + Math.sin(a) * r, -20, 20);
    if (layout.pieces.every(p => { const c = layout.center(p); return Math.hypot(c.x - x, c.z - z) > 11; })) return { x, z };
    if (r === 0) break;
  }
  return { x: t.x, z: t.z };
}
export function addPiece(kind) {
  sound.init();
  const a = APPEND[kind];
  pushUndo();
  let p, next;
  if (state.active) {
    ({ p, next } = appendPiece(layout, layout.endWorld(state.active.p, state.active.i), kind));
  } else {
    const spot = freeSpot();
    p = layout.add(a.type, 0, 0, 0); next = a.next;
    const c = layout.center(p); p.x = spot.x - c.x; p.z = spot.z - c.z;
  }
  if (pieceOffTable(p)) {
    layout.remove(p); state.undo.pop(); updateButtons();
    toast('No room there. That piece would hang off the table.');
    return;
  }
  layout.connectAll();
  state.active = next >= 0 && !p.conn[next] ? { p, i: next } : freeEndNear(layout.center(p).x, layout.center(p).z);
  state.sel = p;
  if (p.conn.some(Boolean)) sound.snap();
  trackChanged([p]);
}
export function rotateSel() {
  const p = state.sel;
  if (!p) { toast('Tap a piece first, then rotate it.'); return; }
  pushUndo();
  const before = { x: p.x, z: p.z, rot: p.rot };
  const linked = p.conn.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
  if (linked.length === 1) {
    // swing the piece around the joint it hangs from: flips curves, turns switches
    const ci = linked[0], c = p.conn[ci];
    const pose = layout.poseFor(p.type, (ci + 1) % p.def.ends.length, layout.endWorld(c.p, c.i));
    Object.assign(p, pose);
  } else {
    const c0 = layout.center(p);
    p.rot = normAng(p.rot + PI / 4);
    const c1 = layout.center(p);
    p.x += c0.x - c1.x; p.z += c0.z - c1.z;
  }
  if (pieceOffTable(p)) { Object.assign(p, before); state.undo.pop(); updateButtons(); toast('No room to turn it that way.'); return; }
  layout.connectAll();
  if (state.active && state.active.p === p) state.active = null;
  if (!state.active) { const fi = p.conn.findIndex(c => !c); state.active = fi >= 0 ? { p, i: fi } : null; }
  trackChanged([p]);
}
export function deleteSel() {
  let p = state.sel;
  if (!p && state.active) p = state.active.p;
  if (!p) { toast('Tap a piece to select it first.'); return; }
  pushUndo();
  const nb = p.conn.filter(Boolean).map(c => ({ p: c.p, i: c.i }));
  layout.remove(p);
  layout.connectAll();
  state.sel = null;
  state.active = nb[0] || null;
  trackChanged([p]);
}
export function undo() {
  const s = state.undo.pop();
  if (!s) { toast('Nothing to undo.'); return; }
  // the old pieces are replaced wholesale, so lift the train (remembering where it was) and set it back down
  train.lift();
  layout.load(JSON.parse(s));
  state.sel = null; state.active = null;
  syncViews();
  autoPlaceTrain();
  save();
}
function trackChanged(changed) {
  syncViews();
  // a piece under the train moved or vanished: lift it (lift() remembers where) and set it back down
  if (train.onTrack && train.path.segs.some(g => changed.includes(g.p) || !layout.pieces.includes(g.p))) train.lift();
  if (!train.onTrack) autoPlaceTrain();
  save();
}
export function autoPlaceTrain() {
  if (train.onTrack || !layout.pieces.length) return false;
  const p = train.lastPose;
  if (p && train.placeNear(p.x, p.z, p.h)) return true;
  // otherwise start on the first plain straight
  const s = layout.pieces.find(q => q.type === 'straight') || layout.pieces[0];
  const c = layout.toWorld(s, s.def.routes[0].at(s.def.routes[0].len));
  return train.placeNear(c.x, c.z, c.h);
}
export function throwSwitch(p) {
  sound.init();
  if (train.occupies(p)) { toast('A train is standing on that switch.'); return; }
  train.cutAt(p);
  p.state ^= 1;
  sound.clack();
  save();
}
export function loadPreset(key) {
  pushUndo();
  if (key === 'clear') {
    layout.clear(); train.lift(); train.lastPose = null;
    state.sel = null; state.active = null;
    syncViews(); save();
    toast('Table cleared. Pick a piece to start laying track.');
    return;
  }
  buildPreset(layout, key);
  state.sel = null; state.active = null;
  train.lift(); train.lastPose = null;
  syncViews();
  autoPlaceTrain();
  save();
  toast(`${PRESETS[key].name} laid out.`);
}
// Dragging works in table coordinates: ui/input turns the pointer into a point on the table.
export function beginDrag(p, at) {
  pushUndo();
  if (train.onTrack && train.path.uses(p)) train.lift();
  const pt = at || { x: p.x, z: p.z };
  state.drag = { p, start: { x: p.x, z: p.z, rot: p.rot }, off: { x: p.x - pt.x, z: p.z - pt.z }, snap: null };
  if (state.active && state.active.p === p) state.active = null;
  p.lifted = true;
  layout.connectAll();
  overhead.invalidate();   // the wire comes off the piece while it's carried
  state.sel = p;
  refreshMarkers(); highlight();
}
export function dragMove(pt) {
  const d = state.drag, p = d.p;
  if (!pt) return;
  p.x = clamp(pt.x + d.off.x, -TABLE_W / 2, TABLE_W / 2);
  p.z = clamp(pt.z + d.off.z, -TABLE_D / 2, TABLE_D / 2);
  p.rot = d.start.rot;
  let best = null;
  const free = layout.freeEnds(p);
  for (let i = 0; i < p.def.ends.length; i++) {
    const e = layout.endWorld(p, i);
    for (const f of free) { const dd = Math.hypot(e.x - f.x, e.z - f.z); if (dd < 3.4 && (!best || dd < best.d)) best = { d: dd, i, f }; }
  }
  if (best) Object.assign(p, layout.poseFor(p.type, best.i, best.f));
  d.snap = best;
  views.get(p).sync();
  highlight();
}
export function endDrag(commit) {
  const d = state.drag, p = d.p;
  p.lifted = false;
  if (!commit || pieceOffTable(p)) {
    Object.assign(p, d.start);
    if (commit) toast('Keep the track on the table.');
  }
  state.drag = null;
  layout.connectAll();
  if (commit && d.snap) sound.snap();
  if (!state.active) state.active = freeEndNear(p.x, p.z);
  trackChanged([p]);
}
