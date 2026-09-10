// WinApp - the browser stand-in for the course's Swing JPanel/JFrame helper.
//
// Extend WinApp, override paintComponent(g) and any of the mouse / key handlers
// you need, then mount(canvas). The canvas keeps the app's logical coordinate
// system (w x h from the constructor) no matter how it is scaled by CSS or by the
// device pixel ratio, so all the ported code can keep thinking in those pixels.
import { Graphics } from './Graphics.js';

export class WinApp {
  constructor(title, w, h) {
    this.title = title; this.width = w; this.height = h;
    this.canvas = null; this.ctx = null;
    this.paintPending = false;
    this.listeners = [];
    this.mouseDown = false;
  }

  // ----- override these -----
  paintComponent(g) {}
  mousePressed(me) {}
  mouseReleased(me) {}
  mouseDragged(me) {}
  mouseMoved(me) {}
  mouseClicked(me) {}
  keyTyped(ke) {}

  // ----- harness -----
  mount(canvas) {
    this.canvas = canvas;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = this.width * dpr; canvas.height = this.height * dpr;
    canvas.style.aspectRatio = `${this.width} / ${this.height}`;
    canvas.tabIndex = 0; // so the canvas can receive key events
    this.ctx = canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
    const on = (type, fn, target = canvas) => { target.addEventListener(type, fn); this.listeners.push([target, type, fn]); };
    on('pointerdown', (e) => {
      canvas.focus(); canvas.setPointerCapture(e.pointerId); this.mouseDown = true;
      this.mousePressed(this.toMouseEvent(e)); this.repaint(); e.preventDefault();
    });
    on('pointermove', (e) => {
      const me = this.toMouseEvent(e);
      if (this.mouseDown) { this.mouseDragged(me); } else { this.mouseMoved(me); }
    });
    const up = (e) => {
      if (!this.mouseDown) { return; }
      this.mouseDown = false;
      const me = this.toMouseEvent(e);
      this.mouseReleased(me); this.mouseClicked(me); this.repaint();
    };
    on('pointerup', up); on('pointercancel', up);
    on('keydown', (e) => {
      const ch = keyChar(e);
      if (ch == null) { return; }
      e.preventDefault();
      this.keyTyped({ getKeyChar: () => ch, key: e.key });
      this.repaint();
    });
    on('contextmenu', (e) => e.preventDefault());
    this.repaint();
    return this;
  }

  unmount() {
    for (const [t, type, fn] of this.listeners) { t.removeEventListener(type, fn); }
    this.listeners = [];
    if (this.timer) { this.timer.stop(); }
    this.canvas = null; this.ctx = null;
  }

  toMouseEvent(e) {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) * this.width / r.width);
    const y = Math.round((e.clientY - r.top) * this.height / r.height);
    return { x, y, getX: () => x, getY: () => y, getPoint: () => ({ x, y }) };
  }

  // Like Swing's repaint(): ask for a paint at the next opportunity, never paint synchronously.
  repaint() {
    if (this.paintPending || !this.ctx) { return; }
    this.paintPending = true;
    const raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : (f) => setTimeout(f, 16);
    raf(() => { this.paintPending = false; this.paintNow(); });
  }

  paintNow() {
    if (!this.ctx) { return; }
    const g = new Graphics(this.ctx);
    this.ctx.save();
    this.paintComponent(g);
    this.ctx.restore();
  }
}

// Convert a keydown event into the char that Swing's keyTyped would report, or null.
function keyChar(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) { return null; }
  if (e.key === 'Enter') { return '\r'; }
  if (e.key === 'Backspace') { return '\b'; }
  if (e.key.length === 1) { return e.key; }
  return null;
}

// Timer mirrors javax.swing.Timer(delayMs, listener) with start/stop/setInitialDelay.
export class Timer {
  constructor(delay, listener) { this.delay = delay; this.listener = listener; this.initialDelay = delay; this.handle = null; this.running = false; }
  setInitialDelay(ms) { this.initialDelay = ms; }
  start() {
    if (this.running) { return; }
    this.running = true;
    this.handle = setTimeout(() => {
      if (!this.running) { return; }
      this.listener.actionPerformed({});
      this.handle = setInterval(() => this.listener.actionPerformed({}), this.delay);
    }, this.initialDelay);
  }
  stop() { this.running = false; clearTimeout(this.handle); clearInterval(this.handle); this.handle = null; }
}
