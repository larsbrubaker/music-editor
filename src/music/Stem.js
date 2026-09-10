// Stem - a vertical line joining one or more heads at one Time. It knows the stem
// layout rules: which end the heads are on, one octave long by default, longer for
// more than 2 flags, always reaching the center line if it points toward it, and
// which heads must be displaced to the "wrong side" because they are a second apart.
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';
import { Reaction } from '../reaction/Reaction.js';
import { Duration } from './Duration.js';
import { Glyph } from './Glyph.js';
import { Beam } from './Beam.js';

export class Stem extends Duration {
  constructor(staff, heads, up) {
    super();
    this.staff = staff;
    this.beam = null; // default for a stem is no Beam
    this.isUp = up;
    for (const h of heads) { h.unStem(); h.stem = this; } // heads leave any previous stem and join this one
    this.heads = heads;
    staff.sys.stems.addStem(this); // the new stem goes into the list kept by the Sys
    this.setWrongSides();

    const crossBid = (g) => { // a horizontal stroke crossing this stem; +60 lets the Sys beam reaction (50) win
      const y = g.vs.yM(), x1 = g.vs.xL(), x2 = g.vs.xH(), xS = this.x();
      if (x1 > xS || x2 < xS) { return UC.noBid; }
      const y1 = this.yLo(), y2 = this.yHi();
      if (y < y1 || y > y2) { return UC.noBid; }
      return Math.abs(y - Math.trunc((y1 + y2) / 2)) + 60;
    };
    this.addReaction(new Reaction('E-E', crossBid, (g) => { this.incFlag(); }));
    this.addReaction(new Reaction('W-W', crossBid, (g) => {
      this.decFlag();
      if (this.nFlag === 0 && this.beam != null) { this.beam.deleteBeam(); } // unflagged stems can't stay beamed
    }));
  }

  // factory: a stem for the heads at time whose y is between y1 and y2, or null
  static getStem(staff, time, y1, y2, up) {
    const heads = [];
    for (const h of time.heads) { const yH = h.y(); if (yH > y1 && yH < y2) { heads.push(h); } }
    if (heads.length === 0) { return null; } // no stem created if no heads
    const b = Stem.internalStem(staff.sys, time.x, y1, y2); // possibly an internal stem of a beamed group
    const res = new Stem(staff, heads, up);
    if (b != null) { b.addStem(res); res.nFlag = 1; } // if it was internal then join the beam
    return res;
  }

  // the beam whose master beam the vertical line (x, y1..y2) crosses, or null
  static internalStem(sys, x, y1, y2) {
    for (const s of sys.stems) {
      if (s.beam != null && s.x() < x && s.yLo() < y2 && s.yHi() > y1) {
        const bx = s.beam.first().x(), by = s.beam.first().yBeamEnd();
        const ex = s.beam.last().x(), ey = s.beam.last().yBeamEnd();
        if (Beam.verticalLineCrossesSegment(x, y1, y2, bx, by, ex, ey)) { return s.beam; }
      }
    }
    return null;
  }

  show(g) {
    if (this.nFlag >= -1 && this.heads.length > 0) { // guard: whole notes have no stem, empty stems are mid-deletion
      const x = this.x(), h = this.staff.H(), yB = this.yBeamEnd();
      g.setColor(Color.BLACK);
      g.drawLine(x, this.yFirstHead(), x, yB);
      if (this.nFlag > 0 && this.beam == null) {
        const up = this.isUp;
        if (this.nFlag === 1) { (up ? Glyph.FLAG1D : Glyph.FLAG1U).showAt(g, h, x, yB); }
        if (this.nFlag === 2) { (up ? Glyph.FLAG2D : Glyph.FLAG2U).showAt(g, h, x, yB); }
        if (this.nFlag === 3) { (up ? Glyph.FLAG3D : Glyph.FLAG3U).showAt(g, h, x, yB); }
        if (this.nFlag === 4) { (up ? Glyph.FLAG4D : Glyph.FLAG4U).showAt(g, h, x, yB); }
      }
    }
  }

