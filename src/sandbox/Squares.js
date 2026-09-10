// Squares (final) - the "Areas" refactoring. Every Square is an I.Area (hit/dn/drag/up)
// and one special BACKGROUND square, made with the JS equivalent of an anonymous
// class, is the area that rubberbands new squares. mousePressed just finds the area
// that was hit and hands it the mouse: no if/else branching between behaviors.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G, V, VS } from '../graphics/G.js';

export class Squares extends WinApp {
  constructor() {
    super('Squares', 1000, 800);
    this.mouseDelta = new V(0, 0);   // set in Square.dn()
    this.showSpline = false;
    this.curArea = null;             // set by mousePressed()
    this.lastSquare = null;
    this.squares = new AreaSquare.List(this);
  }
  paintComponent(g) {
    G.fillBack(g);
    this.squares.draw(g);
    if (this.showSpline && this.squares.length > 3) { // index 0 is BACKGROUND
      g.setColor(Color.BLACK);
      const a = this.squares[1].loc, b = this.squares[2].loc, c = this.squares[3].loc;
      G.spline(g, a.x, a.y, b.x, b.y, c.x, c.y, 4);
    }
  }
  mousePressed(me) {
    const x = me.getX(), y = me.getY();
    this.curArea = this.squares.hit(x, y); // always succeeds because of BACKGROUND
    this.curArea.dn(x, y);
    this.repaint();
  }
  mouseDragged(me) {
    this.curArea.drag(me.getX(), me.getY());
    this.repaint(); // repaint here in the app, NOT in each little Area
  }
  mouseReleased(me) { this.curArea.up(me.getX(), me.getY()); this.repaint(); }
}

//-----------------Square (an I.Area)------------------------------
export class AreaSquare extends VS {
  constructor(app, x, y, w = 100, h = 100) {
    super(x, y, w, h);
    this.app = app;
    this.c = G.rndColor();
  }
  resize(x, y) { if (x > this.loc.x && y > this.loc.y) { this.size.set(x - this.loc.x, y - this.loc.y); } }
  draw(g) { this.fill(g, this.c); }
  // I.Area - Squares already implement hit() (from VS) so we need 3 more routines
  dn(x, y) { this.app.mouseDelta.set(this.loc.x - x, this.loc.y - y); } // calculate the drag offset
  drag(x, y) { this.loc.set(this.app.mouseDelta.x + x, this.app.mouseDelta.y + y); }
  up(x, y) {}

  // The BACKGROUND square: the same class with dn/drag overridden for this ONE object.
  static background(app) {
    const bg = new AreaSquare(app, 0, 0, 3000, 3000);
    bg.c = Color.WHITE;
    bg.dn = (x, y) => { app.lastSquare = new AreaSquare(app, x, y); app.squares.push(app.lastSquare); };
    bg.drag = (x, y) => { app.lastSquare.resize(x, y); };
    return bg;
  }
}

//------------------List----------------------------
AreaSquare.List = class extends Array {
  static get [Symbol.species]() { return Array; }
  constructor(app) { super(); if (app) { this.push(AreaSquare.background(app)); } }
  draw(g) { for (const s of this) { s.draw(g); } }
  hit(x, y) { let res = null; for (const s of this) { if (s.hit(x, y)) { res = s; } } return res; }
};
