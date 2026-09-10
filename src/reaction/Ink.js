// Ink - a single mouse stroke: a Norm (the stroke sub-sampled and scaled into a
// 1000x1000 box) plus the VS box where it actually happened on the screen.
// Ink.BUFFER is the single Ink.Buffer that captures the raw mouse points.
import { V, VS, BBox, PL, idiv } from '../graphics/G.js';
import { UC } from '../graphics/UC.js';

//--------------------Norm---------------------
// A polyline in the normalized coordinate system, always N points, 0..MAX.
export class Norm extends PL {
  static N = UC.normSampleSize;
  static MAX = UC.normCoordMax;
  static NCS = new VS(0, 0, Norm.MAX, Norm.MAX); // the coordinate box for Transforms

  constructor(fromBuffer = true) {
    super(Norm.N);
    if (fromBuffer) {                // the usual case: normalize whatever is in Ink.BUFFER
      Ink.BUFFER.subSample(this);
      V.T.set(Ink.BUFFER.bbox, Norm.NCS);
      this.transform();
    }
  }

  // this already averages nBlend norms; fold one more in
  blend(norm, nBlend) {
    for (let i = 0; i < Norm.N; i++) { this.points[i].blend(norm.points[i], nBlend); }
  }

  // squared Euclidean distance; only used for comparisons so no square root needed
  dist(n) {
    let res = 0;
    for (let i = 0; i < Norm.N; i++) {
      const dx = this.points[i].x - n.points[i].x, dy = this.points[i].y - n.points[i].y;
      res += dx * dx + dy * dy;
    }
    return res;
  }

  drawAt(g, vs) { // expands the Norm to fit in vs
    V.T.set(Norm.NCS, vs); // prepare to move from normalized CS to vs
    for (let i = 1; i < Norm.N; i++) {
      g.drawLine(this.points[i - 1].tx(), this.points[i - 1].ty(), this.points[i].tx(), this.points[i].ty());
    }
  }

  toJSON() { const a = []; for (const p of this.points) { a.push(p.x, p.y); } return a; }
  static fromJSON(arr, norm = new Norm(false)) {
    for (let i = 0; i < Norm.N; i++) { norm.points[i].set(arr[2 * i] | 0, arr[2 * i + 1] | 0); }
    return norm;
  }
}

//-------------------Ink.Buffer-----------
// Captures one stroke. It is also an I.Area so an app can hand it the mouse directly.
export class Buffer extends PL {
  static MAX = UC.inkBufferMax;
  constructor() { super(Buffer.MAX); this.n = 0; this.bbox = new BBox(); }
  add(x, y) { if (this.n < Buffer.MAX) { this.points[this.n++].set(x, y); this.bbox.add(x, y); } }
  clear() { this.n = 0; }
  // Sub-sample the n captured points down to the k points of pl.
  // The course picks points by index (subSampleByIndex): quick, and fine when the
  // mouse delivers plenty of samples. Pointer events on a fast flick (or a touch
  // screen, or an automated test) can deliver only a handful, and then index
  // sampling piles all k points onto the first sample. So by default this port
  // resamples by arc length: k points spaced evenly along the drawn path.
  subSample(pl) { if (Buffer.arcLength) { this.subSampleByArcLength(pl); } else { this.subSampleByIndex(pl); } }

  subSampleByIndex(pl) {
    const k = pl.size(), n = this.n;
    for (let i = 0; i < k; i++) { pl.points[i].set(this.points[idiv(i * (n - 1), k - 1)]); }
  }

  subSampleByArcLength(pl) {
    const k = pl.size(), n = this.n, pts = this.points;
    if (n < 2) { for (let i = 0; i < k; i++) { pl.points[i].set(pts[0]); } return; }
    const cum = [0]; // cumulative length at each captured point
    for (let i = 1; i < n; i++) { cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); }
    const total = cum[n - 1];
    if (total === 0) { for (let i = 0; i < k; i++) { pl.points[i].set(pts[0]); } return; }
    let j = 1;
    for (let i = 0; i < k; i++) {
      const target = total * i / (k - 1);
      while (j < n - 1 && cum[j] < target) { j++; }
      const seg = cum[j] - cum[j - 1], t = seg === 0 ? 0 : (target - cum[j - 1]) / seg;
      pl.points[i].set(Math.round(pts[j - 1].x + (pts[j].x - pts[j - 1].x) * t), Math.round(pts[j - 1].y + (pts[j].y - pts[j - 1].y) * t));
    }
  }
  show(g) { this.drawN(g, this.n); if (Buffer.showBBox) { this.bbox.draw(g); } }
  hit(x, y) { return true; } // any point COULD go into ink
  dn(x, y) { this.clear(); this.bbox.set(x, y); this.add(x, y); } // first point resets the bbox
  drag(x, y) { this.add(x, y); }
  up(x, y) { this.add(x, y); }
}
Buffer.showBBox = false; // debug aid from the Bounding Box lesson
Buffer.arcLength = true; // false: the course's index sub-sampling (see the Subsampling lesson)

export class Ink {
  constructor() {
    this.norm = new Norm();                 // loads from BUFFER
    this.vs = Ink.BUFFER.bbox.getNewVS();   // where the ink was on the screen
  }
  show(g) { g.setColor(UC.inkColor); this.norm.drawAt(g, this.vs); }
}
Ink.Norm = Norm;
Ink.Buffer = Buffer;
Ink.BUFFER = new Buffer();
Ink.List = class extends Array {
  static get [Symbol.species]() { return Array; }
  show(g) { for (const ink of this) { ink.show(g); } }
};
