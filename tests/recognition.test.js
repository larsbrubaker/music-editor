import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UC } from '../src/graphics/UC.js';
import { Ink, Norm } from '../src/reaction/Ink.js';
import { Shape, Prototype, Database, Trainer } from '../src/reaction/Shape.js';
import { compassStroke, circleStroke, inkFromPoints } from './helpers/strokes.js';
import { RecordingGraphics } from './helpers/RecordingGraphics.js';

const shipped = JSON.parse(readFileSync(new URL('../assets/shapes.json', import.meta.url)));
Shape.DB.mergeJSON(shipped);

test('sub-sampling keeps first and last points and N points', () => {
  const pts = []; for (let i = 0; i < 100; i++) { pts.push([i * 3, i * 2]); }
  const ink = inkFromPoints(pts);
  assert.equal(ink.norm.size(), UC.normSampleSize);
  assert.deepEqual([ink.vs.loc.x, ink.vs.loc.y, ink.vs.size.x, ink.vs.size.y], [0, 0, 297, 198]);
});

test('normalized coordinates land in the 0..1000 box, centered on the short axis', () => {
  const ink = inkFromPoints(compassStroke('S-S'));
  for (const p of ink.norm.points) { assert.equal(p.x, 500); assert.ok(p.y >= 0 && p.y <= 1000); }
  assert.equal(ink.norm.points[0].y, 0);
  assert.equal(ink.norm.points[UC.normSampleSize - 1].y, 1000);
});

test('the same shape drawn at another size and place has a small distance; a different shape is far', () => {
  const a = inkFromPoints(compassStroke('SW-SE', { x0: 100, y0: 100, la: 60, lb: 60 })).norm;
  const b = inkFromPoints(compassStroke('SW-SE', { x0: 600, y0: 400, la: 200, lb: 200 })).norm;
  const c = inkFromPoints(compassStroke('SE-SW', { x0: 600, y0: 400, la: 200, lb: 200 })).norm;
  assert.ok(a.dist(b) < 20000, 'same shape: ' + a.dist(b));
  assert.ok(a.dist(c) > UC.noMatchDist, 'different shape: ' + a.dist(c));
});

test('blend averages a prototype toward new examples', () => {
  const p = new Prototype(false); Norm.fromJSON(new Array(50).fill(0), p);
  const n = new Norm(false); Norm.fromJSON(new Array(50).fill(100), n);
  p.blend(n); assert.equal(p.nBlend, 2); assert.equal(p.points[0].x, 50);
  p.blend(n); assert.equal(p.nBlend, 3); assert.equal(p.points[0].x, 66);
});

test('recognize finds every shipped compass gesture with jitter, at any size and position', () => {
  for (const name of ['N-N', 'S-S', 'E-E', 'W-W', 'W-E', 'SW-SW', 'W-S', 'E-S', 'SW-SE', 'SE-SW']) {
    for (const [la, lb] of [[100, 100], [60, 90], [200, 120]]) {
      const ink = inkFromPoints(compassStroke(name, { x0: 700, y0: 500, la, lb, perLeg: 18, jitter: 3 }));
      const s = Shape.recognize(ink);
      assert.ok(s, `${name} ${la}:${lb} unrecognized`);
      assert.equal(s.name, name, `${name} ${la}:${lb} recognized as ${s.name}`);
    }
  }
  assert.equal(Shape.recognize(inkFromPoints(circleStroke({ cw: false, r: 40 }))).name, 'O');
});

test('a tiny stroke is a DOT and an unmatched stroke is null', () => {
  assert.equal(Shape.recognize(inkFromPoints([[10, 10], [12, 11], [13, 12]])), Shape.DOT);
  const zig = []; for (let i = 0; i < 30; i++) { zig.push([i * 10, (i % 2) * 200]); }
  assert.equal(Shape.recognize(inkFromPoints(zig)), null);
});

test('Database round trips through JSON and merges keep Shape identity', () => {
  const db = new Database();
  db.train('X-Y', inkFromPoints(compassStroke('W-S')).norm);
  const before = db.get('X-Y');
  const json = JSON.parse(JSON.stringify(db.toJSON()));
  assert.deepEqual(Object.keys(json.shapes), ['X-Y']);
  db.mergeJSON(json);
  assert.equal(db.get('X-Y'), before);
  assert.equal(db.get('X-Y').prototypes.length, 1);
  assert.ok(db.has('DOT'));
  assert.ok(!Database.isLegal('DOT') && !Database.isLegal('') && !Database.isLegal('a b') && Database.isLegal('S-S'));
});

test('training blends similar strokes and adds a prototype for different ones', () => {
  const db = new Database();
  db.train('T', inkFromPoints(compassStroke('W-S', { la: 100, lb: 100 })).norm);
  db.train('T', inkFromPoints(compassStroke('W-S', { la: 100, lb: 100, jitter: 2 })).norm);
  assert.equal(db.get('T').prototypes.length, 1);
  assert.equal(db.get('T').prototypes[0].nBlend, 2);
  db.train('T', inkFromPoints(compassStroke('N-N')).norm);
  assert.equal(db.get('T').prototypes.length, 2);
  db.train('DOT', inkFromPoints(compassStroke('N-N')).norm); // illegal: silently ignored
  assert.equal(db.get('DOT').prototypes.length, 0);
});

test('Trainer types a name, trains it, deletes a prototype and shows', () => {
  const saved = Shape.DB; Shape.DB = new Database();
  try {
    const t = new Trainer();
    const type = (s) => { for (const c of s) { t.keyTyped({ getKeyChar: () => c }); } };
    assert.equal(t.curState, Trainer.ILLEGAL);
    type('Q-Q'); assert.equal(t.curState, Trainer.UNKNOWN);
    type('\b'); assert.equal(t.curName, 'Q-');
    type('Q');
    const pts = compassStroke('E-S');
    t.dn(...pts[0]); for (const p of pts.slice(1, -1)) { t.drag(...p); } t.up(...pts[pts.length - 1]);
    assert.equal(t.curState, Trainer.KNOWN);
    assert.equal(Shape.DB.get('Q-Q').prototypes.length, 1);
    const g = new RecordingGraphics(); t.show(g);
    assert.ok(g.named('drawString').some((c) => c.args[0].includes('Q-Q')));
    t.dn(15, 15); t.up(15, 15); // a click in the first showbox deletes prototype 0
    assert.equal(Shape.DB.get('Q-Q').prototypes.length, 0);
    type(' '); assert.equal(t.curName, ''); assert.equal(t.curState, Trainer.ILLEGAL);
  } finally { Shape.DB = saved; }
});
