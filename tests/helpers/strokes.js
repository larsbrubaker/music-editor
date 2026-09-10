// Synthetic mouse strokes for tests and for generating the shipped shape database.
// A compass gesture "A-B" is a straight leg in direction A followed by one in B.
import { Ink } from '../../src/reaction/Ink.js';

export const DIR = {
  N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0],
  NE: [Math.SQRT1_2, -Math.SQRT1_2], NW: [-Math.SQRT1_2, -Math.SQRT1_2],
  SE: [Math.SQRT1_2, Math.SQRT1_2], SW: [-Math.SQRT1_2, Math.SQRT1_2],
};

// points along leg A (length la) then leg B (length lb), starting at (x0,y0)
export function compassStroke(name, { x0 = 300, y0 = 300, la = 120, lb = 120, perLeg = 30, jitter = 0 } = {}) {
  const [a, b] = name.split('-');
  const pts = [];
  let x = x0, y = y0;
  const legs = (a === b) ? [[DIR[a], la + lb, perLeg * 2]] : [[DIR[a], la, perLeg], [DIR[b], lb, perLeg]];
  for (const [d, len, n] of legs) {
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n;
      const jx = jitter ? (Math.random() * 2 - 1) * jitter : 0, jy = jitter ? (Math.random() * 2 - 1) * jitter : 0;
      pts.push([x + d[0] * len * t + jx, y + d[1] * len * t + jy]);
    }
    x += d[0] * len; y += d[1] * len;
  }
  return [[x0, y0], ...pts];
}

// a circle stroke starting at the top; cw=true is clockwise on the screen
export function circleStroke({ cx = 300, cy = 300, r = 80, n = 50, cw = true } = {}) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (cw ? 1 : -1) * i / n * Math.PI * 2 - Math.PI / 2;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts;
}

// feed a list of [x,y] into Ink.BUFFER the way the mouse would, return the Ink
export function inkFromPoints(points) {
  const [x0, y0] = points[0];
  Ink.BUFFER.dn(Math.round(x0), Math.round(y0));
  for (let i = 1; i < points.length - 1; i++) { Ink.BUFFER.drag(Math.round(points[i][0]), Math.round(points[i][1])); }
  const [xn, yn] = points[points.length - 1];
  Ink.BUFFER.up(Math.round(xn), Math.round(yn));
  return new Ink(); // NOTE: Ink.BUFFER still holds the stroke, as it would after a real mouse up
}

// drive Gesture.AREA with a list of [x,y] points, like a mouse down/drag/up
export function gesture(AREA, points) {
  const [x0, y0] = points[0]; AREA.dn(Math.round(x0), Math.round(y0));
  for (const p of points.slice(1, -1)) { AREA.drag(Math.round(p[0]), Math.round(p[1])); }
  const [xn, yn] = points[points.length - 1]; AREA.up(Math.round(xn), Math.round(yn));
}
// a compass gesture whose bounding box is exactly x1..x2, y1..y2 (as the course's bids see it)
export function compassInBox(name, x1, y1, x2, y2) {
  const [a, b] = name.split('-');
  const pts = [];
  const seg = (p, q, n = 15) => { for (let i = 0; i <= n; i++) { pts.push([p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n]); } };
  const corner = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0], NE: [1, -1], NW: [-1, -1], SE: [1, 1], SW: [-1, 1] };
  const [ax, ay] = corner[a], [bx, by] = corner[b];
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, hw = (x2 - x1) / 2, hh = (y2 - y1) / 2;
  if (a === b) { // a straight line across the box in direction a
    seg([cx - ax * hw, cy - ay * hh], [cx + ax * hw, cy + ay * hh], 30);
  } else { // two legs: start, then the corner, then the end
    const start = [cx - ax * hw, cy - ay * hh];
    const mid = [cx + (ax === 0 ? -bx : ax) * hw * (ax === 0 ? 0 : 1), cy + (ay === 0 ? -by : ay) * hh * (ay === 0 ? 0 : 1)];
    const midFixed = [ax === 0 ? cx : cx + ax * hw, ay === 0 ? cy : cy + ay * hh];
    const end = [midFixed[0] + bx * (ax === 0 ? hw * 2 : hw * (bx === -ax ? 2 : 1)), midFixed[1] + by * (ay === 0 ? hh * 2 : hh * (by === -ay ? 2 : 1))];
    void mid;
    seg(start, midFixed); seg(midFixed, end);
  }
  return pts;
}
