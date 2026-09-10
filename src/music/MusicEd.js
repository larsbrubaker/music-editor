// MusicEd - the music editor. One page; every action is a gesture. A click in the
// top right corner (or the app's Train button) toggles the Shape trainer so that
// new gestures can be taught without leaving the editor.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';
import { UC } from '../graphics/UC.js';
import { Ink } from '../reaction/Ink.js';
import { Shape } from '../reaction/Shape.js';
import { Layer } from '../reaction/Layer.js';
import { Reaction } from '../reaction/Reaction.js';
import { Gesture } from '../reaction/Gesture.js';
import { World } from '../reaction/World.js';
import { Page } from './Page.js';

export class MusicEd extends WinApp {
  constructor() {
    super('Music Editor', UC.mainWindowWidth, UC.mainWindowHeight);
    this.training = false;         // high level mode switch
    this.curArea = Gesture.AREA;   // Gestures or Training at any time
    this.PAGE = null;              // single page app; set by the initial reaction
    this.onChange = null;          // optional callback for a surrounding UI
    this.newPage();
  }

  // forget everything and wait for the first W-W stroke that defines the top margin
  newPage() {
    World.reset();
    Layer.ensure('BACK'); Layer.ensure('NOTE'); Layer.ensure('FORE');
    this.PAGE = null;
    const r = new Reaction('W-W', // define the top margin: creates the Page, then retires
      (g) => 0,
      (g) => { this.PAGE = new Page(g.vs.yM()); r.disable(); });
    Reaction.initialReactions.addReaction(r);
    this.repaint();
  }

  paintComponent(g) {
    G.fillBack(g);
    if (this.training) { Shape.TRAINER.show(g); return; }
    g.setColor(Color.BLUE);
    Ink.BUFFER.show(g);
    Layer.ALL.show(g);
    g.setColor(Color.BLACK);
    g.drawString(Gesture.recognized, UC.mainWindowWidth - 150, 30);
    if (this.PAGE == null) {
      g.setColor(Color.GRAY);
      g.drawString('Draw a W-W stroke (right to left) where the top staff line should be.', 300, 400);
    }
  }

  mousePressed(me) { this.curArea.dn(me.getX(), me.getY()); this.repaint(); }
  mouseDragged(me) { this.curArea.drag(me.getX(), me.getY()); this.repaint(); }
  mouseReleased(me) {
    this.curArea.up(me.getX(), me.getY());
    this.syncPage();
    this.trainBtn(me);
    if (this.onChange) { this.onChange(); }
    this.repaint();
  }
  trainBtn(me) { // an up in the top right corner means nothing to either mode, so it is the toggle
    if (me.getX() > (UC.mainWindowWidth - 40) && me.getY() < 40) { this.toggleTraining(); }
  }
  toggleTraining() {
    this.training = !this.training;
    this.curArea = this.training ? Shape.TRAINER : Gesture.AREA;
    Ink.BUFFER.clear();
    this.repaint();
  }
  keyTyped(ke) { if (this.training) { Shape.TRAINER.keyTyped(ke); this.repaint(); } }
  undo() { Gesture.undo(); this.syncPage(); this.repaint(); }
  // undo replays the gesture list from nothing; if the page-making stroke was undone there is no page
  syncPage() { if (this.PAGE != null && !Layer.byName.get('BACK').includes(this.PAGE)) { this.PAGE = null; } }
}
