// Time - essentially a shared x value. Notes that sound together share a Time, so
// a new head drawn close to an existing Time snaps to it instead of making a new one.
import { UC } from '../graphics/UC.js';

export class Time {
  constructor(sys, x) { this.x = x; this.heads = []; sys.times.push(this); } // apps call sys.getTime(x)
  addHead(head) { this.heads.push(head); }
  removeHead(head) { const i = this.heads.indexOf(head); if (i >= 0) { this.heads.splice(i, 1); } }
  unStemHeads(y1, y2) {
    for (const h of this.heads.slice()) { // slice: unStem can delete stems, which mutates nothing here, but be safe
      const y = h.y();
      if (y > y1 && y < y2) { h.unStem(); }
    }
  }
}

// ------------List------------------------
Time.List = class extends Array {
  static get [Symbol.species]() { return Array; }
  constructor(sys) { super(); this.sys = sys; } // lists of times are shared across a single sys
  getTime(x) {
    if (this.length === 0) { return new Time(this.sys, x); }
    const t = this.getClosestTime(x);
    return (Math.abs(x - t.x) < UC.snapTime) ? t : new Time(this.sys, x);
  }
  getClosestTime(x) {
    let res = this[0], bestSoFar = Math.abs(x - res.x);
    for (const t of this) {
      const dist = Math.abs(x - t.x);
      if (dist < bestSoFar) { res = t; bestSoFar = dist; }
    }
    return res;
  }
};
