// PaintShapes - the exploration of the basic drawing calls from the "Swing Output",
// "Text Output", "Random Color" and "Mouse Input" sections, all in one app:
// fillRect/drawRect/drawOval/fillOval/drawLine, drawString + font metrics,
// random colors, and a click counter that only updates because of repaint().
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';

export class PaintShapes extends WinApp {
  constructor() { super('Paint', 1000, 700); this.clicks = 0; }

  paintComponent(g) {
    g.setColor(Color.WHITE); g.fillRect(0, 0, 9000, 9000);
    g.setColor(Color.BLUE);
    g.fillRect(100, 50, 200, 300);     // 100 in, 50 down, 200 wide, 300 tall
    g.drawRect(350, 50, 200, 300);     // just the border
    g.drawOval(600, 50, 200, 300);     // an ellipse that fits the same box
    const c = G.rndColor();            // a new random color on EVERY paint - resize to see it change
    g.setColor(c);
    g.fillOval(100, 400, 200, 300);
    g.setColor(Color.BLACK);
    g.drawLine(100, 600, 600, 100);    // a diagonal line
    const x = 400, y = 200, msg = 'Clicks = ' + this.clicks;
    const fm = g.getFontMetrics();     // information about the current font
    const a = fm.getAscent(), d = fm.getDescent(); // above and below the baseline
    const w = fm.stringWidth(msg);     // width depends on the actual letters
    g.setColor(c);
    g.drawRect(x, y - a, w, a + d);    // bounding box: move y from baseline UP by the ascent
    g.setColor(Color.BLACK);
    g.drawString(msg, x, y);           // text sits on its baseline at (x,y)
    g.drawOval(x, y, 3, 3);            // a dot at the baseline, NOT the top left of the text
  }

  mousePressed(me) {
    this.clicks++;   // without the repaint() below the count changes but the screen does not
    this.repaint();
  }
}
