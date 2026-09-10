// Glyph - the mapping layer onto the Sinfonia music font: which character code is
// which symbol, how big to draw it relative to the staff spacing H, and where its
// hot spot is so that we can place symbols by staff line instead of by baseline.
import { Font } from '../graphics/Graphics.js';
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';

export class Glyph {
  static fontName = UC.fontName;
  static theSize = -1;
  static theFont = null;
  static debugBoxes = false; // draw the red H x H box at each glyph's hot spot

  constructor(code, scale, dx, dy) {
    this.code = code; this.scale = scale; this.dx = dx; this.dy = dy;
  }

  showAt(g, H, x, y) {
    const size = Math.trunc(this.scale) * H; // Java: (int)scale*H
    if (size !== Glyph.theSize) { Glyph.theFont = new Font(Glyph.fontName, 0, size); Glyph.theSize = size; }
    const f = g.getFont(); // fetch the old font so that we can restore it
    g.setFont(Glyph.theFont);
    g.drawString(String.fromCharCode(this.code), x + Math.floor(this.dx * H), y + Math.floor(this.dy * H));
    if (Glyph.debugBoxes) { const c = g.getColor(); g.setColor(Color.RED); g.drawRect(x, y, H, H); g.setColor(c); }
    g.setFont(f);
  }

  // Load the font into the document so that the canvas can use it. Resolve when ready.
  static async loadFont(url = 'assets/sinfonia.ttf') {
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') { return false; }
    if (Glyph.fontLoaded) { return true; }
    const face = new FontFace(Glyph.fontName, `url(${url})`);
    await face.load();
    document.fonts.add(face);
    Glyph.fontLoaded = true;
    return true;
  }
}
Glyph.fontLoaded = false;

Glyph.BRACE = new Glyph(61473, 16, 0, 4);

Glyph.CLEF_G = new Glyph(61479, 16, -3, 1);
Glyph.CLEF_F = new Glyph(61480, 16, -3, 4);
Glyph.CLEF_C = new Glyph(61481, 16, -3, 4);
Glyph.CLEF_TAB = new Glyph(61581, 10, -1, 1);
Glyph.CLEF_G8 = new Glyph(61639, 16, -3, 1);

Glyph.HEAD_W = new Glyph(61484, 16, 0, 7);
Glyph.HEAD_HALF = new Glyph(61485, 16, 0, 7);
Glyph.HEAD_Q = new Glyph(61486, 16, 0, 7);

Glyph.FLAG1D = new Glyph(61487, 16, 0, 8);
Glyph.FLAG1U = new Glyph(61488, 16, 0, 1);
Glyph.FLAG2D = new Glyph(61489, 16, 0, 8);
Glyph.FLAG2U = new Glyph(61490, 16, 0, 1);
Glyph.FLAG3D = new Glyph(61491, 16, 0, 8);
Glyph.FLAG3U = new Glyph(61492, 16, 0, -1);
Glyph.FLAG4D = new Glyph(61493, 16, 0, 8);
Glyph.FLAG4U = new Glyph(61494, 16, 0, -3);

Glyph.REST_W = new Glyph(61499, 16, 0, 6);
Glyph.REST_H = new Glyph(61499, 16, 0, 7);
Glyph.REST_Q = new Glyph(61501, 16, 0, 5);
Glyph.REST_1F = new Glyph(61502, 16, 0, 6);
Glyph.REST_2F = new Glyph(61503, 16, 0, 6);
Glyph.REST_3F = new Glyph(61504, 16, 0, 4);
Glyph.REST_4F = new Glyph(61505, 16, 0, 4);

// Accidentals. The course uses these but never lists their codes; they were found by
// rendering the font (the GlyphSheet demo): 61511 natural, 61512 flat, 61513 sharp
// (61514/61515 are the double flat and double sharp). dy centers the sign on its
// line: the sharp and the natural by their middle, the flat by its loop, which is
// why the flat's dy is fractional (dy is a double in the course too; only the font
// size is truncated to an int in showAt).
Glyph.SHARP = new Glyph(61513, 16, 0, 5);
Glyph.FLAT = new Glyph(61512, 16, 0, 4.5);
Glyph.NATURAL = new Glyph(61511, 16, 0, 5);
