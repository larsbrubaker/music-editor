// Graphics wraps a CanvasRenderingContext2D so that ported Swing code can keep
// calling the java.awt.Graphics API it was written against: setColor, fillRect,
// drawLine, drawString, getFontMetrics, fillPolygon and friends.
//
// Coordinates are integer pixels in the WinApp's logical coordinate system; the
// WinApp applies any device-pixel-ratio / CSS scaling before handing out a Graphics.
import { Color } from './Color.js';

export class Font {
  // Mirrors java.awt.Font(name, style, size). style is ignored (always plain).
  constructor(name, style, size) { this.name = name; this.style = style; this.size = size; }
  toCss() { return `${this.size}px "${this.name}"`; }
}

export const DEFAULT_FONT = new Font('sans-serif', 0, 13);

export class Graphics {
  constructor(ctx) {
    this.ctx = ctx;
    this.color = Color.BLACK;
    this.font = DEFAULT_FONT;
    ctx.lineWidth = 1;
    ctx.textBaseline = 'alphabetic';
    ctx.font = this.font.toCss();
  }

  setColor(c) { this.color = c; this.ctx.fillStyle = c; this.ctx.strokeStyle = c; }
  getColor() { return this.color; }
  setFont(f) { this.font = f; this.ctx.font = f.toCss(); }
  getFont() { return this.font; }

  fillRect(x, y, w, h) { this.ctx.fillRect(x, y, w, h); }
  // Java's drawRect outlines a box whose right/bottom edge is at x+w,y+h; the 0.5 keeps 1px strokes crisp.
  drawRect(x, y, w, h) { this.ctx.strokeRect(x + 0.5, y + 0.5, w, h); }
  drawLine(x1, y1, x2, y2) {
    const c = this.ctx;
    c.beginPath(); c.moveTo(x1 + 0.5, y1 + 0.5); c.lineTo(x2 + 0.5, y2 + 0.5); c.stroke();
  }
  ovalPath(x, y, w, h) {
    const c = this.ctx;
    c.beginPath(); c.ellipse(x + w / 2, y + h / 2, Math.max(w / 2, 0.5), Math.max(h / 2, 0.5), 0, 0, Math.PI * 2);
  }
  drawOval(x, y, w, h) { this.ovalPath(x + 0.5, y + 0.5, w, h); this.ctx.stroke(); }
  fillOval(x, y, w, h) { this.ovalPath(x, y, w, h); this.ctx.fill(); }
  drawString(s, x, y) { this.ctx.fillText(String(s), x, y); }
  // poly is {xpoints:[], ypoints:[], npoints}
  fillPolygon(poly) {
    const c = this.ctx, n = poly.npoints;
    if (n < 2) { return; }
    c.beginPath(); c.moveTo(poly.xpoints[0], poly.ypoints[0]);
    for (let i = 1; i < n; i++) { c.lineTo(poly.xpoints[i], poly.ypoints[i]); }
    c.closePath(); c.fill();
  }
  drawPolygon(poly) {
    const c = this.ctx, n = poly.npoints;
    if (n < 2) { return; }
    c.beginPath(); c.moveTo(poly.xpoints[0] + 0.5, poly.ypoints[0] + 0.5);
    for (let i = 1; i < n; i++) { c.lineTo(poly.xpoints[i] + 0.5, poly.ypoints[i] + 0.5); }
    c.closePath(); c.stroke();
  }
  getFontMetrics() {
    const ctx = this.ctx;
    const m = ctx.measureText('Mg');
    // Canvas reports ascent/descent per string; Java reports them per font. 'Mg' is a
    // reasonable stand in for the font's overall ascent and descent.
    const ascent = Math.ceil(m.actualBoundingBoxAscent || this.font.size * 0.8);
    const descent = Math.ceil(m.actualBoundingBoxDescent || this.font.size * 0.2);
    return {
      getAscent: () => ascent,
      getDescent: () => descent,
      stringWidth: (s) => Math.ceil(ctx.measureText(String(s)).width),
    };
  }
}

// Polygon mirrors java.awt.Polygon: parallel xpoints/ypoints arrays plus npoints.
export class Polygon {
  constructor(xpoints = [], ypoints = [], npoints = xpoints.length) {
    this.xpoints = xpoints.slice(); this.ypoints = ypoints.slice(); this.npoints = npoints;
  }
  addPoint(x, y) { this.xpoints[this.npoints] = x; this.ypoints[this.npoints] = y; this.npoints++; }
  reset() { this.npoints = 0; }
}
