// Bar - a barline through every staff of a system. barType: 0 single, 1 double,
// 2 fine; with the LEFT/RIGHT bits set it is a repeat with dots on that side.
// Double bars can also carry a Key signature change.
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';
import { idiv } from '../graphics/G.js';
import { Mass } from '../reaction/Mass.js';
import { Reaction } from '../reaction/Reaction.js';
import { Key } from './Key.js';
import { Glyph } from './Glyph.js';

const FAT = 2, RIGHT = 4, LEFT = 8; // bits in barType

export class Bar extends Mass {
  constructor(sys, x) {
    super('BACK');
    this.sys = sys; this.barType = 0; this.key = null; // most bars do NOT define a key
    this.x = x;
    const right = sys.page.margins.right;
    if (Math.abs(right - x) < UC.barToMarginSnap) { this.x = right; } // snap to the right margin

    this.addReaction(new Reaction('S-S', // cycle this Bar's type
      (g) => {
        const gx = g.vs.xM();
        if (Math.abs(gx - this.x) > UC.barToMarginSnap) { return UC.noBid; }
        const y1 = g.vs.yL(), y2 = g.vs.yH();
        if (y1 < this.sys.yTop() - 20 || y2 > this.sys.yBot() + 20) { return UC.noBid; } // both ends in sys range
        return Math.abs(gx - this.x);
      },
      (g) => { this.cycleType(); }));

    this.addReaction(new Reaction('DOT', // repeat dots on the side of the bar that was dotted
      (g) => {
        const gx = g.vs.xM(), y = g.vs.yM();
        if (y < this.sys.yTop() || y > this.sys.yBot()) { return UC.noBid; }
        const dist = Math.abs(gx - this.x);
        if (dist > 3 * this.sys.page.maxH) { return UC.noBid; }
        return dist;
      },
      (g) => { if (g.vs.xM() < this.x) { this.toggleLeft(); } else { this.toggleRight(); } }));

    const keyBid = (g) => { // a horizontal stroke crossing a double bar inside the system
      if (this.barType !== 1) { return UC.noBid; } // keys only change on double bars
      const x1 = g.vs.xL(), x2 = g.vs.xH();
      if (x1 > this.x || x2 < this.x) { return UC.noBid; }
      const y = g.vs.yM();
      if (y < this.sys.yTop() || y > this.sys.yBot()) { return UC.noBid; }
      return Math.abs(this.x - idiv(x1 + x2, 2)); // how far the gesture midpoint is from the bar
    };
    this.addReaction(new Reaction('E-E', keyBid, (g) => { this.incKey(); }));
    this.addReaction(new Reaction('W-W', keyBid, (g) => { this.decKey(); }));
  }

  cycleType() { this.barType++; if (this.barType > 2) { this.barType = 0; } }
  toggleLeft() { this.barType = this.barType ^ LEFT; }
  toggleRight() { this.barType = this.barType ^ RIGHT; }

  // Key UI: inc/dec move n; a dec on a sharp key (or inc on a flat key) switches to
  // naturals, which cancel the key; inc/dec from naturals goes to 1 sharp / 1 flat.
  incKey() {
    if (this.key == null) { this.key = new Key(); }
    if (this.key.glyph === Glyph.NATURAL) { this.key.glyph = Glyph.SHARP; this.key.n = 1; return; }
    if (this.key.glyph === Glyph.FLAT) { this.key.glyph = Glyph.NATURAL; return; }
    if (this.key.n < 7) { this.key.n++; }
  }
  decKey() {
    if (this.key == null) { this.key = new Key(); }
    if (this.key.glyph === Glyph.NATURAL) { this.key.glyph = Glyph.FLAT; this.key.n = -1; return; }
    if (this.key.glyph === Glyph.SHARP) { this.key.glyph = Glyph.NATURAL; return; }
    if (this.key.n > -7) { this.key.n--; }
  }

  show(g) {
    g.setColor(Color.BLACK);
    let y1 = 0, y2 = 0; // top and bottom of the current connected component
    let justSawBreak = true; // true at the top of a new connected component
    for (const staff of this.sys.staffs) {
      const sf = staff.fmt;
      if (justSawBreak) { y1 = staff.yTop(); } // remember the start of the connected component
      y2 = staff.yBot();
      if (!sf.barContinues) { this.drawLines(g, this.x, y1, y2); } // lines show only at the end of a component
      justSawBreak = !sf.barContinues;
      if (this.barType > 3) { this.drawDots(g, this.x, staff.yTop()); } // dots on every staff of a repeat
    }
    if (this.barType === 1 && this.key != null) { this.key.drawOnSys(g, this.sys, this.x + UC.barKeyOffset); }
  }

  drawLines(g, x, y1, y2) {
    const H = this.sys.page.maxH, t = this.barType;
    if (t === 0) { Bar.thinBar(g, x, y1, y2); }
    if (t === 1) { Bar.thinBar(g, x, y1, y2); Bar.thinBar(g, x - H, y1, y2); }
    if (t === 2) { Bar.fatBar(g, x - H, y1, y2, H); Bar.thinBar(g, x - 2 * H, y1, y2); }
    if (t >= 4) {
      Bar.fatBar(g, x - H, y1, y2, H); // all repeats have a fat bar
      if ((t & LEFT) !== 0) { Bar.thinBar(g, x - 2 * H, y1, y2); Bar.wings(g, x - 2 * H, y1, y2, -H, H); }
      if ((t & RIGHT) !== 0) { Bar.thinBar(g, x + H, y1, y2); Bar.wings(g, x + H, y1, y2, H, H); }
    }
  }
  drawDots(g, x, top) { // from the top of a single staff; assumes 5 lines
    const H = this.sys.page.maxH;
    if ((this.barType & LEFT) !== 0) {
      g.fillOval(x - 3 * H, top + idiv(11 * H, 4), idiv(H, 2), idiv(H, 2));
      g.fillOval(x - 3 * H, top + idiv(19 * H, 4), idiv(H, 2), idiv(H, 2));
    }
    if ((this.barType & RIGHT) !== 0) {
      g.fillOval(x + idiv(3 * H, 2), top + idiv(11 * H, 4), idiv(H, 2), idiv(H, 2));
      g.fillOval(x + idiv(3 * H, 2), top + idiv(19 * H, 4), idiv(H, 2), idiv(H, 2));
    }
  }
  static wings(g, x, y1, y2, dx, dy) { g.drawLine(x, y1, x + dx, y1 - dy); g.drawLine(x, y2, x + dx, y2 + dy); }
  static fatBar(g, x, y1, y2, dx) { g.fillRect(x, y1, dx, y2 - y1); }
  static thinBar(g, x, y1, y2) { g.drawLine(x, y1, x, y2); }
}
Bar.FAT = FAT; Bar.RIGHT = RIGHT; Bar.LEFT = LEFT;
