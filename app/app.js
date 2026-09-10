// Wires the MusicEd app into the page: buttons, status line, shape database import/export.
import { ready } from '../site/demo.js';
import { MusicEd } from '../src/music/MusicEd.js';
import { Shape } from '../src/reaction/Shape.js';
import { Gesture } from '../src/reaction/Gesture.js';
import { Glyph } from '../src/music/Glyph.js';

const $ = (id) => document.getElementById(id);
const status = $('status');

await ready();
const app = new MusicEd();
app.mount($('stage'));
const showStatus = () => {
  if (app.training) { status.textContent = 'TRAINING: type a shape name, draw examples, Enter saves'; return; }
  status.textContent = `recognized: ${Gesture.recognized}   shapes: ${[...Shape.DB.keys()].join(' ')}`;
};
app.onChange = showStatus;
showStatus();

$('undo').addEventListener('click', () => { app.undo(); showStatus(); });
$('boxes').addEventListener('change', () => { Glyph.debugBoxes = $('boxes').checked; app.repaint(); });
$('newpage').addEventListener('click', () => { app.newPage(); showStatus(); });
$('train').addEventListener('click', () => {
  app.toggleTraining();
  $('train').textContent = app.training ? 'Back to the editor' : 'Train shapes';
  $('stage').focus(); showStatus();
});
$('save').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(Shape.DB.toJSON(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shapes.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('load').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', async () => {
  const f = $('file').files[0]; if (!f) { return; }
  try { Shape.DB.mergeJSON(JSON.parse(await f.text())); Shape.DB.save(); status.textContent = 'loaded ' + f.name; }
  catch (e) { status.textContent = 'could not load ' + f.name + ': ' + e.message; }
  $('file').value = '';
});
$('defaults').addEventListener('click', async () => {
  Shape.DB.clearSaved();
  for (const [name, s] of Shape.DB) { if (name !== 'DOT') { s.prototypes.length = 0; } }
  await Shape.loadDefaults(new URL('../assets/shapes.json', import.meta.url).href);
  showStatus();
});
