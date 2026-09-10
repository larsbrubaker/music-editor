// Page - a list of systems (Sys) plus the margins. The first W-W stroke on a blank
// page creates the Page (and its first Sys and first Staff); after that the page's
// own reactions add staffs to the first system (W-W) and add new systems (W-E).
import { HC } from '../graphics/G.js';
import { Color } from '../graphics/Color.js';
import { UC } from '../graphics/UC.js';
import { Mass } from '../reaction/Mass.js';
import { Reaction } from '../reaction/Reaction.js';
import { Sys } from './Sys.js';

//-----------------MARGINS--------------------------
export class Margins {
  static MM = 50;
  constructor() {
    this.top = Margins.MM; this.left = Margins.MM;
    this.right = UC.mainWindowWidth - Margins.MM; this.bot = UC.mainWindowHeight - Margins.MM;
  }
}

export class Page extends Mass {
  constructor(y) {
    super('BACK');
    this.margins = new Margins();
    this.sysGap = 0;   // spacing between systems, set when the 2nd Sys is added
    this.maxH = 0;     // largest H value in all the Staff.Fmt for the system
    this.sysList = [];
    this.margins.top = y;
    this.pageTop = new HC(HC.ZERO, y);           // pageTop is dad for each Sys
    const sysTop = new HC(this.pageTop, 0);      // locate the top of the first system
    this.sysList.push(new Sys(this, sysTop));    // create the first system on the page
    this.updateMaxH();

    this.addReaction(new Reaction('W-W', // add a new Staff to the first Sys - only while it is the only Sys
      (g) => {
        if (this.sysList.length !== 1) { return UC.noBid; }
        const sys = this.sysList[0], y2 = g.vs.yM();
        if (y2 < sys.yBot() + UC.minStaffGap) { return UC.noBid; }
        return 1000;
      },
      (g) => { this.sysList[0].addNewStaff(g.vs.yM()); }));

    this.addReaction(new Reaction('W-E', // add a new Sys to the Page
      (g) => {
        const lastSys = this.sysList[this.sysList.length - 1], y2 = g.vs.yM();
        if (y2 < lastSys.yBot() + UC.minSysGap) { return UC.noBid; }
        return 1000;
      },
      (g) => { this.addNewSys(g.vs.yM()); }));
  }

  addNewSys(y) { // called by a page reaction, so it is safe to assume 1 Sys already
    const nSys = this.sysList.length, sysHeight = this.sysList[0].height();
    if (nSys === 1) { this.sysGap = y - sysHeight - this.pageTop.v(); } // the 2nd Sys defines sysGap
    const sysTop = new HC(this.pageTop, nSys * (sysHeight + this.sysGap));
    this.sysList.push(new Sys(this, sysTop));
  }

  show(g) { g.setColor(Color.BLACK); } // sets the color for drawing Sys & Staffs

  updateMaxH() {
    const sys = this.sysList[0];
    const newH = sys.staffs[sys.staffs.length - 1].fmt.H; // H from the most recent staff addition
    if (this.maxH < newH) { this.maxH = newH; }
  }
}
Page.Margins = Margins;
