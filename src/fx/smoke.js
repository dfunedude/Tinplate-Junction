// ===== fx/smoke: smoke-unit puffs from the steam engine's stack =====
import * as THREE from 'three';
import { scene } from '../render/stage.js';
import { VMAX } from '../sim/train.js';

const _stack = new THREE.Vector3();
export class Smoke {
  constructor(n = 110) {
    this.n = n; this.next = 0;
    this.acc = 0;    // puffs owed to the engine
    this.live = 0;   // puffs in the air; none, and there's nothing to move or draw
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3);
    this.size = new Float32Array(n); this.alpha = new Float32Array(n);
    this.age = new Float32Array(n).fill(99); this.life = new Float32Array(n).fill(1); this.s0 = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 }, uColor: { value: new THREE.Color(0xdedbd4) } },
      vertexShader: `uniform float uScale; attribute float size; attribute float alpha; varying float vA;
        void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; varying float vA;
        void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = smoothstep(0.5, 0.05, d) * vA; if (a < 0.004) discard; gl_FragColor = vec4(uColor, a); }`,
      transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.visible = false;
    scene.add(this.points);
  }
  // the puffs dim with the room lamp (L is 1 with it on)
  setLight(L) { this.mat.uniforms.uColor.value.setHex(0xdedbd4).multiplyScalar(0.3 + 0.7 * L); }
  emit(x, y, z, strength) {
    const i = this.next; this.next = (this.next + 1) % this.n;
    this.pos[i * 3] = x + (Math.random() - 0.5) * 0.2; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.2;
    this.vel[i * 3] = (Math.random() - 0.5) * 0.8; this.vel[i * 3 + 1] = 2.5 + Math.random() * 2 + strength * 2.5; this.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    this.age[i] = 0; this.life[i] = 1.6 + Math.random() * 1.2; this.s0[i] = 0.7 + Math.random() * 0.5;
    this.live++;
  }
  // The smoke unit in a steam engine (one whose model has a smoke point) heats with track voltage
  // (volts, 0 to 1) and puffs harder with speed. Then every puff in the air rises and spreads.
  update(dt, train, volts) {
    const loco = train.loco;
    if (train.onTrack && loco && loco.smoke && volts > 0.08) {
      this.acc += dt * (2.5 + train.speed * 0.45) * Math.min(1, volts * 2);
      while (this.acc > 1) {
        this.acc -= 1;
        // sim/train keeps the body's matrix up to date, and the train sits at the origin
        _stack.copy(loco.smoke).applyMatrix4(loco.body.matrix);
        this.emit(_stack.x, _stack.y, _stack.z, train.speed / VMAX);
      }
    }
    if (!this.live) return;
    let live = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.age[i] > this.life[i]) { this.alpha[i] = 0; continue; }
      live++;
      this.age[i] += dt;
      const t = this.age[i] / this.life[i];
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] *= 1 - dt * 0.9;
      this.size[i] = this.s0[i] + t * 4.2;
      this.alpha[i] = Math.min(1, t * 6) * (1 - t) * 0.42;
    }
    this.live = live;
    this.points.visible = live > 0;
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = g.attributes.size.needsUpdate = g.attributes.alpha.needsUpdate = true;
  }
}
