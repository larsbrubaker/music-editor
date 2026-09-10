// Duration - what Stems and Rests have in common: a flag count and a dot count.
// nFlag: 0 = quarter, 1..4 = eighth..sixty-fourth, -1 = half, -2 = whole.
import { Mass } from '../reaction/Mass.js';

export class Duration extends Mass {
  constructor() { super('NOTE'); this.nFlag = 0; this.nDot = 0; }
  show(g) { throw new Error('Duration.show is abstract: Rest and Stem implement it'); }
  incFlag() { if (this.nFlag < 4) { this.nFlag++; } }
  decFlag() { if (this.nFlag > -2) { this.nFlag--; } }
  cycleDot() { this.nDot++; if (this.nDot > 3) { this.nDot = 0; } }
}
