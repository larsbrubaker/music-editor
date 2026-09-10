// Sys - a system: the staffs that are played together, stacked vertically. Its y
// value is the HC hidden in its staff list. A Sys also owns the pool of shared
// Time values (x positions) and the list of all Stems in the system.
import { HC } from '../graphics/G.js';
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';
import { Mass } from '../reaction/Mass.js';
import { Reaction } from '../reaction/Reaction.js';
import { Staff } from './Staff.js';
import { Time } from './Time.js';
import { Stem } from './Stem.js';
import { Beam } from './Beam.js';
import { Key } from './Key.js';
import { Glyph } from './Glyph.js';

export class Sys extends Mass {
  constructor(page, sysTop) {
    super('BACK');
    this.page = page;
    this.iSys = page.sysList.length;
    this.staffs = new Staff.List(sysTop);
    this.times = new Time.List(this);
    this.stems = new Stem.List();
    this.initialKey = new Key();
    if (this.iSys === 0) { // the first system is created with the first staff in it
      this.staffs.push(new Staff(this, 0, new HC(sysTop, 0), new Staff.Fmt(5, 8)));
    } else { // other systems are clones of the first system
      const oldSys = page.sysList[0];
      for (const oldStaff of oldSys.staffs) { this.staffs.push(oldStaff.copy(this)); }
    }

    this.addReaction(new Reaction('E-E', // beam stems: exactly 2 unbeamed stems, or add a beam to a beamed group
      (g) => {
        const x1 = g.vs.xL(), y1 = g.vs.yL(), x2 = g.vs.xH(), y2 = g.vs.yH();
        if (this.stems.fastReject(y1, y2)) { return UC.noBid; } // gesture does not overlap this sys's stems
        const temp = this.stems.allIntersectors(x1, y1, x2, y2);
        if (temp.length < 2) { return UC.noBid; } // crossing a single stem is a Stem reaction, not ours
        const b = temp[0].beam; // all crossed stems must share one owner (including null!)
        for (const s of temp) { if (s.beam !== b) { return UC.noBid; } }
        if (b == null && temp.length !== 2) { return UC.noBid; } // only a new Beam if exactly 2
        if (b == null && (temp[0].nFlag !== 0 || temp[1].nFlag !== 0)) { return UC.noBid; } // ..and both are unflagged
        return 50; // single stem E-E reactions bid over 50, so this wins a multi-stem crossing
      },
      (g) => {
        const temp = this.stems.allIntersectors(g.vs.xL(), g.vs.yL(), g.vs.xH(), g.vs.yH());
        const b = temp[0].beam;
        if (b == null) { new Beam(temp[0], temp[1]); } else { for (const s of temp) { s.incFlag(); } }
      }));

    const keyBid = (g) => { // an E-E or W-W crossing the left margin inside this sys
      const x = this.page.margins.left, x1 = g.vs.xL(), x2 = g.vs.xH();
      if (x1 > x || x2 < x) { return UC.noBid; }
      const y = g.vs.yM();
      if (y < this.yTop() || y > this.yBot()) { return UC.noBid; }
      return Math.abs(x - Math.trunc((x1 + x2) / 2));
    };
    this.addReaction(new Reaction('E-E', keyBid, (g) => { this.incKey(); }));
    this.addReaction(new Reaction('W-W', keyBid, (g) => { this.decKey(); }));
  }

  nStaff() { return this.staffs.length; }
  getTime(x) { return this.times.getTime(x); }

  show(g) {
    const x = this.page.margins.left;
    g.setColor(Color.BLACK);
    g.drawLine(x, this.yTop(), x, this.yBot()); // the line grouping all the staffs in the sys
    this.initialKey.drawOnSys(g, this, x + UC.marginKeyOffset);
  }

  yTop() { return this.staffs.sysTop.v(); } // y value maintained in the staff list
  yBot() { return this.staffs[this.staffs.length - 1].yBot(); } // bottom of the last staff
  height() { return this.yBot() - this.yTop(); }

  addNewStaff(y) {
    const off = y - this.staffs.sysTop.v();
    const staffTop = new HC(this.staffs.sysTop, off);
    this.staffs.push(new Staff(this, this.staffs.length, staffTop, new Staff.Fmt(5, 8)));
    this.page.updateMaxH();
  }

  incKey() {
    if (this.initialKey.n < 7) { this.initialKey.n++; }
    this.initialKey.glyph = this.initialKey.n >= 0 ? Glyph.SHARP : Glyph.FLAT;
  }
  decKey() {
    if (this.initialKey.n > -7) { this.initialKey.n--; }
    this.initialKey.glyph = this.initialKey.n >= 0 ? Glyph.SHARP : Glyph.FLAT;
  }
}
