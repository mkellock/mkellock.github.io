// <tech-bg theme="dark|light" intensity="1-10" motif="all|polyhedra|network|topology">
// Fixed full-viewport canvas: rotating wireframe polyhedra, a 3D particle network,
// and an infrastructure topology graph with packets travelling its edges.
(function () {
  if (customElements.get('tech-bg')) return;
  const PHI = (1 + Math.sqrt(5)) / 2;
  const LABELS = ['EKS-PROD-01', 'VPC-AP-SE-2', 'EDGE-LB', 'VAULT', 'CI-RUNNER', 'RDS-PRIMARY', 'OBSERVABILITY', 'IAM', 'S3-ARCHIVE', 'GATEWAY'];

  function solid(verts) {
    let min = Infinity;
    for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) min = Math.min(min, dist(verts[i], verts[j]));
    const edges = [];
    for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) if (dist(verts[i], verts[j]) < min * 1.01) edges.push([i, j]);
    const r = Math.max(...verts.map(v => Math.hypot(v[0], v[1], v[2])));
    return { verts: verts.map(v => [v[0] / r, v[1] / r, v[2] / r]), edges };
  }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  function perms(a, b, c) { const out = []; for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { out.push([0, s1 * a, s2 * b]); out.push([s1 * a, s2 * b, 0]); out.push([s2 * b, 0, s1 * a]); } return out; }
  const ICOSA = solid(perms(1, PHI));
  const OCTA = solid([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
  const DODECA = (() => { const v = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]); return solid(v.concat(perms(1 / PHI, PHI))); })();

  function rot(p, ax, ay, az) {
    let [x, y, z] = p;
    let c = Math.cos(ax), s = Math.sin(ax); [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ay); s = Math.sin(ay); [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(az); s = Math.sin(az); [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  }
  function rand(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  class TechBg extends HTMLElement {
    static get observedAttributes() { return ['theme', 'intensity', 'motif', 'paused']; }
    constructor() {
      super();
      this._theme = 'dark'; this._intensity = 6; this._motif = 'all';
      this.mouse = [0, 0]; this.target = [0, 0];
    }
    set theme(v) { this._theme = v || 'dark'; this.redraw(); }
    get theme() { return this._theme; }
    set intensity(v) { const n = Number(v); if (!isNaN(n)) { const changed = n !== this._intensity; this._intensity = n; if (changed && this.ctx) this.build(); } }
    get intensity() { return this._intensity; }
    set paused(v) { this._paused = v === true || v === 'true'; }
    get paused() { return !!this._paused; }
    set motif(v) { this._motif = v || 'all'; this.redraw(); }
    redraw() { if (this.ctx && this.reduced) this.frame(performance.now()); }
    get motif() { return this._motif; }
    attributeChangedCallback(n, o, v) { this[n] = v; }
    connectedCallback() {
      this.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;display:block';
      this.setAttribute('aria-hidden', 'true');
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'width:100%;height:100%;display:block;filter:blur(1.2px)';
      this.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.reduced = this.getAttribute('respect-reduced-motion') === 'true' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.onResize = () => this.resize();
      this.onMove = e => { this.target = [e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5]; };
      addEventListener('resize', this.onResize);
      addEventListener('pointermove', this.onMove);
      this.build(); this.resize();
      this.t0 = performance.now();
      this.time = 0; this.last = performance.now();
      const loop = now => { const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; if (!this._paused) { this.time += dt; this.frame(now); } if (!this.reduced) this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() { cancelAnimationFrame(this.raf); removeEventListener('resize', this.onResize); removeEventListener('pointermove', this.onMove); }
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.w = this.clientWidth || innerWidth; this.h = this.clientHeight || innerHeight;
      this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.reduced) this.frame(performance.now());
    }
    build() {
      const r = rand(42), k = this._intensity / 10;
      const n = Math.round(50 + 110 * k);
      this.nodes = [];
      for (let i = 0; i < n; i++) this.nodes.push([(r() - 0.5) * 3.4, (r() - 0.5) * 2.0, (r() - 0.5) * 1.8]);
      const hubCount = 7;
      this.hubs = [];
      for (let i = 0; i < hubCount; i++) {
        const a = (i / hubCount) * Math.PI * 2;
        this.hubs.push({ p: [Math.cos(a) * 1.25, (r() - 0.5) * 0.9, Math.sin(a) * 0.75], label: LABELS[i] });
      }
      this.hubEdges = [];
      for (let i = 0; i < hubCount; i++) { this.hubEdges.push([i, (i + 1) % hubCount]); if (i % 2 === 0) this.hubEdges.push([i, (i + 3) % hubCount]); }
      this.hubLinks = this.hubs.map(h => this.nodes.map((p, j) => [dist(p, h.p), j]).sort((a, b) => a[0] - b[0]).slice(0, 4).map(x => x[1]));
      this.packets = [];
      for (let i = 0; i < Math.round(4 + 10 * k); i++) this.packets.push({ e: Math.floor(r() * this.hubEdges.length), t: r(), v: 0.05 + r() * 0.12, dir: r() > 0.5 ? 1 : -1 });
      this.solids = [
        { g: ICOSA, pos: [1.15, -0.25, 0.1], s: 0.48, sp: [0.13, 0.19, 0.05] },
        { g: DODECA, pos: [-1.35, 0.45, -0.2], s: 0.34, sp: [-0.09, 0.14, 0.11] },
        { g: OCTA, pos: [-0.35, -0.7, 0.5], s: 0.2, sp: [0.21, -0.17, 0.08] }
      ];
    }
    frame(now) {
      const ctx = this.ctx, w = this.w, h = this.h; if (!w || !this.nodes) return;
      const t = this.time || 0, k = this._intensity / 10, speed = (0.35 + 0.9 * k) * 0.5;
      const dark = this._theme !== 'light';
      const ink = dark ? '240,240,240' : '15,15,15';
      const accent = '#ffe600';
      const alpha = 0.1 + 0.3 * k;
      const motif = this._motif, show = m => motif === 'all' || motif === m;
      this.mouse[0] += (this.target[0] - this.mouse[0]) * 0.04;
      this.mouse[1] += (this.target[1] - this.mouse[1]) * 0.04;
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w, h) * 0.55, cx = w * 0.5, cy = h * 0.5, cam = 3.2;
      const scroll = (window.scrollY || 0) / 1400;
      const ay = t * 0.05 * speed + this.mouse[0] * 0.5 + scroll, ax = -0.18 + this.mouse[1] * 0.3;
      const proj = p => { const q = rot(p, ax, ay, 0); const z = q[2] + cam; const f = cam / z; return [cx + q[0] * scale * f, cy + q[1] * scale * f, f, q[2]]; };
      ctx.lineWidth = 1;

      if (show('network') || show('topology')) {
        const P = this.nodes.map(proj);
        if (show('network')) {
          const lim = 0.55;
          for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
            const d = dist(this.nodes[i], this.nodes[j]); if (d > lim) continue;
            const a = (1 - d / lim) * alpha * 1.1 * Math.min(P[i][2], P[j][2]);
            ctx.strokeStyle = `rgba(${ink},${a.toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
          }
        }
        for (const p of P) { const s = 1.2 + p[2] * 1.2; ctx.fillStyle = `rgba(${ink},${(alpha * 1.4 * p[2]).toFixed(3)})`; ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); }

        if (show('topology')) {
          const H = this.hubs.map(hb => proj(hb.p));
          ctx.setLineDash([4, 4]);
          for (const [a, b] of this.hubEdges) { ctx.strokeStyle = `rgba(${ink},${(alpha * 0.9).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(H[a][0], H[a][1]); ctx.lineTo(H[b][0], H[b][1]); ctx.stroke(); }
          ctx.setLineDash([]);
          this.hubLinks.forEach((links, i) => links.forEach(j => { ctx.strokeStyle = `rgba(${ink},${(alpha * 0.5).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(H[i][0], H[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); }));
          ctx.font = '600 10px "JetBrains Mono", monospace';
          H.forEach((p, i) => {
            const s = 7 * p[2];
            ctx.strokeStyle = `rgba(${ink},${Math.min(1, alpha * 2.2).toFixed(3)})`;
            ctx.strokeRect(p[0] - s, p[1] - s, s * 2, s * 2);
            ctx.fillStyle = accent; ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
            ctx.fillStyle = `rgba(${ink},${Math.min(1, alpha * 1.8).toFixed(3)})`;
            ctx.fillText(this.hubs[i].label, p[0] + s + 6, p[1] + 3);
          });
          for (const pk of this.packets) {
            pk.t += this._paused ? 0 : pk.v * speed * 0.016 * pk.dir;
            if (pk.t > 1 || pk.t < 0) { pk.e = (pk.e + 1 + Math.floor(Math.random() * 3)) % this.hubEdges.length; pk.t = pk.dir > 0 ? 0 : 1; }
            const [a, b] = this.hubEdges[pk.e];
            const x = H[a][0] + (H[b][0] - H[a][0]) * pk.t, y = H[a][1] + (H[b][1] - H[a][1]) * pk.t;
            ctx.fillStyle = accent; ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
            if (!dark) { ctx.strokeStyle = 'rgba(15,15,15,0.8)'; ctx.strokeRect(x - 2.5, y - 2.5, 5, 5); }
          }
        }
      }

      if (show('polyhedra')) {
        for (const so of this.solids) {
          const r = [t * so.sp[0] * speed, t * so.sp[1] * speed, t * so.sp[2] * speed];
          const V = so.g.verts.map(v => { const q = rot(v, r[0], r[1], r[2]); return proj([so.pos[0] + q[0] * so.s, so.pos[1] + q[1] * so.s, so.pos[2] + q[2] * so.s]); });
          for (const [a, b] of so.g.edges) {
            const depth = (V[a][2] + V[b][2]) / 2;
            ctx.strokeStyle = `rgba(${ink},${Math.min(1, alpha * 1.6 * depth).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(V[a][0], V[a][1]); ctx.lineTo(V[b][0], V[b][1]); ctx.stroke();
          }
          const lead = V.reduce((m, v) => (v[3] < m[3] ? v : m), V[0]);
          ctx.fillStyle = accent; ctx.fillRect(lead[0] - 2, lead[1] - 2, 4, 4);
        }
      }
    }
  }
  customElements.define('tech-bg', TechBg);
})();
