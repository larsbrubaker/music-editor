import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VS } from '../src/graphics/G.js';
import { UC } from '../src/graphics/UC.js';
import { Shape } from '../src/reaction/Shape.js';
import { Reaction } from '../src/reaction/Reaction.js';
import { Layer } from '../src/reaction/Layer.js';
import { Mass } from '../src/reaction/Mass.js';
import { Gesture } from '../src/reaction/Gesture.js';
import { World } from '../src/reaction/World.js';
import { Ink } from '../src/reaction/Ink.js';
import { compassStroke, inkFromPoints } from './helpers/strokes.js';

Shape.DB.mergeJSON(JSON.parse(readFileSync(new URL('../assets/shapes.json', import.meta.url))));

class Box extends Mass {
  constructor(vs) {
    super('BACK'); this.vs = vs;
    this.addReaction(new Reaction('S-S',
      (g) => this.vs.hit(g.vs.xM(), g.vs.yL()) ? Math.abs(g.vs.xM() - this.vs.xM()) : UC.noBid,
      (g) => this.deleteMass()));
  }
}
const stroke = (name, x0, y0, la = 60, lb = 60) => Gesture.AREA.upFrom(compassStroke(name, { x0, y0, la, lb }));
Gesture.AREA.upFrom = function (pts) {
  const [x0, y0] = pts[0]; this.dn(x0, y0);
  for (const p of pts.slice(1, -1)) { this.drag(p[0], p[1]); }
  const [xn, yn] = pts[pts.length - 1]; this.up(Math.round(xn), Math.round(yn));
};

beforeEach(() => {
  World.reset();
  Layer.ensure('BACK'); Layer.ensure('FORE');
  Reaction.initialReactions.addReaction(new Reaction('SW-SW', () => 0, (g) => { new Box(g.vs); }));
});

test('layers are created in order and byName finds them', () => {
  assert.deepEqual(Layer.ALL.map((l) => l.name), ['BACK', 'FORE']);
  assert.equal(Layer.ensure('BACK'), Layer.byName.get('BACK'));
  assert.equal(Layer.ALL.length, 2);
});

test('a Mass joins its layer, holds reactions in the marketplace, and deleteMass cleans both', () => {
  const box = new Box(new VS(0, 0, 100, 100));
  assert.equal(Layer.byName.get('BACK')[0], box);
  assert.equal(Reaction.byShape.getList(Shape.DB.get('S-S')).length, 1);
  box.deleteMass();
  assert.equal(Layer.byName.get('BACK').length, 0);
  assert.equal(Reaction.byShape.getList(Shape.DB.get('S-S')).length, 0);
  assert.equal(box.length, 0);
});

test('an unknown layer name logs and does not crash', () => {
  const m = new Mass('NOPE'); assert.equal(m.layer, undefined); m.deleteMass();
});

test('loBid picks the lowest bid and ignores noBid', () => {
  const list = new Reaction.List();
  const a = new Reaction('S-S', () => 30), b = new Reaction('S-S', () => 5), c = new Reaction('S-S', () => UC.noBid);
  list.push(a, b, c);
  assert.equal(list.loBid({}), b);
  assert.equal(new Reaction.List().loBid({}), null);
  a.enable(); a.enable(); // enabling twice does not duplicate
  assert.equal(Reaction.byShape.getList(Shape.DB.get('S-S')).filter((r) => r === a).length, 1);
  a.disable();
  assert.equal(Reaction.byShape.getList(Shape.DB.get('S-S')).includes(a), false);
});

test('gestures create masses, the closest box wins the delete bid, and N-N undoes', () => {
  stroke('SW-SW', 600, 100, 200, 200);       // big box: x 317..600 (center 458), y 100..383
  stroke('SW-SW', 400, 150, 50, 50);         // small box on top: x 329..400 (center 364), y 150..221
  const back = Layer.byName.get('BACK');
  assert.equal(back.length, 2);
  assert.equal(Gesture.recognized, 'SW-SW');
  assert.equal(Gesture.UNDO.length, 2);
  stroke('S-S', 364, 160, 20, 20);           // S-S down the center of the small box: it outbids the big one
  assert.equal(back.length, 1);
  assert.deepEqual([back[0].vs.size.x], [283]); // the small one is gone
  stroke('N-N', 700, 700);                   // undo the delete: both boxes are back
  assert.equal(back.length, 2);
  assert.equal(Gesture.UNDO.length, 2);
  stroke('N-N', 700, 700); stroke('N-N', 700, 700); stroke('N-N', 700, 700);
  assert.equal(back.length, 0);
  assert.equal(Gesture.UNDO.length, 0);
});

test('a recognized gesture with no bidders reports "no bids" and is not undoable', () => {
  stroke('E-E', 500, 500);
  assert.equal(Gesture.recognized, 'E-E no bids');
  assert.equal(Gesture.UNDO.length, 0);
});

test('World.reset forgets initial reactions so another app can start clean', () => {
  Ink.Buffer.arcLength = false; // PaintInk's index sampling toggle is global state
  World.reset();
  assert.equal(Ink.Buffer.arcLength, true, 'the next app gets the default sub-sampler back');
  assert.equal(Reaction.initialReactions.length, 0);
  assert.equal(Layer.ALL.length, 0);
});
