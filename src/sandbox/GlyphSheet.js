// GlyphSheet - renders every character of the Sinfonia font with its code, the way
// the course suggests: when you want a symbol, write code that draws the font and
// look for it. Click a glyph to print its code.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';
import { Font } from '../graphics/Graphics.js';
import { Glyph } from '../music/Glyph.js';

export class GlyphSheet extends WinApp {
  constructor() { super('Glyph Sheet', 1000, 800); this.first = 0xF020; this.cols = 12; this.cell = 82; this.picked = ''; }
  paintComponent(g) {
    G.fillBack(g);
    const big = new Font(Glyph.fontName, 0, 40), small = g.getFont();
    for (let i = 0; i < 0xE0; i++) {
      const code = this.first + i, col = i % this.cols, row = Math.floor(i / this.cols);
      const x = 20 + col * this.cell, y = 60 + row * this.cell;
      g.setColor(Color.LIGHT_GRAY); g.drawLine(x - 10, y, x + this.cell - 20, y); // a baseline to judge offsets
      g.setColor(Color.BLACK); g.setFont(big); g.drawString(String.fromCharCode(code), x, y);
      g.setFont(small); g.setColor(Color.GRAY); g.drawString(String(code), x - 8, y + 16);
    }
    g.setColor(Color.BLACK); g.drawString('Sinfonia font, codes 61472..61695. Click a glyph: ' + this.picked, 20, 24);
  }
  mousePressed(me) {
    const col = Math.floor((me.getX() - 10) / this.cell), row = Math.floor((me.getY() - 20) / this.cell);
    const code = this.first + row * this.cols + col;
    this.picked = `${code} (0x${code.toString(16)}) "${String.fromCharCode(code)}"`;
    this.repaint();
  }
}
