// G - the grab bag of small graphics helpers that the course builds up over time:
// random colors, background fill, and the nested helper classes V (2D vector),
// VS (rectangle as location+size), LoHi (range), BBox (bounding box), PL (polyline),
// HC (hierarchical coordinate) and V.Transform (isomorphic scale + translate).
//
// The Java original used int arithmetic everywhere. Integer division truncates,
// and several formulas (the transform, blending, sub-sampling) depend on that, so
// idiv() is used wherever Java did an int division.
import { Color } from './Color.js';
import { Polygon } from './Graphics.js';

export function idiv(a, b) { return Math.trunc(a / b); }

export class G {
  static rnd(max) { return Math.floor(Math.random() * max); }
  static rndColor() { return Color.rgb(G.rnd(256), G.rnd(256), G.rnd(256)); }
  static fillBack(g) { g.setColor(Color.WHITE); g.fillRect(0, 0, 3000, 3000); }
  static fillBackground(g, c) { g.setColor(c); g.fillRect(0, 0, 3000, 3000); }
  static drawCircle(g, x, y, r) { g.drawOval(x - r, y - r, r + r, r + r); }

  // parabolic spline drawn directly with lines; n is the recursion depth
  static spline(g, ax, ay, bx, by, cx, cy, n) {
    if (n === 0) { g.drawLine(ax, ay, cx, cy); return; }
    const abx = idiv(ax + bx, 2), aby = idiv(ay + by, 2);
    const bcx = idiv(bx + cx, 2), bcy = idiv(by + cy, 2);
    const abcx = idiv(abx + bcx, 2), abcy = idiv(aby + bcy, 2);
    G.spline(g, ax, ay, abx, aby, abcx, abcy, n - 1);
    G.spline(g, abcx, abcy, bcx, bcy, cx, cy, n - 1);
  }

  // parabolic spline written into the shared polygon buffer G.poly (appendix)
  static pSpline(xa, ya, xb, yb, xc, yc, n) {
    if (n === 0) { G.poly.addPoint(xa, ya); G.poly.addPoint(xc, yc); return; }
    const xab = idiv(xa + xb, 2), yab = idiv(ya + yb, 2), xbc = idiv(xb + xc, 2), ybc = idiv(yb + yc, 2);
    const xabc = idiv(xab + xbc, 2), yabc = idiv(yab + ybc, 2);
    G.pSpline(xa, ya, xab, yab, xabc, yabc, n - 1);
    G.pSpline(xabc, yabc, xbc, ybc, xc, yc, n - 1);
  }
}
G.poly = new Polygon();

//-----------------------V------------------------
export class V {
  constructor(x, y) {
    if (x instanceof V) { this.set(x); } else { this.set(x, y); }
  }
  set(x, y) {
    if (x instanceof V) { this.x = x.x; this.y = x.y; } else { this.x = x; this.y = y; }
  }
  add(v) { this.x += v.x; this.y += v.y; }
  // incremental average: this already holds the average of k values, v is the (k+1)th
  blend(v, k) { this.set(idiv(k * this.x + v.x, k + 1), idiv(k * this.y + v.y, k + 1)); }
  setT(v) { this.set(v.tx(), v.ty()); }
  tx() { const T = V.T; return idiv(this.x * T.n, T.d) + T.dx; }
  ty() { const T = V.T; return idiv(this.y * T.n, T.d) + T.dy; }
}

//-----------------------Transform------------------------
// (x',y') = (x*n/d + dx, y*n/d + dy). One scale factor (n/d) so aspect ratio is preserved.
export class Transform {
  constructor() { this.dx = 0; this.dy = 0; this.n = 1; this.d = 1; }
  setScale(oW, oH, nW, nH) { this.n = (nW > nH) ? nW : nH; this.d = (oW > oH) ? oW : oH; }
  setOff(oX, oW, nX, nW) { return idiv((-oX - idiv(oW, 2)) * this.n, this.d) + nX + idiv(nW, 2); }
  // set(VS, VS) or set(BBox, VS)
  set(from, to) {
    if (from instanceof BBox) {
      this.setScale(from.h.size(), from.v.size(), to.size.x, to.size.y);
      this.dx = this.setOff(from.h.lo, from.h.size(), to.loc.x, to.size.x);
      this.dy = this.setOff(from.v.lo, from.v.size(), to.loc.y, to.size.y);
    } else {
      this.setScale(from.size.x, from.size.y, to.size.x, to.size.y);
      this.dx = this.setOff(from.loc.x, from.size.x, to.loc.x, to.size.x);
      this.dy = this.setOff(from.loc.y, from.size.y, to.loc.y, to.size.y);
    }
  }
}
V.Transform = Transform;
V.T = new Transform();

