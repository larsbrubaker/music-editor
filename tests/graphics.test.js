import { test } from 'node:test';
import assert from 'node:assert/strict';
import { G, V, VS, LoHi, BBox, PL, HC, Transform, idiv } from '../src/graphics/G.js';
import { RecordingGraphics } from './helpers/RecordingGraphics.js';

test('idiv truncates toward zero like Java int division', () => {
  assert.equal(idiv(17 * 4, 5), 13);
  assert.equal(idiv(-7, 2), -3);
  assert.equal(idiv(7, -2), -3);
});

test('V set/add/blend', () => {
  const v = new V(1, 2); v.add(new V(3, 4));
  assert.deepEqual([v.x, v.y], [4, 6]);
  const copy = new V(v); assert.deepEqual([copy.x, copy.y], [4, 6]);
  const avg = new V(10, 10); avg.blend(new V(20, 0), 1); // average of 2 values
  assert.deepEqual([avg.x, avg.y], [15, 5]);
  avg.blend(new V(30, 30), 2); // average of 3 values: (15*2+30)/3=20, (5*2+30)/3=13
  assert.deepEqual([avg.x, avg.y], [20, 13]);
});

test('VS hit detection and edges', () => {
  const vs = new VS(10, 20, 100, 50);
  assert.ok(vs.hit(10, 20)); assert.ok(vs.hit(110, 70)); assert.ok(vs.hit(60, 45));
  assert.ok(!vs.hit(9, 45)); assert.ok(!vs.hit(60, 71));
  assert.equal(vs.xL(), 10); assert.equal(vs.xH(), 110); assert.equal(vs.xM(), 60);
  assert.equal(vs.yL(), 20); assert.equal(vs.yH(), 70); assert.equal(vs.yM(), 45);
});

test('LoHi never reports size 0 and constrains', () => {
  const r = new LoHi(0, 0); r.set(5); assert.equal(r.size(), 1);
  r.add(9); r.add(2); assert.deepEqual([r.lo, r.hi, r.size()], [2, 9, 7]);
  assert.equal(r.constrain(1), 2); assert.equal(r.constrain(20), 9); assert.equal(r.constrain(5), 5);
});

test('BBox grows and converts to VS', () => {
  const b = new BBox(); b.set(50, 60); b.add(10, 80); b.add(new V(70, 20));
  const vs = b.getNewVS();
  assert.deepEqual([vs.loc.x, vs.loc.y, vs.size.x, vs.size.y], [10, 20, 60, 60]);
});

test('Transform maps one box onto another isomorphically and centered', () => {
  const T = new Transform();
  T.set(new VS(100, 100, 200, 100), new VS(0, 0, 1000, 1000)); // wide box into square
  V.T = T;
  const center = new V(200, 150), left = new V(100, 100), right = new V(300, 200);
  assert.deepEqual([center.tx(), center.ty()], [500, 500]);
  assert.deepEqual([left.tx(), left.ty()], [0, 250]);   // height only fills half the square
  assert.deepEqual([right.tx(), right.ty()], [1000, 750]);
});

test('Transform from a BBox uses LoHi sizes so a degenerate stroke still maps', () => {
  const b = new BBox(); b.set(40, 100); b.add(40, 300); // a perfectly vertical line
  V.T.set(b, new VS(0, 0, 1000, 1000));
  const p = new V(40, 200);
  assert.deepEqual([p.tx(), p.ty()], [500, 500]);
});

test('PL.transform applies V.T to every point', () => {
  const pl = new PL(3);
  pl.points[0].set(0, 0); pl.points[1].set(50, 50); pl.points[2].set(100, 100);
  V.T.set(new VS(0, 0, 100, 100), new VS(0, 0, 10, 10));
  pl.transform();
  assert.deepEqual(pl.points.map((p) => [p.x, p.y]), [[0, 0], [5, 5], [10, 10]]);
});

test('HC hierarchical coordinates sum offsets down to ZERO', () => {
  const pageTop = new HC(HC.ZERO, 50);
  const sysTop = new HC(pageTop, 100);
  const staffTop = new HC(sysTop, 30);
  assert.equal(HC.ZERO.v(), 0);
  assert.equal(pageTop.v(), 50);
  assert.equal(staffTop.v(), 180);
  pageTop.dv = 70; // moving the page moves everything under it
  assert.equal(staffTop.v(), 200);
});

test('spline recursion draws 2^n segments from A to C', () => {
  const g = new RecordingGraphics();
  G.spline(g, 0, 0, 50, 100, 100, 0, 3);
  const lines = g.named('drawLine');
  assert.equal(lines.length, 8);
  assert.deepEqual(lines[0].args.slice(0, 2), [0, 0]);
  assert.deepEqual(lines[7].args.slice(2, 4), [100, 0]);
  G.poly.reset(); G.pSpline(0, 0, 50, 100, 100, 0, 2);
  assert.equal(G.poly.npoints, 8);
});

test('G.rnd stays in range and fillBack paints white', () => {
  for (let i = 0; i < 100; i++) { const r = G.rnd(5); assert.ok(r >= 0 && r < 5); }
  const g = new RecordingGraphics(); G.fillBack(g);
  assert.equal(g.calls[0].color, '#ffffff');
});