  // heads are sorted top to bottom; for an up stem the first head (note end) is the last in the list
  firstHead() { return this.heads[this.isUp ? this.heads.length - 1 : 0]; }
  lastHead() { return this.heads[this.isUp ? 0 : this.heads.length - 1]; }
  yFirstHead() {
    if (this.heads.length === 0) { return 200; } // guard empty stems
    const h = this.firstHead(); return h.staff.yLine(h.line);
  }
  yBeamEnd() {
    if (this.heads.length === 0) { return 100; } // guard empty stems
    if (this.beam == null || this.beam.first() === this || this.beam.last() === this) {
      const h = this.lastHead();
      let line = h.line;
      line += (this.isUp ? -7 : 7); // one octave from the last head toward the beam end
      const flagInc = this.nFlag > 2 ? 2 * (this.nFlag - 2) : 0; // 2 more lines for every flag over 2
      line += (this.isUp ? -flagInc : flagInc);
      if ((this.isUp && line > 4) || (!this.isUp && line < 4)) { line = 4; } // meet the center line if we must
      return h.staff.yLine(line);
    }
    this.beam.setMasterBeam(); // an internal stem ends on the master beam
    return Beam.yOfX(this.x());
  }
  x() {
    if (this.heads.length === 0) { return 100; } // guard empty stems
    const h = this.firstHead(); return h.time.x + (this.isUp ? h.W() : 0);
  }
  yLo() { return this.isUp ? this.yBeamEnd() : this.yFirstHead(); }
  yHi() { return this.isUp ? this.yFirstHead() : this.yBeamEnd(); }

  removeHead(h) {
    const i = this.heads.indexOf(h); if (i >= 0) { this.heads.splice(i, 1); }
    if (this.heads.length === 0) { this.deleteStem(); }
    h.stem = null;
    h.wrongSide = false;
  }
  deleteStem() { // only call if heads is empty
    if (this.heads.length !== 0) { console.log('wtf? - deleting a stem that had heads on it'); }
    this.staff.sys.stems.removeStem(this);
    if (this.beam != null) { this.beam.removeStem(this); }
    this.deleteMass();
  }

  setWrongSides() { // the first head is always on the right side; a neighbor one line away goes on the wrong side
    this.heads.sort((a, b) => a.compareTo(b));
    let i, last, next;
    if (this.isUp) { i = this.heads.length - 1; last = 0; next = -1; } else { i = 0; last = this.heads.length - 1; next = 1; }
    let ph = this.heads[i]; ph.wrongSide = false;
    while (i !== last) {
      i += next;
      const nh = this.heads[i];
      nh.wrongSide = (ph.staff === nh.staff) && Math.abs(nh.line - ph.line) <= 1 && !ph.wrongSide;
      ph = nh;
    }
  }

  compareTo(s) { return this.x() - s.x(); }
  toString() { return 'Stem:' + (this.isUp ? '^[' : 'v[') + this.heads.map((h) => h.line).join(',') + ']'; }
}

//------------- Stem.List
Stem.List = class extends Array {
  static get [Symbol.species]() { return Array; }
  constructor() { super(); this.yMin = 1000000; this.yMax = -1000000; } // loose bounds for fast rejection
  addStem(s) {
    this.push(s);
    for (const y of [s.yFirstHead(), s.yBeamEnd()]) { if (y < this.yMin) { this.yMin = y; } if (y > this.yMax) { this.yMax = y; } }
  }
  removeStem(s) { const i = this.indexOf(s); if (i >= 0) { this.splice(i, 1); } }
  sort() { return super.sort((a, b) => a.compareTo(b)); }
  fastReject(y1, y2) { return y1 > this.yMax || y2 < this.yMin; } // no stem can possibly meet this y range
  allIntersectors(x1, y1, x2, y2) { // every stem crossed by the sloped segment (x1,y1)-(x2,y2)
    const res = [];
    for (const s of this) {
      const x = s.x(), y = Beam.yOfX(x, x1, y1, x2, y2);
      if (x > x1 && x < x2 && y > s.yLo() && y < s.yHi()) { res.push(s); }
    }
    return res;
  }
};