//-----------------------VS-----------------------
export class VS {
  constructor(x, y, w, h) { this.loc = new V(x, y); this.size = new V(w, h); }
  fill(g, c) { g.setColor(c); g.fillRect(this.loc.x, this.loc.y, this.size.x, this.size.y); }
  hit(x, y) {
    return this.loc.x <= x && this.loc.y <= y && x <= (this.loc.x + this.size.x) && y <= (this.loc.y + this.size.y);
  }
  xL() { return this.loc.x; }
  xH() { return this.loc.x + this.size.x; }
  xM() { return idiv(this.loc.x + this.loc.x + this.size.x, 2); }
  yL() { return this.loc.y; }
  yH() { return this.loc.y + this.size.y; }
  yM() { return idiv(this.loc.y + this.loc.y + this.size.y, 2); }
}

//-----------------------LoHi---------------------
export class LoHi { // range from lo to hi
  constructor(min, max) { this.lo = min; this.hi = max; }
  set(v) { this.lo = v; this.hi = v; }
  add(v) { if (v < this.lo) { this.lo = v; } if (v > this.hi) { this.hi = v; } }
  size() { return (this.hi - this.lo) > 0 ? this.hi - this.lo : 1; } // never 0: we divide by it
  constrain(v) { if (v < this.lo) { return this.lo; } return (v < this.hi) ? v : this.hi; }
}

//-----------------------BBox---------------------
export class BBox { // Bounding Box
  constructor() { this.h = new LoHi(0, 0); this.v = new LoHi(0, 0); }
  set(x, y) { this.h.set(x); this.v.set(y); }
  add(x, y) {
    if (x instanceof V) { this.h.add(x.x); this.v.add(x.y); } else { this.h.add(x); this.v.add(y); }
  }
  getNewVS() { return new VS(this.h.lo, this.v.lo, this.h.hi - this.h.lo, this.v.hi - this.v.lo); }
  draw(g) { g.drawRect(this.h.lo, this.v.lo, this.h.hi - this.h.lo, this.v.hi - this.v.lo); }
}

//-----------------------PL-----------------------
export class PL { // Polyline: a fixed size array of V
  constructor(count) {
    this.points = new Array(count);
    for (let i = 0; i < count; i++) { this.points[i] = new V(0, 0); }
  }
  size() { return this.points.length; }
  drawN(g, n) {
    for (let i = 1; i < n; i++) {
      g.drawLine(this.points[i - 1].x, this.points[i - 1].y, this.points[i].x, this.points[i].y);
    }
    if (PL.showDots) { this.drawNDots(g, n); }
  }
  draw(g) { this.drawN(g, this.points.length); }
  drawNDots(g, n) {
    g.setColor(Color.BLUE);
    for (let i = 0; i < n; i++) { G.drawCircle(g, this.points[i].x, this.points[i].y, 4); }
  }
  transform() { for (let i = 0; i < this.points.length; i++) { this.points[i].setT(this.points[i]); } }
}
PL.showDots = false; // debug aid from the sub-sampling lesson: draw a dot at every point

//--------------------Hierarchical Coordinate------------------
// every coordinate has a dad (possibly ZERO) and is an offset from dad.
// Note: the course text has v() return 0 when dad is ZERO, which would put the
// page top at y=0 instead of at pageTop.dv. The intent is clearly dad.v()+dv all
// the way down, with ZERO contributing 0, which is what this does.
export class HC {
  constructor(dad, dv) { this.dad = dad; this.dv = dv; }
  v() { return this.dad == null ? this.dv : this.dad.v() + this.dv; }
}
HC.ZERO = new HC(null, 0);

G.V = V; G.VS = VS; G.LoHi = LoHi; G.BBox = BBox; G.PL = PL; G.HC = HC; G.Transform = Transform;
