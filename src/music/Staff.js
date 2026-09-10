// Staff - the 5 lines. Its y comes from an HC hung off its system's top, its
// format (line count, spacing H, barContinues) is shared with the same staff in
// every other system. Most of the music entry reactions live here because the
// staff is what the user draws on: barlines, note heads, rests and clefs.
import { HC, idiv } from '../graphics/G.js';
import { UC } from '../graphics/UC.js';
import { Mass } from '../reaction/Mass.js';
import { Reaction } from '../reaction/Reaction.js';
import { Bar } from './Bar.js';
import { Head } from './Head.js';
import { Rest } from './Rest.js';
import { Clef } from './Clef.js';
import { Glyph } from './Glyph.js';

export class Staff extends Mass {
  constructor(sys, iStaff, staffTop, fmt) {
    super('BACK');
    this.sys = sys; this.iStaff = iStaff; this.staffTop = staffTop; this.fmt = fmt;
    this.clefs = null; // most staffs do NOT define clefs
    this.addBarReactions();
    this.addNoteReactions();
    this.addClefReactions();
  }

  addBarReactions() {
    this.addReaction(new Reaction('S-S', // create a Bar: top line to bottom line of this staff
      (g) => {
        const PAGE = this.sys.page;
        const x = g.vs.xM(), y1 = g.vs.yL(), y2 = g.vs.yH();
        const left = PAGE.margins.left, right = PAGE.margins.right;
        if (x < left || x > (right + UC.barToMarginSnap)) { return UC.noBid; }
        const d = Math.abs(y1 - this.yTop()) + Math.abs(y2 - this.yBot());
        const bias = UC.barToMarginSnap; // max cycleBar bid, which must outbid createBar
        return (d < 30) ? (d + bias) : UC.noBid;
      },
      (g) => { new Bar(this.sys, g.vs.xM()); }));

    this.addReaction(new Reaction('S-S', // toggle barContinues: bottom of this staff to top of the next
      (g) => {
        if (this.sys.iSys !== 0) { return UC.noBid; } // only changed in the first system
        if (this.iStaff === this.sys.nStaff() - 1) { return UC.noBid; } // the last staff can't continue
        const y1 = g.vs.yL(), y2 = g.vs.yH();
        if (Math.abs(y1 - this.yBot()) > 20) { return UC.noBid; }
        const nextStaff = this.sys.staffs[this.iStaff + 1];
        if (Math.abs(y2 - nextStaff.yTop()) > 20) { return UC.noBid; }
        return 10;
      },
      (g) => { this.fmt.toggleBarContinues(); }));
  }

  // is (x,y) inside the margins and within one line above/below this staff?
  onStaffBid(x, y) {
    if (x < this.sys.page.margins.left || x > this.sys.page.margins.right) { return UC.noBid; }
    const H = this.H(), top = this.yTop() - H, bot = this.yBot() + H;
    if (y < top || y > bot) { return UC.noBid; }
    return 10;
  }

  addNoteReactions() {
    this.addReaction(new Reaction('SW-SW', // add a note Head
      (g) => this.onStaffBid(g.vs.xM(), g.vs.yM()),
      (g) => { new Head(this, g.vs.xM(), g.vs.yM()); }));
    this.addReaction(new Reaction('W-S', // add a quarter Rest
      (g) => this.onStaffBid(g.vs.xL(), g.vs.yM()),
      (g) => { new Rest(this, this.sys.getTime(g.vs.xL())); }));
    this.addReaction(new Reaction('E-S', // add an eighth Rest (it looks like a 7)
      (g) => this.onStaffBid(g.vs.xL(), g.vs.yM()),
      (g) => { new Rest(this, this.sys.getTime(g.vs.xL())).nFlag = 1; }));
  }

