import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Shape } from '../src/reaction/Shape.js';
import { Gesture } from '../src/reaction/Gesture.js';
import { Layer } from '../src/reaction/Layer.js';
import { MusicEd } from '../src/music/MusicEd.js';
import { Glyph } from '../src/music/Glyph.js';
import { Head } from '../src/music/Head.js';
import { Stem } from '../src/music/Stem.js';
import { Beam } from '../src/music/Beam.js';
import { Rest } from '../src/music/Rest.js';
import { Bar } from '../src/music/Bar.js';
import { gesture, compassStroke } from './helpers/strokes.js';
import { RecordingGraphics } from './helpers/RecordingGraphics.js';

Shape.DB.mergeJSON(JSON.parse(readFileSync(new URL('../assets/shapes.json', import.meta.url))));

let app;
const A = Gesture.AREA;
const line = (name, x1, y1, x2, y2) => { // a straight compass stroke from (x1,y1) to (x2,y2)
  const pts = []; for (let i = 0; i <= 30; i++) { pts.push([x1 + (x2 - x1) * i / 30, y1 + (y2 - y1) * i / 30]); }
  gesture(A, pts); assert.equal(Gesture.recognized.split(' ')[0], name, `expected ${name} got ${Gesture.recognized}`);
};
const vee = (name, x0, y0, la, lb) => { gesture(A, compassStroke(name, { x0, y0, la, lb, perLeg: 15 })); assert.equal(Gesture.recognized.split(' ')[0], name, `expected ${name} got ${Gesture.recognized}`); };
const dot = (x, y) => gesture(A, [[x, y], [x, y]]);
// a SW-SW head gesture whose bounding box is centered on (x,y)
const head = (x, y) => vee('SW-SW', x + 11, y - 10, 15, 15);
const newSys = (y) => vee('W-E', 600, y, 150, 150); // W then E: a retrace centered at y
const masses = (Type) => Layer.ALL.flatMap((l) => l.filter((m) => m instanceof Type));
const page = () => app.PAGE;
const staff = (i = 0, s = 0) => page().sysList[s].staffs[i];

beforeEach(() => { app = new MusicEd(); line('W-W', 600, 100, 300, 100); }); // top margin at y=100

test('the first W-W makes a page with one system of one staff; W-W adds staffs; W-E adds systems', () => {
  assert.ok(page()); assert.equal(page().margins.top, 100);
  assert.equal(staff().yTop(), 100); assert.equal(staff().yBot(), 164);
  line('W-W', 600, 180, 300, 180); // too close: needs yBot + 30
  assert.equal(page().sysList[0].nStaff(), 1);
  line('W-W', 600, 250, 300, 250);
  assert.equal(page().sysList[0].nStaff(), 2); assert.equal(staff(1).yTop(), 250);
  newSys(400); // 2nd system defines the gap
  assert.equal(page().sysList.length, 2);
  assert.equal(page().sysList[1].yTop(), 400); assert.equal(staff(1, 1).yTop(), 550);
  assert.equal(staff(1, 1).fmt, staff(1, 0).fmt, 'staff formats are shared across systems');
  line('W-W', 600, 700, 300, 700); // with 2 systems, W-W no longer adds staffs
  assert.equal(page().sysList[0].nStaff(), 2);
  const g = new RecordingGraphics(); app.paintComponent(g);
  assert.ok(g.named('drawLine').length >= 20, 'staff lines were drawn');
});

