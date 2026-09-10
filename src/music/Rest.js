// Rest - a Duration with no pitch, drawn on the center line of its staff.
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';
import { idiv } from '../graphics/G.js';
import { Reaction } from '../reaction/Reaction.js';
import { Duration } from './Duration.js';
import { Glyph } from './Glyph.js';

export class Rest extends Duration {
  static glyphs = [Glyph.REST_W, Glyph.REST_H, Glyph.REST_Q, Glyph.REST_1F, Glyph.REST_2F, Glyph.REST_3F, Glyph.REST_4F];

  constructor(staff, time) {
    super();
    this.staff = staff; this.time = time;
    this.line = 4; // the default location of any rest: the center line

    const crossBid = (g) => { // a horizontal stroke crossing the rest's x, on the rest's own staff
      const y = g.vs.yM(), x1 = g.vs.xL(), x2 = g.vs.xH(), x = this.time.x;
      if (x1 > x || x2 < x) { return UC.noBid; }
      // Deviation from the course, which has no y bound here: a rest then bids on any
      // horizontal stroke spanning its x anywhere on the page, and usually wins (the Page
      // bids 1000 to add a staff). Bound it to the staff the way Staff.onStaffBid does.
      const H = this.staff.H();
      if (y < this.staff.yTop() - H || y > this.staff.yBot() + H) { return UC.noBid; }
      return Math.abs(y - this.staff.yLine(4));
    };
    this.addReaction(new Reaction('E-E', crossBid, (g) => { this.incFlag(); }));
    this.addReaction(new Reaction('W-W', crossBid, (g) => { this.decFlag(); }));
    this.addReaction(new Reaction('DOT',
      (g) => {
        const xr = this.time.x, yr = this.y(), x = g.vs.xM(), y = g.vs.yM();
        if (x < xr || x > xr + 40 || y < yr - 40 || y > yr + 40) { return UC.noBid; }
        return Math.abs(x - xr) + Math.abs(y - yr);
      },
      (g) => { this.cycleDot(); }));
  }

  y() { return this.staff.yLine(this.line); }

  show(g) {
    g.setColor(Color.BLACK);
    const H = this.staff.fmt.H, y = this.y();
    Rest.glyphs[this.nFlag + 2].showAt(g, H, this.time.x, y);
    const off = UC.augDotOffset, sp = UC.augDotSpacing;
    for (let i = 0; i < this.nDot; i++) { g.fillOval(this.time.x + off + i * sp, y - idiv(3 * H, 2), idiv(H, 2), idiv(H, 2)); }
  }
}
