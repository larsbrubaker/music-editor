// Squares (step 3) - animation. Each square gets a random velocity, bounces off the
// walls, a Timer drives the frames, and clicking a square stops it. Flick to relaunch.
// Also draws the parabolic spline through the first 3 squares (the splines sidebar).
import { WinApp, Timer } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';
import { G, V, VS } from '../graphics/G.js';

export class MovingSquare extends VS {
  constructor(x, y) {
    super(x, y, 100, 100);
    this.c = G.rndColor();
    this.dv = new V(G.rnd(20) - 10, G.rnd(20) - 10); // random velocity between -10 and 10
  }
  resize(x, y) { if (x > this.loc.x && y > this.loc.y) { this.size.set(x - this.loc.x, y - this.loc.y); } }
  moveTo(x, y) { this.loc.set(x, y); }
  draw(g) { this.fill(g, this.c); this.moveAndBounce(); } // motion as a side effect of drawing (bad structure, easy debugging)
  moveAndBounce() {
    this.loc.add(this.dv);
    if (this.xL() < 0 && this.dv.x < 0) { this.dv.x = -this.dv.x; }
    if (this.xH() > 1000 && this.dv.x > 0) { this.dv.x = -this.dv.x; }
    if (this.yL() < 0 && this.dv.y < 0) { this.dv.y = -this.dv.y; }
    if (this.yH() > 800 && this.dv.y > 0) { this.dv.y = -this.dv.y; }
  }
}

export class SquaresGame extends WinApp {
  constructor() {
    super('Squares', 1000, 800);
    this.squares = [];
    this.lastSquare = null;
    this.dragging = false;
    this.mouseDelta = new V(0, 0);
    this.pressedLoc = new V(0, 0);
    this.showSpline = true;
    this.timer = new Timer(30, { actionPerformed: () => this.repaint() }); // ~30 frames a second
    this.timer.setInitialDelay(2000); // a couple of seconds before things start moving
  }
  mount(canvas) { super.mount(canvas); this.timer.start(); return this; }
  paintComponent(g) {
    G.fillBack(g);
    for (const s of this.squares) { s.draw(g); }
    if (this.showSpline && this.squares.length > 2) {
      g.setColor(Color.BLACK);
      const a = this.squares[0].loc, b = this.squares[1].loc, c = this.squares[2].loc;
      G.spline(g, a.x, a.y, b.x, b.y, c.x, c.y, 4);
    }
  }
  hit(x, y) { let res = null; for (const s of this.squares) { if (s.hit(x, y)) { res = s; } } return res; }
  mousePressed(me) {
    const x = me.getX(), y = me.getY();
    this.lastSquare = this.hit(x, y);
    if (this.lastSquare == null) {
      this.dragging = false;
      this.lastSquare = new MovingSquare(x, y);
      this.squares.push(this.lastSquare);
    } else {
      this.dragging = true;
      this.lastSquare.dv.set(0, 0);   // stop the clicked square
      this.pressedLoc.set(x, y);      // remember where we grabbed it
      this.mouseDelta.set(this.lastSquare.loc.x - x, this.lastSquare.loc.y - y);
    }
    this.repaint();
  }
  mouseDragged(me) {
    const x = me.getX(), y = me.getY();
    if (this.dragging) { this.lastSquare.moveTo(x + this.mouseDelta.x, y + this.mouseDelta.y); }
    else { this.lastSquare.resize(x, y); }
    this.repaint();
  }
  mouseReleased(me) {
    if (this.dragging) { // a flick sets a new velocity
      this.lastSquare.dv.set(me.getX() - this.pressedLoc.x, me.getY() - this.pressedLoc.y);
    }
  }
}
