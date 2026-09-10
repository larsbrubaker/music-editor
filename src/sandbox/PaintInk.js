// PaintInk - the test harness for the recognition subsystem. Every stroke becomes an
// Ink (a Norm + a VS), is added to a prototype list (blended if it matches one, added
// if not), and is run through Shape.recognize() against the whole Shape database.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G, PL } from '../graphics/G.js';
import { UC } from '../graphics/UC.js';
import { Ink } from '../reaction/Ink.js';
import { Shape, Prototype } from '../reaction/Shape.js';

export class PaintInk extends WinApp {
  constructor() {
    super('Paint Ink', UC.mainWindowWidth, UC.mainWindowHeight);
    this.inkList = new Ink.List();
    this.pList = new Prototype.List();
    this.recognized = '';
    this.showDots = false;     // the sub-sampling lesson's debug dots
    this.showBBox = false;     // the bounding box lesson's debug box
    this.indexSampling = false; // true: the course's sub-sampling by index instead of by arc length
  }

  paintComponent(g) {
    G.fillBack(g);
    PL.showDots = this.showDots; Ink.Buffer.showBBox = this.showBBox;
    g.setColor(Color.RED); Ink.BUFFER.show(g);
    PL.showDots = false; Ink.Buffer.showBBox = false;
    this.inkList.show(g);
    g.setColor(Color.BLACK);
    g.drawString('points: ' + Ink.BUFFER.n, 600, 30);
    g.drawString(this.recognized, 700, 40);
    this.pList.show(g);
    if (this.inkList.length > 1) {
      const last = this.inkList.length - 1;
      const dist = this.inkList[last].norm.dist(this.inkList[last - 1].norm);
      g.setColor(dist > UC.noMatchDist ? Color.RED : Color.BLACK); // black for same, red for different
      g.drawString('Dist: ' + dist, 600, 60);
    }
  }

  mousePressed(me) { Ink.BUFFER.dn(me.getX(), me.getY()); this.repaint(); }
  mouseDragged(me) { Ink.BUFFER.drag(me.getX(), me.getY()); this.repaint(); }
  mouseReleased(me) {
    Ink.BUFFER.up(me.getX(), me.getY());
    // The toggle has to be set while the stroke is normalized, and put back afterwards:
    // Ink.Buffer.arcLength is global, so leaving it set changes every later app on the page.
    const wasArcLength = Ink.Buffer.arcLength;
    Ink.Buffer.arcLength = !this.indexSampling;
    const ink = new Ink();
    const s = Shape.recognize(ink);
    this.recognized = 'Recog: ' + ((s != null) ? s.name : 'UN-RECOGNIZED');
    let proto;
    this.inkList.push(ink);
    if (this.pList.bestDist(ink.norm) < UC.noMatchDist) { // we found a match so blend
      proto = Prototype.List.bestMatch;
      proto.blend(ink.norm);
    } else {
      proto = new Prototype();
      this.pList.push(proto); // new Prototype
    }
    ink.norm = proto; // share the norm: every matching ink on screen smooths as the prototype blends
    Ink.Buffer.arcLength = wasArcLength;
    this.repaint();
  }
}
