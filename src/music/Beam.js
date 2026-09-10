// Beam - a beamed group: a sorted list of stems and a drawing machine that stacks
// parallelogram "beam stacks" between them (and beamlets on stems that need more
// flags than a neighbor). The first and last stem define the master beam line.
import { Color } from '../graphics/Color.js';
import { Polygon } from '../graphics/Graphics.js';
import { idiv } from '../graphics/G.js';
import { Mass } from '../reaction/Mass.js';
import { Stem } from './Stem.js';

export class Beam extends Mass {
  constructor(a, b) {
    super('NOTE');
    this.stems = new Stem.List();
    this.stems.push(a, b);
    a.beam = this; b.beam = this;
    a.nFlag = 1; b.nFlag = 1; // a beamed stem has at least one flag
    this.stems.sort();
  }

  first() { return this.stems[0]; }
  last() { return this.stems[this.stems.length - 1]; }
  setMasterBeam() { Beam.setMasterBeam(this.first().x(), this.first().yBeamEnd(), this.last().x(), this.last().yBeamEnd()); }

  deleteBeam() {
    for (const s of this.stems) { s.beam = null; } // stems, flags and dots still exist; only the beams go
    this.deleteMass();
  }
  addStem(s) { if (s.beam == null) { this.stems.push(s); s.beam = this; this.stems.sort(); } }
  removeStem(s) { // losing a supporting stem deletes the whole beam; an internal one just leaves
    if (s === this.first() || s === this.last()) { this.deleteBeam(); } else { this.stems.removeStem(s); this.stems.sort(); }
  }

  show(g) { g.setColor(Color.BLACK); if (this.stems.length >= 2) { this.drawBeamGroup(g); } }

  drawBeamGroup(g) {
    this.setMasterBeam(); // defines the master beam coords mx1, my1, mx2, my2
    const firstStem = this.first();
    const H = firstStem.staff.H(), sH = firstStem.isUp ? H : -H; // signed H: stacks grow toward the heads
    let nPrev = 0, nCur = firstStem.nFlag, nNext = this.stems[1].nFlag; // flag counts for 3 stems
    let px, cx = firstStem.x(); // x of the previous and current stems
    let bx = cx + 3 * H; // a forward leaning beamlet on the first stem runs from cx to bx
    if (nCur > nNext) { Beam.drawBeamStack(g, nNext, nCur, cx, bx, sH); } // beamlets on the first stem point right
    for (let cur = 1; cur < this.stems.length; cur++) {
      const sCur = this.stems[cur]; px = cx; cx = sCur.x();
      nPrev = nCur; nCur = nNext; nNext = (cur < this.stems.length - 1) ? this.stems[cur + 1].nFlag : 0;
      const nBack = Math.min(nPrev, nCur);
      Beam.drawBeamStack(g, 0, nBack, px, cx, sH); // full beams back to the previous stem
      if (nCur > nPrev && nCur > nNext) { // beamlets on this stem, leaning toward the side with more beams
        if (nPrev < nNext) { bx = cx + 3 * H; Beam.drawBeamStack(g, nNext, nCur, cx, bx, sH); }
        else { bx = cx - 3 * H; Beam.drawBeamStack(g, nPrev, nCur, bx, cx, sH); }
      }
    }
  }

  // ---------- statics: the master beam buffer and sloped line math ----------
  static mx1 = 0; static my1 = 0; static mx2 = 0; static my2 = 0;
  static poly = new Polygon([0, 0, 0, 0], [0, 0, 0, 0], 4); // one reusable 4 point buffer

  static setMasterBeam(x1, y1, x2, y2) { Beam.mx1 = x1; Beam.my1 = y1; Beam.mx2 = x2; Beam.my2 = y2; }
  // y on a sloped segment: yOfX(x) uses the master beam buffer, yOfX(x,x1,y1,x2,y2) any segment
  static yOfX(x, x1, y1, x2, y2) {
    if (arguments.length === 1) { x1 = Beam.mx1; y1 = Beam.my1; x2 = Beam.mx2; y2 = Beam.my2; }
    const dy = y2 - y1, dx = x2 - x1;
    if (dx === 0) { return y1; }
    return idiv((x - x1) * dy, dx) + y1;
  }
  static verticalLineCrossesSegment(x, y1, y2, bx, by, ex, ey) {
    if (x < bx || x > ex) { return false; }
    const y = Beam.yOfX(x, bx, by, ex, ey);
    return (y1 < y2) ? (y1 < y && y < y2) : (y2 < y && y < y1);
  }
  // draws beams n1..n2-1 (0 is the master beam) between x1 and x2, each h tall, 2h apart
  static drawBeamStack(g, n1, n2, x1, x2, h) {
    const y1 = Beam.yOfX(x1), y2 = Beam.yOfX(x2);
    for (let i = n1; i < n2; i++) {
      Beam.setPoly(x1, y1 + i * 2 * h, x2, y2 + i * 2 * h, h);
      g.fillPolygon(Beam.poly);
    }
  }
  static setPoly(x1, y1, x2, y2, h) {
    let a = Beam.poly.xpoints; a[0] = x1; a[1] = x2; a[2] = x2; a[3] = x1;
    a = Beam.poly.ypoints; a[0] = y1; a[1] = y2; a[2] = y2 + h; a[3] = y1 + h;
  }
}
