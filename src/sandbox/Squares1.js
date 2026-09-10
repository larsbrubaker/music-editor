// Squares (step 1) - a single VS that changes color when you hit it. Tests G.VS.hit().
import { WinApp } from '../graphics/WinApp.js';
import { G, VS } from '../graphics/G.js';

export class Squares1 extends WinApp {
  constructor() {
    super('Squares', 1000, 800);
    this.theVS = new VS(100, 100, 200, 300);
    this.color = G.rndColor();
  }
  paintComponent(g) {
    G.fillBack(g);
    this.theVS.fill(g, this.color); // give us a nice Rect
  }
  mousePressed(me) {
    if (this.theVS.hit(me.getX(), me.getY())) { this.color = G.rndColor(); }
    this.repaint(); // don't forget to repaint when you change something
  }
}
