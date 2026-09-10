// SplineDemo - the appendix: a parabolic spline written into a polygon buffer and
// filled. Click anywhere to move the control point B; A and C stay fixed.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';

export class SplineDemo extends WinApp {
  constructor() { super('Splines', 1000, 700); this.b = { x: 500, y: 100 }; }
  paintComponent(g) {
    G.fillBack(g);
    const xa = 100, ya = 500, xc = 900, yc = 500, xb = this.b.x, yb = this.b.y;
    G.poly.reset();
    G.pSpline(xa, ya, xb, yb, xc, yc, 4); // 2^4 = 16 segments
    g.setColor(Color.rgb(90, 140, 220)); g.fillPolygon(G.poly);
    g.setColor(Color.GRAY); g.drawLine(xa, ya, xb, yb); g.drawLine(xb, yb, xc, yc); // the two tangents
    g.setColor(Color.RED); G.drawCircle(g, xb, yb, 5);
    g.setColor(Color.BLACK); g.drawString('A', xa - 10, ya + 20); g.drawString('B (click to move)', xb + 10, yb); g.drawString('C', xc + 5, yc + 20);
  }
  mousePressed(me) { this.b = { x: me.getX(), y: me.getY() }; this.repaint(); }
  mouseDragged(me) { this.mousePressed(me); }
}
