// World.reset() forgets every Mass, Reaction, Layer and undoable Gesture so that a
// different reaction based app can start from nothing on the same page.
import { Layer } from './Layer.js';
import { Reaction } from './Reaction.js';
import { Gesture } from './Gesture.js';
import { Ink } from './Ink.js';

export const World = {
  reset() {
    Layer.resetAll();
    Reaction.resetAll();
    Gesture.clearUndo();
    Gesture.recognized = 'null';
    Ink.BUFFER.clear();
    Ink.Buffer.arcLength = true; // PaintInk's index sampling toggle is global; a new app starts on the default
  },
};
