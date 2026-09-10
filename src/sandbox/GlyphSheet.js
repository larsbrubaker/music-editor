// GlyphSheet - renders every character of the Sinfonia font with its code, the way
// the course suggests: when you want a symbol, write code that draws the font and
// look for it. Click a glyph to print its code.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';
import { Font } from '../graphics/Graphics.js';
import { Glyph } from '../music/Glyph.js';

export class GlyphSheet extends WinApp {
  // 224 codes in 16 columns of 60 px fit on one 1000 x 900 canvas (12 columns of 82 px did not).
  constructor() { super('Glyph Sheet', 1000, 900); this.first = 0xF020; this.cols = 16; this.cell = 60; this.picked = ''; }
  paintComponent(g) {
    G.fillBack(g);
    const big = new Font(Glyph.fontName, 0, 36), small = g.getFont();
    for (let i = 0; i < 0xE0; i++) {
      const code = this.first + i, col = i % this.cols, row = Math.floor(i / this.cols);
      const x = 20 + col * this.cell, y = 70 + row * this.cell;
      g.setColor(Color.LIGHT_GRAY); g.drawLine(x - 10, y, x + this.cell - 16, y); // a baseline to judge offsets
      g.setColor(Color.BLACK); g.setFont(big); g.drawString(String.fromCharCode(code), x, y);
      g.setFont(small); g.setColor(Color.GRAY); g.drawString(String(code), x - 10, y + 16);
    }
    g.setColor(Color.BLACK); g.drawString('Sinfonia font, codes 61472..61695. Click a glyph: ' + this.picked, 20, 24);
  }
  mousePressed(me) {
    const col = Math.floor((me.getX() - 10) / this.cell), row = Math.floor((me.getY() - 30) / this.cell);
    const code = this.first + row * this.cols + col;
    this.picked = `${code} (0x${code.toString(16)}) "${String.fromCharCode(code)}"`;
    this.repaint();
  }
}
