// Squares (step 2) - many squares. Click on white space to rubberband a new square,
// click on an existing square to drag it (biased by where you grabbed it).
import { WinApp } from '../graphics/WinApp.js';
import { G, V, VS } from '../graphics/G.js';

//-----------------Square------------------------------
export class Square extends VS {
  constructor(x, y) { super(x, y, 100, 100); this.c = G.rndColor(); }
  resize(x, y) { if (x > this.loc.x && y > this.loc.y) { this.size.set(x - this.loc.x, y - this.loc.y); } }
  moveTo(x, y) { this.loc.set(x, y); }
  draw(g) { this.fill(g, this.c); }
}

//------------------List----------------------------
export class SquareList extends Array {
  static get [Symbol.species]() { return Array; }
  draw(g) { for (const s of this) { s.draw(g); } }
  addNew(x, y) { this.push(new Square(x, y)); }
  hit(x, y) { // returns the LAST hit, which is the topmost one in drawing order; null if none
    let res = null;
    for (const s of this) { if (s.hit(x, y)) { res = s; } }
    return res;
  }
}
Square.List = SquareList;

export class Squares2 extends WinApp {
  constructor() {
    super('Squares', 1000, 800);
    this.squares = new SquareList();
    this.lastSquare = null;
    this.dragging = false;
    this.mouseDelta = new V(0, 0); // overwritten in mousePressed
  }
  paintComponent(g) {
    G.fillBack(g);
    this.squares.draw(g);
  }
  mousePressed(me) {
    const x = me.getX(), y = me.getY();
    this.lastSquare = this.squares.hit(x, y);
    if (this.lastSquare == null) {
      this.dragging = false;
      this.lastSquare = new Square(x, y);
      this.squares.push(this.lastSquare);
    } else {
      this.dragging = true;
      this.mouseDelta.set(this.lastSquare.loc.x - x, this.lastSquare.loc.y - y); // mouse + delta = upper left
    }
    this.repaint();
  }
  mouseDragged(me) {
    const x = me.getX(), y = me.getY();
    if (this.dragging) {
      this.lastSquare.moveTo(x + this.mouseDelta.x, y + this.mouseDelta.y);
    } else {
      this.lastSquare.resize(x, y);
    }
    this.repaint();
  }
}
