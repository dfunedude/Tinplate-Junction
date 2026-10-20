// ===== fx/sound: synthesized motor, track, switch and whistle sounds (Web Audio) =====
import { VMAX } from '../sim/train.js';

export class Sound {
  constructor() { this.ctx = null; this.on = true; this.lastClick = 0; this.voice = null; this.last = { sp: -1, v: -1 }; }
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    let ctx;
    try { ctx = new AC(); } catch (e) { return; }
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.on ? 0.9 : 0; this.master.connect(ctx.destination);
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = nb;
    // open-frame AC motor: a buzzy growl that rises with speed
    this.motor = ctx.createOscillator(); this.motor.type = 'sawtooth'; this.motor.frequency.value = 50;
    this.motor2 = ctx.createOscillator(); this.motor2.type = 'square'; this.motor2.frequency.value = 75;
    this.motorLP = ctx.createBiquadFilter(); this.motorLP.type = 'lowpass'; this.motorLP.frequency.value = 300; this.motorLP.Q.value = 3;
    this.motorGain = ctx.createGain(); this.motorGain.gain.value = 0;
    const m2g = ctx.createGain(); m2g.gain.value = 0.35;
    this.motor.connect(this.motorLP); this.motor2.connect(m2g); m2g.connect(this.motorLP);
    this.motorLP.connect(this.motorGain); this.motorGain.connect(this.master);
    // transformer hum
    this.hum = ctx.createOscillator(); this.hum.type = 'sine'; this.hum.frequency.value = 120;
    this.humGain = ctx.createGain(); this.humGain.gain.value = 0;
    this.hum.connect(this.humGain); this.humGain.connect(this.master);
    // tinplate rumble
    this.roll = ctx.createBufferSource(); this.roll.buffer = nb; this.roll.loop = true;
    this.rollBP = ctx.createBiquadFilter(); this.rollBP.type = 'bandpass'; this.rollBP.frequency.value = 650; this.rollBP.Q.value = 0.8;
    this.rollGain = ctx.createGain(); this.rollGain.gain.value = 0;
    this.roll.connect(this.rollBP); this.rollBP.connect(this.rollGain); this.rollGain.connect(this.master);
    for (const s of [this.motor, this.motor2, this.hum, this.roll]) s.start();
  }
  // silence everything while the page is hidden; a later tap or init() wakes it again
  pause() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
  setOn(on) {
    this.on = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }
  update(speed, volts) {
    if (!this.ctx) return;
    const sp = Math.min(1, speed / VMAX), v = volts > 0.04 ? volts : 0;
    // only reschedule the audio parameters when something audible changed
    if (Math.abs(sp - this.last.sp) < 0.002 && v === this.last.v) return;
    this.last.sp = sp; this.last.v = v;
    const t = this.ctx.currentTime;
    this.motor.frequency.setTargetAtTime(42 + 150 * sp, t, 0.1);
    this.motor2.frequency.setTargetAtTime(63 + 225 * sp, t, 0.1);
    this.motorLP.frequency.setTargetAtTime(220 + 950 * sp, t, 0.1);
    this.motorGain.gain.setTargetAtTime(sp > 0.01 ? 0.025 + 0.06 * sp : 0, t, 0.12);
    this.humGain.gain.setTargetAtTime(v ? 0.008 + 0.014 * v : 0, t, 0.15);
    this.rollGain.gain.setTargetAtTime(sp * 0.05, t, 0.12);
  }
  burst({ f = 2500, q = 3, gain = 0.1, dur = 0.05, type = 'bandpass', delay = 0 } = {}) {
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = type; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t, Math.random() * 1.5, dur + 0.02);
  }
  tone(f, dur, gain, type = 'sine', delay = 0) {
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  joint(speed) {
    if (!this.ctx || speed < 1) return;
    const now = performance.now();
    if (now - this.lastClick < 38) return;
    this.lastClick = now;
    this.burst({ f: 2300 + Math.random() * 900, q: 4, gain: 0.03 + 0.07 * Math.min(1, speed / VMAX), dur: 0.035 });
  }
  snap() { if (!this.ctx) return; this.burst({ f: 3200, q: 6, gain: 0.12, dur: 0.04 }); this.tone(1900, 0.06, 0.03, 'triangle', 0.01); }
  clack() { if (!this.ctx) return; this.burst({ f: 900, q: 1.5, gain: 0.16, dur: 0.07 }); this.burst({ f: 1600, q: 2, gain: 0.1, dur: 0.05, delay: 0.09 }); }
  thud(speed) { if (!this.ctx) return; const v = Math.min(1, speed / VMAX); this.tone(70, 0.3, 0.12 + 0.2 * v); this.burst({ f: 500, q: 0.7, gain: 0.08 + 0.15 * v, dur: 0.12, type: 'lowpass' }); }
  // Hold-to-sound whistle (air chime in the tender) or diesel horn (a buzzy DC horn).
  signal(down, kind) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (!down) {
      if (this.voice) { const v = this.voice; v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0.0001, t, 0.07); setTimeout(() => v.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 600); this.voice = null; }
      return;
    }
    if (this.voice) return;
    const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(this.master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'whistle' ? 2000 : 1500; lp.connect(g);
    const nodes = [];
    const freqs = kind === 'whistle' ? [311, 370, 466] : [233, 277];
    const vib = ctx.createOscillator(); vib.frequency.value = kind === 'whistle' ? 5.5 : 31;
    const vibG = ctx.createGain(); vibG.gain.value = kind === 'whistle' ? 2.5 : 6; vib.connect(vibG); nodes.push(vib);
    for (const f of freqs) {
      const o = ctx.createOscillator(); o.type = kind === 'whistle' ? 'triangle' : 'sawtooth'; o.frequency.value = f;
      vibG.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = kind === 'whistle' ? 0.33 : 0.22;
      o.connect(og); og.connect(lp); nodes.push(o);
    }
    if (kind === 'whistle') {
      const n = ctx.createBufferSource(); n.buffer = this.noise; n.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.2;
      const ng = ctx.createGain(); ng.gain.value = 0.35;
      n.connect(bp); bp.connect(ng); ng.connect(lp); nodes.push(n);
    }
    nodes.forEach(n => n.start(t));
    g.gain.setTargetAtTime(kind === 'whistle' ? 0.16 : 0.12, t, 0.05);
    this.voice = { g, nodes };
  }
}
