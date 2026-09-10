// Demo runner for the lesson pages.
//   <div class="demo" data-app="Squares2" data-name="Squares" data-note="click and drag"
//        data-toggles="showSpline:Show spline"></div>
// becomes a canvas with Run/Stop buttons. Only one demo runs at a time on a page
// (the reaction based apps share static state), and the shape database and the
// music font are loaded before anything mounts.
import { Shape } from '../src/reaction/Shape.js';
import { Glyph } from '../src/music/Glyph.js';

const root = new URL('../', import.meta.url).href;
export const APPS = {
  RedRect: 'src/sandbox/RedRect.js', PaintShapes: 'src/sandbox/PaintShapes.js', Paint: 'src/sandbox/Paint.js',
  Squares1: 'src/sandbox/Squares1.js', Squares2: 'src/sandbox/Squares2.js', SquaresGame: 'src/sandbox/SquaresGame.js', Squares: 'src/sandbox/Squares.js',
  PaintInk: 'src/sandbox/PaintInk.js', ShapeTrainer: 'src/sandbox/ShapeTrainer.js', ReactionTest: 'src/sandbox/ReactionTest.js',
  GlyphSheet: 'src/sandbox/GlyphSheet.js', SplineDemo: 'src/sandbox/SplineDemo.js', MusicEd: 'src/music/MusicEd.js',
};

let readyPromise = null;
export function ready() {
  if (!readyPromise) {
    readyPromise = Promise.all([Shape.loadDefaults(root + 'assets/shapes.json'), Glyph.loadFont(root + 'assets/sinfonia.ttf')]);
  }
  return readyPromise;
}

const running = new Set();
export function stopAll() { for (const d of [...running]) { d.stop(); } }

class Demo {
  constructor(el) {
    this.el = el; this.appName = el.dataset.app; this.app = null;
    el.innerHTML = '';
    const bar = document.createElement('div'); bar.className = 'bar';
    bar.innerHTML = `<span class="name">${el.dataset.name || this.appName}</span>` +
      (el.dataset.note ? `<span class="note">${el.dataset.note}</span>` : '') +
      `<span style="margin-left:auto"></span><button class="run">Run</button><button class="stop" hidden>Stop</button>`;
    this.toggles = [];
    for (const spec of (el.dataset.toggles || '').split(',').filter(Boolean)) {
      const [prop, label] = spec.split(':');
      const lab = document.createElement('label');
      lab.innerHTML = `<input type="checkbox"> ${label || prop}`;
      const box = lab.querySelector('input');
      box.addEventListener('change', () => { if (this.app) { this.app[prop] = box.checked; this.app.repaint(); } });
      bar.insertBefore(lab, bar.querySelector('.run'));
      this.toggles.push([prop, box]);
    }
    el.appendChild(bar);
    this.holder = document.createElement('div');
    this.holder.className = 'placeholder'; this.holder.textContent = 'Click Run (or here) to start this demo';
    this.holder.addEventListener('click', () => this.start());
    el.appendChild(this.holder);
    bar.querySelector('.run').addEventListener('click', () => this.start());
    bar.querySelector('.stop').addEventListener('click', () => this.stop());
  }
  async start() {
    if (this.app) { return; }
    stopAll();
    await ready();
    const mod = await import(root + APPS[this.appName]);
    const App = mod[this.appName];
    this.app = new App();
    const canvas = document.createElement('canvas');
    this.holder.replaceWith(canvas); this.canvas = canvas;
    for (const [prop, box] of this.toggles) { if (prop in this.app) { box.checked = !!this.app[prop]; } }
    this.app.mount(canvas);
    canvas.focus({ preventScroll: true });
    this.el.querySelector('.run').hidden = true; this.el.querySelector('.stop').hidden = false;
    running.add(this);
  }
  stop() {
    if (!this.app) { return; }
    this.app.unmount(); this.app = null;
    this.canvas.replaceWith(this.holder);
    this.el.querySelector('.run').hidden = false; this.el.querySelector('.stop').hidden = true;
    running.delete(this);
  }
}

export function initDemos(scope = document) {
  for (const el of scope.querySelectorAll('.demo[data-app]')) { new Demo(el); }
}