test('S-S from top line to bottom line makes a bar; S-S on it cycles; DOT beside it adds repeat dots; snaps to margin', () => {
  line('S-S', 300, 100, 300, 164);
  assert.equal(masses(Bar).length, 1);
  const bar = masses(Bar)[0]; assert.equal(bar.x, 300); assert.equal(bar.barType, 0);
  line('S-S', 305, 100, 305, 164); // near the existing bar: cycle, don't create
  assert.equal(masses(Bar).length, 1); assert.equal(bar.barType, 1);
  line('S-S', 301, 100, 301, 164); assert.equal(bar.barType, 2);
  dot(285, 130); assert.equal(bar.barType & Bar.LEFT, Bar.LEFT);
  dot(315, 130); assert.equal(bar.barType & Bar.RIGHT, Bar.RIGHT);
  line('S-S', 940, 100, 940, 164); // within 20 of the right margin (950)
  assert.equal(masses(Bar)[1].x, 950);
  line('S-S', 300, 40, 300, 90); // not on a staff: nobody bids
  assert.equal(masses(Bar).length, 2);
  const g = new RecordingGraphics(); app.paintComponent(g);
  assert.ok(g.named('fillRect').length >= 1 && g.named('fillOval').length === 4, 'fat bar and 4 repeat dots');
});

test('SW-SW makes heads that snap to lines and share Times; S-S beside them stems and unstems', () => {
  head(420, 118);   // near line 2 (y 116): snaps to it
  assert.equal(masses(Head).length, 1);
  const h = masses(Head)[0]; assert.equal(h.line, 2); assert.ok(h.stem === null);
  head(430, 148);   // second head close in x: same Time, line 6
  const h2 = masses(Head)[1]; assert.equal(h2.time, h.time); assert.equal(h2.line, 6);
  head(600, 148);   // far away: a new Time
  assert.notEqual(masses(Head)[2].time, h.time);
  const t = h.time, W = h.W();
  line('S-S', t.x + W + 4, 90, t.x + W + 4, 180); // to the right of the heads: an up stem through both
  assert.ok(h.stem != null && h.stem === h2.stem); assert.equal(h.stem.isUp, true);
  assert.equal(h.stem.x(), t.x + W);
  assert.equal(h.stem.yBeamEnd(), staff().yOfLine(2 - 7)); // one octave above the top head (line 2)
  line('S-S', t.x - 4, 90, t.x - 4, 125); // left of the top head only: unstems h, h2 keeps the stem
  assert.ok(h.stem === null); assert.ok(h2.stem != null);
  // a stroke past both: the winner (h, entered first, now unstemmed) decides, so both get a NEW stem
  line('S-S', t.x - 4, 90, t.x - 4, 180);
  assert.ok(h.stem != null && h.stem === h2.stem); assert.equal(h.stem.isUp, false);
  assert.equal(masses(Stem).length, 1, 'the old stem was deleted when it emptied');
  line('S-S', t.x - 4, 130, t.x - 4, 180); // past h2 only: h2 is stemmed, so it unstems
  assert.ok(h2.stem === null); assert.ok(h.stem != null);
  line('S-S', t.x - 4, 90, t.x - 4, 125); // and h: the stem empties and is deleted
  assert.ok(h.stem === null); assert.equal(masses(Stem).length, 0);
  assert.equal(page().sysList[0].stems.length, 0);
});

test('stem layout: octave length, extra length for 3+ flags, reaching the center line, seconds displaced', () => {
  head(420, 116); head(425, 124); // lines 2 and 3: a second
  const [a, b] = masses(Head); const t = a.time, W = a.W();
  line('S-S', t.x - 4, 90, t.x - 4, 140); // down stem on the left
  const s = a.stem; assert.equal(s.isUp, false);
  assert.equal(s.firstHead(), a); assert.equal(s.lastHead(), b);
  assert.equal(a.wrongSide, false); assert.equal(b.wrongSide, true); assert.equal(b.x(), t.x - W);
  assert.equal(s.yBeamEnd(), staff().yOfLine(3 + 7)); // one octave below the last head
  line('E-E', t.x - 30, staff().yOfLine(7), t.x + 30, staff().yOfLine(7)); // crosses the stem: +1 flag
  assert.equal(s.nFlag, 1);
  line('E-E', t.x - 30, staff().yOfLine(7), t.x + 30, staff().yOfLine(7));
  line('E-E', t.x - 30, staff().yOfLine(7), t.x + 30, staff().yOfLine(7));
  assert.equal(s.nFlag, 3); assert.equal(s.yBeamEnd(), staff().yOfLine(10 + 2));
  line('W-W', t.x + 30, staff().yOfLine(7), t.x - 30, staff().yOfLine(7)); assert.equal(s.nFlag, 2);
  for (let i = 0; i < 4; i++) { line('W-W', t.x + 30, staff().yOfLine(7), t.x - 30, staff().yOfLine(7)); }
  assert.equal(s.nFlag, -2, 'clamps at whole note'); assert.equal(a.normalGlyph(), Glyph.HEAD_W);
  dot(a.x() + W + 2, a.y()); assert.equal(s.nDot, 1);
  // a high note with a down stem must reach the center line
  head(700, 116); const hi = masses(Head)[2];
  line('S-S', hi.time.x - 4, 90, hi.time.x - 4, 130);
  assert.equal(hi.line, 2); assert.equal(hi.stem.yBeamEnd(), staff().yOfLine(9));
  const g = new RecordingGraphics(); app.paintComponent(g);
  assert.ok(g.named('drawString').some((c) => c.args[0] === String.fromCharCode(Glyph.HEAD_W.code)));
});

