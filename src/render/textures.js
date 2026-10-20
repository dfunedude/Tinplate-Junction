// ===== render/textures: procedural canvas textures (felt, wood, lettering, glows) =====
import * as THREE from 'three';
import { PI, TAU } from '../core/geometry.js';
import { renderer } from './stage.js';

export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function canvasTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function feltTexture() {
  // painted-plywood-under-grass-mat look: muted sage with soft mottling and fibre speckle
  const W = 1536, H = 960, c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#5f6b4f'; g.fillRect(0, 0, W, H);
  const r = rng(7);
  for (let i = 0; i < 180; i++) {
    const x = r() * W, y = r() * H, rad = 50 + r() * 170;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const light = r() > 0.5;
    grd.addColorStop(0, light ? 'rgba(140,150,110,0.045)' : 'rgba(40,48,32,0.055)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 16;
    d[i] += n; d[i + 1] += n * 1.05; d[i + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);
  return canvasTex(c);
}
export function woodTexture(base, dark, w = 1024, h = 256, planks = 0) {
  const c = makeCanvas(w, h), g = c.getContext('2d'), r = rng(11);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const y = r() * h, a = 0.05 + r() * 0.12;
    g.strokeStyle = `rgba(${dark},${a})`; g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 3 + (r() - 0.5) * 2);
    g.stroke();
  }
  if (planks) {
    for (let i = 0; i <= planks; i++) {
      const y = (i / planks) * h;
      g.fillStyle = `rgba(${dark},0.55)`; g.fillRect(0, y - 1.5, w, 3);
      const off = r() * w;
      g.fillRect(off, y, 3, h / planks);
    }
  }
  return canvasTex(c);
}
function glowTexture() {
  const c = makeCanvas(128, 128), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return canvasTex(c, false);
}
function poolTexture() {
  // the soft cone a headlight throws on the table: brightest near the lamp, feathered edges
  const W = 256, H = 128, c = makeCanvas(W, H), g = c.getContext('2d'), img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = (y - H / 2) / (H / 2);
    const spread = 0.12 + u * 0.9;
    const side = Math.max(0, 1 - Math.pow(Math.abs(v) / spread, 2));
    const along = Math.pow(1 - u, 1.6) * Math.min(1, u * 14);
    const a = side * along;
    const i = (y * W + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(255 * a);
  }
  g.putImageData(img, 0, 0);
  return canvasTex(c, false);
}
function spokeTexture() {
  // a boxpok-style driver face: black centre, white-wall nickel tyre
  const c = makeCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#d6d6d0'; g.beginPath(); g.arc(128, 128, 128, 0, TAU); g.fill();
  g.fillStyle = '#18181a'; g.beginPath(); g.arc(128, 128, 104, 0, TAU); g.fill();
  g.strokeStyle = '#3c3c40'; g.lineWidth = 10;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * 22, 128 + Math.sin(a) * 22); g.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.stroke();
  }
  g.fillStyle = '#26262a'; g.beginPath(); g.arc(128, 128, 98, -0.7, 0.7 + PI * 0.25); g.lineTo(128, 128); g.closePath(); g.fill();
  g.fillStyle = '#5c5c60'; g.beginPath(); g.arc(128, 128, 22, 0, TAU); g.fill();
  return canvasTex(c);
}
function coalTexture() {
  const c = makeCanvas(256, 256), g = c.getContext('2d'), r = rng(5);
  g.fillStyle = '#121214'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = 20 + r() * 60;
    g.fillStyle = `rgb(${v},${v},${v + 4})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 4, 1 + r() * 4);
  }
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function textTexture(lines, { w = 512, h = 128, color = '#ece4d4', weight = 700, squash = 0.78 } = {}) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = color; g.textBaseline = 'middle';
  const rows = lines.length;
  lines.forEach((ln, i) => {
    const [text, size = 0.62] = Array.isArray(ln) ? ln : [ln];
    const px = Math.round(h / rows * size);
    g.save();
    g.font = `${weight} ${px}px "Arial Narrow", Arial, Helvetica, sans-serif`;
    const y = h / rows * (i + 0.5);
    g.translate(w / 2, y);
    g.scale(squash, 1);
    g.textAlign = 'center';
    g.fillText(text, 0, 0, (w - 12) / squash);
    g.restore();
  });
  return canvasTex(c);
}

export const TEX = { glow: glowTexture(), pool: poolTexture(), spoke: spokeTexture(), coal: coalTexture() };
