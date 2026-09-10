// ShapeTrainer - a WinApp that is nothing but a thin shell around Shape.TRAINER.
// Type a shape name, draw examples of it, press ENTER to save the database.
import { WinApp } from '../graphics/WinApp.js';
import { UC } from '../graphics/UC.js';
import { Shape } from '../reaction/Shape.js';

export class ShapeTrainer extends WinApp {
  constructor() { super('Shape Trainer', UC.mainWindowWidth, UC.mainWindowHeight); }
  paintComponent(g) { Shape.TRAINER.show(g); }
  mousePressed(me) { Shape.TRAINER.dn(me.getX(), me.getY()); this.repaint(); }
  mouseDragged(me) { Shape.TRAINER.drag(me.getX(), me.getY()); this.repaint(); }
  mouseReleased(me) { Shape.TRAINER.up(me.getX(), me.getY()); this.repaint(); }
  keyTyped(ke) { Shape.TRAINER.keyTyped(ke); this.repaint(); }
}