test('E-E across exactly two unflagged stems beams them; more E-E adds beams; internal stems join; W-W to 0 unbeams', () => {
  head(420, 116); head(520, 132); head(620, 124);
  const [a, b, c] = masses(Head);
  const stemUp = (h) => line('S-S', h.time.x + h.W() + 4, 60, h.time.x + h.W() + 4, h.y() + 10);
  stemUp(a); stemUp(c);
  const y = a.stem.yBeamEnd() + 10; // a horizontal line a bit below the beam ends crosses both stems
  line('E-E', 380, y, 700, y);
  assert.equal(masses(Beam).length, 1);
  const beam = masses(Beam)[0];
  assert.equal(a.stem.beam, beam); assert.equal(c.stem.beam, beam);
  assert.equal(a.stem.nFlag, 1); assert.equal(c.stem.nFlag, 1);
  stemUp(b); // its S-S crosses the master beam: an internal stem that joins the beam
  assert.equal(b.stem.beam, beam); assert.equal(beam.stems.length, 3);
  assert.equal(b.stem.yBeamEnd(), Beam.yOfX(b.stem.x(), a.stem.x(), a.stem.yBeamEnd(), c.stem.x(), c.stem.yBeamEnd()));
  line('E-E', 380, y, 700, y); // all three beamed: add a beam to each
  assert.deepEqual(beam.stems.map((s) => s.nFlag), [2, 2, 2]);
  const g = new RecordingGraphics(); app.paintComponent(g);
  assert.equal(g.named('fillPolygon').length, 4, '2 beams x 2 gaps');
  line('W-W', b.stem.x() + 20, y, b.stem.x() - 20, y); // only the middle stem: 1 flag -> a beamlet
  assert.deepEqual(beam.stems.map((s) => s.nFlag), [2, 1, 2]);
  line('W-W', b.stem.x() + 20, y, b.stem.x() - 20, y); // the middle stem hits 0, which breaks the beam
  assert.equal(masses(Beam).length, 0);
  assert.ok(a.stem.beam === null);
});

test('W-S makes a quarter rest, E-S an eighth rest; E-E/W-W flag them, DOT dots them', () => {
  vee('W-S', 500, 110, 20, 20);
  const r = masses(Rest)[0]; assert.equal(r.nFlag, 0); assert.equal(r.line, 4);
  vee('E-S', 700, 110, 20, 20);
  assert.equal(masses(Rest)[1].nFlag, 1);
  line('E-E', r.time.x - 30, r.y(), r.time.x + 30, r.y()); assert.equal(r.nFlag, 1);
  line('W-W', r.time.x + 30, r.y(), r.time.x - 30, r.y()); line('W-W', r.time.x + 30, r.y(), r.time.x - 30, r.y());
  assert.equal(r.nFlag, -1);
  dot(r.time.x + 10, r.y()); assert.equal(r.nDot, 1);
  const g = new RecordingGraphics(); app.paintComponent(g);
  assert.ok(g.named('drawString').some((c) => c.args[0] === String.fromCharCode(Glyph.REST_H.code)));
});

