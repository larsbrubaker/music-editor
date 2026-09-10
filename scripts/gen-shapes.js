// Generates assets/shapes.json - the baseline Shape database that ships with the
// app so gestures work before anyone has trained anything. It runs synthetic
// strokes through the REAL Ink -> Norm -> Shape.DB.train pipeline, so the stored
// prototypes are exactly what the trainer would have produced.
//   node scripts/gen-shapes.js
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Shape } from '../src/reaction/Shape.js';
import { compassStroke, circleStroke, inkFromPoints } from '../tests/helpers/strokes.js';

export const SHIPPED_GESTURES = ['N-N', 'S-S', 'E-E', 'W-W', 'W-E', 'SW-SW', 'W-S', 'E-S', 'SW-SE', 'SE-SW'];

export function buildDefaultDatabase(db = Shape.DB) {
  const ratios = [[120, 120], [80, 140], [140, 80], [100, 160], [160, 100]];
  for (const name of SHIPPED_GESTURES) {
    const [a, b] = name.split('-');
    const variants = (a === b) ? [[120, 120]] : ratios;
    for (const [la, lb] of variants) { db.train(name, inkFromPoints(compassStroke(name, { la, lb })).norm); }
  }
  db.train('O', inkFromPoints(circleStroke({ cw: true })).norm);
  db.train('O', inkFromPoints(circleStroke({ cw: false })).norm);
  return db;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = buildDefaultDatabase();
  const out = join(import.meta.dirname, '..', 'assets', 'shapes.json');
  writeFileSync(out, JSON.stringify(db.toJSON()));
  const summary = [...db.entries()].map(([n, s]) => `${n}:${s.prototypes.length}`).join(' ');
  console.log('wrote', out, '\n', summary);
}
