// Key - a key signature: n sharps (n>0) or flats (n<0), drawn on the lines that the
// current clef of each staff dictates. Naturals cancel a key at a double bar.
import { idiv } from '../graphics/G.js';
import { Glyph } from './Glyph.js';

export class Key {
  // line numbers for sharps and flats in the G clef and the F clef
  static sG = [0, 3, -1, 2, 5, 1, 4];
  static fG = [4, 1, 5, 2, 6, 3, 7];
  static sF = [2, 5, 1, 4, 7, 3, 6];
  static fF = [6, 3, 7, 4, 8, 5, 9];

  constructor(n = 0, glyph = Glyph.SHARP) { this.n = n; this.glyph = glyph; }

  static drawOnStaff(g, n, lines, x, glyph, staff) {
    const gap = Key.gapForGlyph(glyph, staff);
    for (let i = 0; i < n; i++) { glyph.showAt(g, staff.fmt.H, x + i * gap, staff.yOfLine(lines[i])); }
  }
  static gapForGlyph(glyph, staff) {
    const h = staff.fmt.H;
    if (glyph === Glyph.SHARP) { return idiv(22 * 8, h); } // approximate width of #
    if (glyph === Glyph.FLAT) { return idiv(18 * 8, h); }  // approximate width of b
    return idiv(16 * 8, h); // approximate width of a natural sign
  }

  drawOnSys(g, sys, x) {
    if (this.n === 0) { return; } // nothing to draw
    for (const staff of sys.staffs) {
      const isG = staff.clefAtX(x) === Glyph.CLEF_G;
      const arr = this.n > 0 ? (isG ? Key.sG : Key.sF) : (isG ? Key.fG : Key.fF);
      Key.drawOnStaff(g, Math.abs(this.n), arr, x, this.glyph, staff);
    }
  }
}