  addClefReactions() {
    const clefBid = (g) => { // top line to bottom line, like a bar, but a V shape
      const dTop = Math.abs(g.vs.yL() - this.yTop()), dBot = Math.abs(g.vs.yH() - this.yBot());
      return (dTop + dBot > 60) ? UC.noBid : dTop + dBot;
    };
    const clefAct = (glyph) => (g) => {
      if (this.initialClef() == null) { this.setInitialClef(glyph); } else { this.addNewClef(glyph, g.vs.xM()); }
    };
    this.addReaction(new Reaction('SW-SE', clefBid, clefAct(Glyph.CLEF_G))); // "<" is a G clef
    this.addReaction(new Reaction('SE-SW', clefBid, clefAct(Glyph.CLEF_F))); // ">" is an F clef
  }

  copy(newSys) { // a copy of this staff for a new system: same fmt, same offset from its sys top
    const hc = new HC(newSys.staffs.sysTop, this.staffTop.dv);
    return new Staff(newSys, this.iStaff, hc, this.fmt);
  }

  show(g) {
    const m = this.sys.page.margins;
    const x1 = m.left, x2 = m.right, y = this.yTop(), h = this.fmt.H * 2;
    for (let i = 0; i < this.fmt.nLines; i++) { g.drawLine(x1, y + i * h, x2, y + i * h); }
    const clef = this.initialClef();
    if (clef != null) { clef.glyph.showAt(g, this.fmt.H, m.left + UC.initialClefOffset, this.yOfLine(4)); }
  }

  // ----- coordinates: line 0 is the top line, 1 the first space, 2 the second line... -----
  H() { return this.fmt.H; }
  yTop() { return this.staffTop.v(); }
  yOfLine(line) { return this.yTop() + line * this.fmt.H; }
  yLine(n) { return this.yOfLine(n); }
  yBot() { return this.yOfLine(2 * (this.fmt.nLines - 1)); }
  lineOfY(y) { // snap a y to the nearest line, including ledger lines above the staff (negative)
    const H = this.fmt.H, Bias = 100;   // integer truncation rounds toward 0 ..
    const top = this.yTop() - H * Bias; // .. so move the origin far above the staff
    return idiv(y - top + idiv(H, 2), H) - Bias;
  }

  // ----- clefs: the initial clef of a staff is whatever the previous staff was left in -----
  previousStaff() {
    return this.sys.iSys === 0 ? null : this.sys.page.sysList[this.sys.iSys - 1].staffs[this.iStaff];
  }
  lastClef() { return this.clefs == null ? null : this.clefs[this.clefs.length - 1]; }
  firstClef() { return this.clefs == null ? null : this.clefs[0]; }
  initialClef() { // can return null if no clef has ever been set
    let s = this, ps = this.previousStaff();
    while (ps != null && ps.clefs == null) { s = ps; ps = s.previousStaff(); }
    return ps == null ? s.firstClef() : ps.lastClef();
  }
  setInitialClef(glyph) {
    let s = this, ps = this.previousStaff();
    while (ps != null) { s = ps; ps = s.previousStaff(); } // find the base of this staff chain
    s.clefs = new Clef.List();
    s.clefs.push(new Clef(s, -900, glyph)); // negative x so it doesn't show as a Mass
  }
  addNewClef(glyph, x) {
    if (this.clefs == null) { this.clefs = new Clef.List(); }
    this.clefs.push(new Clef(this, x, glyph));
    this.clefs.sort((a, b) => a.compareTo(b));
  }
  clefAtX(x) { // can return null
    const iClef = this.initialClef();
    if (iClef == null) { return null; }
    let ret = iClef.glyph;
    if (this.clefs != null) { for (const clef of this.clefs) { if (clef.x <= x) { ret = clef.glyph; } } }
    return ret;
  }
}

//-----------------STAFF FMT--------------------
// Shared by the same staff in every system: change it once, it changes everywhere.
Staff.Fmt = class {
  constructor(nLines, H) { this.nLines = nLines; this.H = H; this.barContinues = false; }
  toggleBarContinues() { this.barContinues = !this.barContinues; }
  height() { return 2 * this.H * (this.nLines - 1); }
};
Staff.Fmt.DEFAULT = new Staff.Fmt(5, 8);

//--------------------STAFF.LIST-------------------
Staff.List = class extends Array {
  static get [Symbol.species]() { return Array; }
  constructor(sysTop) { super(); this.sysTop = sysTop; } // each staff hangs off this HC
};
