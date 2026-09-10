// Gesture - a recognized Shape plus the VS box where it happened. Gesture.AREA is
// the I.Area that collects ink, recognizes it, runs the reaction auction and acts.
// The UNDO list of gestures makes undo possible: remove the last gesture, wipe the
// world, and redo everything that is left.
import { UC } from '../graphics/UC.js';
import { Ink } from './Ink.js';
import { Shape } from './Shape.js';
import { Reaction } from './Reaction.js';
import { Layer } from './Layer.js';

export class Gesture {
  static recognized = 'null'; // debug info set by Gesture.AREA
  static UNDO = null;         // set below, once List exists
  static undoShapeName = 'N-N'; // the ONE shape reserved for undo

  constructor(shape, vs) { this.shape = shape; this.vs = vs; }

  static getNew(ink) { // can return null
    const s = Shape.recognize(ink);
    return (s == null) ? null : new Gesture(s, ink.vs);
  }

  redoGesture() { // just do it! - don't put on UNDO, it's already there
    const r = Reaction.best(this);
    if (r != null) { r.act(this); }
  }
  doGesture() { // IF the gesture reacts, add it to the undo list and do it
    const r = Reaction.best(this);
    if (r != null) { Gesture.UNDO.push(this); r.act(this); } else { Gesture.recognized += ' no bids'; }
  }

  static undo() {
    if (Gesture.UNDO.length > 0) {
      Gesture.UNDO.pop();      // remove the last element
      Layer.nuke();            // eliminates all the masses
      Reaction.nuke();         // clears byShape then reloads the initial reactions
      Gesture.UNDO.redo();
    }
  }
  static clearUndo() { Gesture.UNDO.length = 0; }

  static AREA = {
    hit(x, y) { return true; },
    dn(x, y) { Ink.BUFFER.dn(x, y); },
    drag(x, y) { Ink.BUFFER.drag(x, y); },
    up(x, y) {
      Ink.BUFFER.add(x, y);
      const ink = new Ink();
      const gest = Gesture.getNew(ink); // can fail if unrecognized
      Ink.BUFFER.clear();
      Gesture.recognized = (gest == null) ? 'null' : gest.shape.name;
      if (gest != null) {
        if (gest.shape.name === Gesture.undoShapeName) { Gesture.undo(); } // hardwired UNDO
        else { gest.doGesture(); }
      }
    },
  };
}

//----------------------LIST-----------------------
Gesture.List = class extends Array {
  static get [Symbol.species]() { return Array; }
  redo() { for (const gest of this) { gest.redoGesture(); } }
};
Gesture.UNDO = new Gesture.List();
