// Paint - the multi-line paint program from the end of Day 1: a Pic (list of Path)
// where each mouse press starts a new Path and each drag adds a point to it.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';

//--------------------PATH----------------------------
// A Path is just a list of points that knows how to connect the dots.
export class Path extends Array {
  static get [Symbol.species]() { return Array; }
  draw(g) {
    for (let i = 1; i < this.length; i++) {       // one less segment than points, so start at 1
      const p = this[i - 1], n = this[i];         // the previous and the next point
      g.drawLine(p.x, p.y, n.x, n.y);
    }
  }
}

//--------------------Pic----------------------------
export class Pic extends Array {
  static get [Symbol.species]() { return Array; }
  draw(g) { for (const p of this) { p.draw(g); } }
}

export class Paint extends WinApp {
  constructor() {
    super('Paint', 1000, 700);
    this.thePath = new Path();
    this.thePic = new Pic();   // a single Picture - list of Path
    this.clicks = 0;
  }

  paintComponent(g) {
    g.setColor(Color.WHITE); g.fillRect(0, 0, 9000, 9000); // clear out the trash first
    const c = G.rndColor();
    g.setColor(c);
    g.fillOval(100, 50, 200, 300);
    g.setColor(Color.BLACK);
    this.thePic.draw(g);  // draw the whole picture, not just the last path
    g.drawLine(100, 600, 600, 100);
    const x = 400, y = 200, msg = 'Clicks = ' + this.clicks;
    const fm = g.getFontMetrics();
    const a = fm.getAscent(), d = fm.getDescent();
    const w = fm.stringWidth(msg);
    g.setColor(c);
    g.drawRect(x, y - a, w, a + d);
    g.setColor(Color.BLACK);
    g.drawString(msg, x, y);
  }

  mousePressed(me) {
    this.clicks++;
    this.thePath = new Path();        // clears the path by creating a new one..
    this.thePic.push(this.thePath);   // ..then adds that new Path to the growing Picture
    this.thePath.push(me.getPoint());
    this.repaint();
  }

  mouseDragged(me) {
    this.thePath.push(me.getPoint());
    this.repaint(); // forget this and you add points but never SEE them
  }
}
