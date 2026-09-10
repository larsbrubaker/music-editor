// Head - a note head: a staff, a line (its pitch position) and a Time (its x).
// Heads are created stemless; an S-S stroke beside a head stems (or unstems) every
// head at that Time that the stroke crosses. Whole/half/quarter comes from the stem.
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';
import { idiv } from '../graphics/G.js';
import { Mass } from '../reaction/Mass.js';
import { Reaction } from '../reaction/Reaction.js';
import { Glyph } from './Glyph.js';
import { Stem } from './Stem.js';

export class Head extends Mass {
  constructor(staff, x, y) {
    super('NOTE');
    this.forcedGlyph = null; // set to override normalGlyph() (tremolos, shaped notes)
    this.staff = staff;
    this.line = staff.lineOfY(y);
    this.stem = null;        // heads are created with no stem so the user can choose the direction..
    this.time = staff.sys.getTime(x); // ..so heads, in order to have an x, have a Time
    this.wrongSide = false;  // set by the stem when this head is a second away from its neighbor
    this.time.addHead(this);

    this.addReaction(new Reaction('S-S', // stem or unStem heads
      (g) => {
        const gx = g.vs.xM(), y1 = g.vs.yL(), y2 = g.vs.yH();
        const W = this.W(), yH = this.y();
        if (yH < y1 || yH > y2) { return UC.noBid; } // heads outside the y range reject this gesture
        const hLeft = this.time.x, hRight = hLeft + W; // left and right side of the Head
        if (gx < hLeft - W || gx > hRight + W) { return UC.noBid; } // must be reasonably close to a head
        // Math.abs, not the course's raw difference: a stroke through the head's interior
        // is past the side it is bidding on, and a negative bid beats every other bidder.
        if (gx < (hLeft + idiv(W, 2))) { return Math.abs(hLeft - gx); }
        if (gx > (hRight - idiv(W, 2))) { return Math.abs(gx - hRight); }
        return UC.noBid;
      },
      (g) => {
        const gx = g.vs.xM(), y1 = g.vs.yL(), y2 = g.vs.yH();
        const up = gx > (this.time.x + idiv(this.W(), 2)); // a stroke to the right of the head is an up stem
        if (this.stem == null) { Stem.getStem(this.staff, this.time, y1, y2, up); }
        else { this.time.unStemHeads(y1, y2); }
      }));

    this.addReaction(new Reaction('DOT', // dot the stem that this head is on
      (g) => {
        const xh = this.x(), yh = this.y(), h = this.staff.H(), w = this.W();
        const gx = g.vs.xM(), gy = g.vs.yM();
        // this.stem == null is a deviation: the course bids, wins, and then its act does
        // nothing, so a no-op gesture lands on Gesture.UNDO and beats the real bidders.
        if (this.stem == null || gx < xh || gx > xh + 2 * w || gy < yh - h || gy > yh + h) { return UC.noBid; }
        return Math.abs(xh + w - gx) + Math.abs(yh - gy);
      },
      (g) => { if (this.stem != null) { this.stem.cycleDot(); } }));
  }

  show(g) {
    const H = this.staff.H();
    g.setColor(this.stem == null ? Color.RED : Color.BLACK); // red says "no stem yet"
    (this.forcedGlyph != null ? this.forcedGlyph : this.normalGlyph()).showAt(g, H, this.x(), this.y());
    if (this.stem != null) {
      const off = UC.augDotOffset, sp = UC.augDotSpacing;
      for (let i = 0; i < this.stem.nDot; i++) {
        g.fillOval(this.time.x + off + i * sp, this.y() - idiv(3 * H, 2), idiv(H, 2), idiv(H, 2));
      }
    }
  }

  normalGlyph() {
    if (this.stem == null) { return Glyph.HEAD_Q; }
    if (this.stem.nFlag === -1) { return Glyph.HEAD_HALF; }
    if (this.stem.nFlag === -2) { return Glyph.HEAD_W; }
    return Glyph.HEAD_Q;
  }

  W() { return idiv(24 * this.staff.H(), 10); } // width of a note head: RIGHT = LEFT + W()
  y() { return this.staff.yLine(this.line); }
  x() {
    let res = this.time.x;
    if (this.wrongSide) { res += (this.stem != null && this.stem.isUp) ? this.W() : -this.W(); }
    return res;
  }

  unStem() {
    if (this.stem != null) { this.stem.removeHead(this); } // removeHead also nulls stem and wrongSide, and deletes an empty stem
  }

  // sort order: by staff, then by line (top to bottom)
  compareTo(h) { return (this.staff.iStaff !== h.staff.iStaff) ? this.staff.iStaff - h.staff.iStaff : this.line - h.line; }
  toString() { return ' Head:' + this.line; }
}
