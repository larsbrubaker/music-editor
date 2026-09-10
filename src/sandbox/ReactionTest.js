// ReactionTest - the simplest reaction based app. A SW-SW stroke creates a colored
// Box; an S-S stroke through a box deletes it; a DOT on a box recolors it; and an
// N-N stroke anywhere is undo. Undo replays the gesture list, so the random colors
// change on every undo, which is the point the course makes about determinism.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';
import { UC } from '../graphics/UC.js';
import { Ink } from '../reaction/Ink.js';
import { Layer } from '../reaction/Layer.js';
import { Mass } from '../reaction/Mass.js';
import { Reaction } from '../reaction/Reaction.js';
import { Gesture } from '../reaction/Gesture.js';
import { World } from '../reaction/World.js';

export class ReactionTest extends WinApp {
  constructor() {
    super('Simple Reaction Test', UC.mainWindowWidth, UC.mainWindowHeight);
    World.reset();
    Layer.ensure('BACK'); Layer.ensure('FORE'); // the layers this app needs
    Reaction.initialReactions.addReaction(new Reaction('SW-SW',
      (g) => 0,                     // a perfect bid: this reaction always wins
      (g) => { new Box(g.vs); }));  // make a box the size of the ink
  }
  paintComponent(g) {
    G.fillBack(g);
    Layer.ALL.show(g);
    g.setColor(Color.BLUE);
    Ink.BUFFER.show(g); // show the ink on top of the drawn graphics
    g.setColor(Color.BLACK);
    g.drawString(Gesture.recognized, 850, 30); // gesture debug info
  }
  mousePressed(me) { Gesture.AREA.dn(me.getX(), me.getY()); this.repaint(); }
  mouseDragged(me) { Gesture.AREA.drag(me.getX(), me.getY()); this.repaint(); }
  mouseReleased(me) { Gesture.AREA.up(me.getX(), me.getY()); this.repaint(); }
}

//-----------------Box--------------------
export class Box extends Mass {
  constructor(vs) {
    super('BACK');
    this.vs = vs;
    this.c = G.rndColor();
    this.addReaction(new Reaction('S-S', // delete this box
      (g) => {
        const x = g.vs.xM(), y = g.vs.yL(); // the hot spot: top middle of the S-S stroke
        return this.vs.hit(x, y) ? Math.abs(x - this.vs.xM()) : UC.noBid; // closer to center = better
      },
      (g) => { this.deleteMass(); }));
    this.addReaction(new Reaction('DOT', // recolor this box (the homework)
      (g) => this.vs.hit(g.vs.xM(), g.vs.yM()) ? Math.abs(g.vs.xM() - this.vs.xM()) : UC.noBid,
      (g) => { this.c = G.rndColor(); }));
  }
  show(g) { this.vs.fill(g, this.c); }
}
