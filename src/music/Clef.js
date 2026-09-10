// Clef - a clef change at an x position on a staff. The initial clef of each staff is
// not a visible Clef Mass at all: Staff.show draws it by asking initialClef().
import { Mass } from '../reaction/Mass.js';

export class Clef extends Mass {
  constructor(staff, x, glyph) { super('NOTE'); this.staff = staff; this.x = x; this.glyph = glyph; }
  show(g) { this.glyph.showAt(g, this.staff.fmt.H, this.x, this.staff.yOfLine(4)); }
  compareTo(c) { return this.x - c.x; }
}
Clef.List = class extends Array { static get [Symbol.species]() { return Array; } };
