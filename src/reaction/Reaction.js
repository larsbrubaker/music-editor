// Reaction - something that bids on a Gesture and, if it wins, acts on it.
//
// Reactions live in two places: the Reaction.List owned by the Mass that created
// them, and the byShape "marketplace" Map that goes from a Shape to every enabled
// reaction looking for that shape. enable()/disable() control the second one.
//
// Java used anonymous subclasses ("new Reaction("S-S"){ bid.. act.. }") with the
// compound "Box.this" to reach the owning Mass. Here you pass bid and act as
// arrow functions, which close over the owning object naturally.
import { UC } from '../graphics/UC.js';
import { Shape } from './Shape.js';

function removeFrom(arr, item) { const i = arr.indexOf(item); if (i >= 0) { arr.splice(i, 1); } }

export class Reaction {
  constructor(shapeName, bid, act) {
    this.shape = Shape.DB.get(shapeName);
    if (this.shape == null) { console.log("WTF? - Shape.DB don't know about: " + shapeName); }
    if (bid) { this.bid = bid; }
    if (act) { this.act = act; }
  }
  bid(g) { return UC.noBid; }  // subclasses / instances must supply these
  act(g) {}

  enable() { // adds to the byShape Map
    if (this.shape == null) { return; }
    const list = Reaction.byShape.getList(this.shape);
    if (!list.includes(this)) { list.push(this); } // prevent multiple copies on the list
  }
  disable() { if (this.shape == null) { return; } removeFrom(Reaction.byShape.getList(this.shape), this); }

  static best(gest) { return Reaction.byShape.getList(gest.shape).loBid(gest); } // can return null
  static nuke() { // used to reset for UNDO
    Reaction.byShape = new ReactionMap();
    Reaction.initialReactions.enable(); // enable insures that the reaction is in the byShape Map
  }
  // forget everything, including the initial reactions - used when switching apps
  static resetAll() { Reaction.byShape = new ReactionMap(); Reaction.initialReactions = new ReactionList(); }
}

// ------ List -------
export class ReactionList extends Array {
  static get [Symbol.species]() { return Array; } // map/filter give plain arrays, not lists
  // adding and removing is done to TWO lists, the one in a Mass and the one in the byShape Map
  addReaction(r) { this.push(r); r.enable(); }
  enable() { for (const r of this) { r.enable(); } } // enables the entire list
  removeReaction(r) { removeFrom(this, r); r.disable(); }
  clearAll() { for (const r of this) { r.disable(); } this.length = 0; }
  loBid(gest) { // can return null - list is empty or no one wants to bid
    let res = null, bestSoFar = UC.noBid;
    for (const r of this) {
      const b = r.bid(gest);
      if (b < bestSoFar) { bestSoFar = b; res = r; }
    }
    return res;
  }
}

// ------ Map ------------
export class ReactionMap extends Map {
  getList(s) { // always succeeds
    let res = this.get(s);
    if (res == null) { res = new ReactionList(); this.set(s, res); }
    return res;
  }
}
Reaction.List = ReactionList;
Reaction.Map = ReactionMap;
Reaction.byShape = new ReactionMap();
Reaction.initialReactions = new ReactionList(); // used by Undo to restart everything
