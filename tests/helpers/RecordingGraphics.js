// A fake Graphics for headless tests: records every drawing call so tests can
// assert on what a show() routine drew, without a canvas.
export class RecordingGraphics {
  constructor() { this.calls = []; this.color = null; this.font = { name: 'test', size: 12 }; }
  record(name, ...args) { this.calls.push({ name, args, color: this.color }); }
  setColor(c) { this.color = c; }
  getColor() { return this.color; }
  setFont(f) { this.font = f; }
  getFont() { return this.font; }
  fillRect(...a) { this.record('fillRect', ...a); }
  drawRect(...a) { this.record('drawRect', ...a); }
  drawLine(...a) { this.record('drawLine', ...a); }
  drawOval(...a) { this.record('drawOval', ...a); }
  fillOval(...a) { this.record('fillOval', ...a); }
  drawString(...a) { this.record('drawString', ...a); }
  fillPolygon(p) { this.record('fillPolygon', p.xpoints.slice(0, p.npoints), p.ypoints.slice(0, p.npoints)); }
  drawPolygon(p) { this.record('drawPolygon', p.xpoints.slice(0, p.npoints), p.ypoints.slice(0, p.npoints)); }
  getFontMetrics() { return { getAscent: () => 10, getDescent: () => 3, stringWidth: (s) => String(s).length * 7 }; }
  named(name) { return this.calls.filter((c) => c.name === name); }
}