test('clefs: the first clef becomes the initial clef of the whole staff chain; later ones are changes', () => {
  newSys(400); // second system
  assert.equal(staff().initialClef(), null);
  vee('SW-SE', 500, 100, 45, 45);  // a "<" from the top line to the bottom line: G clef
  assert.equal(staff().initialClef().glyph, Glyph.CLEF_G);
  assert.equal(staff(0, 1).initialClef().glyph, Glyph.CLEF_G, 'propagates to the next system');
  assert.equal(staff(0, 1).clefs, null);
  vee('SE-SW', 700, 100, 45, 45);  // a ">" later on the staff: an F clef change at x~700
  assert.equal(staff().clefs.length, 2);
  assert.equal(staff().clefAtX(600), Glyph.CLEF_G); assert.equal(staff().clefAtX(800), Glyph.CLEF_F);
  assert.equal(staff(0, 1).initialClef().glyph, Glyph.CLEF_F, 'the next system starts in the last clef');
  const g = new RecordingGraphics(); app.paintComponent(g);
  // the initial clef is drawn by Staff.show; the Clef mass that records it sits off screen at x=-900
  const gClefs = g.named('drawString').filter((c) => c.args[0] === String.fromCharCode(Glyph.CLEF_G.code));
  assert.deepEqual(gClefs.map((c) => c.args[1] >= 0), [true, false]);
});

test('keys: E-E/W-W across the left margin set the initial key; on a double bar they set a key change', () => {
  vee('SW-SE', 500, 100, 45, 45); // G clef so the key has lines to draw on
  const sys = page().sysList[0];
  line('E-E', 30, 130, 80, 130); line('E-E', 30, 130, 80, 130);
  assert.equal(sys.initialKey.n, 2); assert.equal(sys.initialKey.glyph, Glyph.SHARP);
  for (let i = 0; i < 3; i++) { line('W-W', 80, 130, 30, 130); }
  assert.equal(sys.initialKey.n, -1); assert.equal(sys.initialKey.glyph, Glyph.FLAT);
  line('S-S', 300, 100, 300, 164); line('S-S', 300, 100, 300, 164); // a double bar
  const bar = masses(Bar)[0]; assert.equal(bar.barType, 1);
  line('E-E', 270, 130, 330, 130); assert.equal(bar.key.n, 1);
  line('W-W', 330, 130, 270, 130); assert.equal(bar.key.glyph, Glyph.NATURAL); assert.equal(bar.key.n, 1);
  line('W-W', 330, 130, 270, 130); assert.equal(bar.key.glyph, Glyph.FLAT); assert.equal(bar.key.n, -1);
  const g = new RecordingGraphics(); app.paintComponent(g);
  const drawn = g.named('drawString').map((c) => c.args[0]);
  assert.equal(drawn.filter((s) => s === String.fromCharCode(Glyph.FLAT.code)).length, 2, 'one flat at the margin, one at the bar');
});

test('N-N undoes the last gesture by replaying the rest; trainer toggle switches the mouse area', () => {
  line('W-W', 600, 250, 300, 250); head(420, 116);
  assert.equal(masses(Head).length, 1); assert.equal(page().sysList[0].nStaff(), 2);
  line('N-N', 700, 700, 700, 600);
  assert.equal(masses(Head).length, 0); assert.equal(page().sysList[0].nStaff(), 2);
  line('N-N', 700, 700, 700, 600);
  assert.equal(page().sysList[0].nStaff(), 1);
  line('N-N', 700, 700, 700, 600);
  assert.ok(app.PAGE === null);
  app.mouseReleased({ getX: () => 990, getY: () => 10 });
  assert.equal(app.training, true); assert.equal(app.curArea, Shape.TRAINER);
  app.toggleTraining(); assert.equal(app.curArea, Gesture.AREA);
});
