// Shape - a named thing the recognizer can identify ("S-S", "DOT", "O") along with
// the Prototype list of the different ways it can be drawn. Shape.DB is the
// database of all shapes, Shape.recognize(ink) is nearest neighbor matching, and
// Shape.TRAINER is the small app that lets a user draw prototypes for a shape.
import { VS, V, idiv } from '../graphics/G.js';
import { Color } from '../graphics/Color.js';
import { G } from '../graphics/G.js';
import { UC } from '../graphics/UC.js';
import { Ink, Norm } from './Ink.js';

//------------------Prototype-----------------
export class Prototype extends Norm {
  constructor(fromBuffer = true) { super(fromBuffer); this.nBlend = 1; }
  blend(norm) { super.blend(norm, this.nBlend); this.nBlend++; }
  toJSON() { return { nBlend: this.nBlend, points: super.toJSON() }; }
  // a new prototype that is a copy of norm (rather than re-reading Ink.BUFFER)
  static fromNorm(norm) { const p = new Prototype(false); for (let i = 0; i < Norm.N; i++) { p.points[i].set(norm.points[i]); } return p; }
  static fromJSON(o) { const p = Norm.fromJSON(o.points, new Prototype(false)); p.nBlend = o.nBlend | 0 || 1; return p; }
}

//-------------------Prototype.List-----------
class PrototypeList extends Array {
  static get [Symbol.species]() { return Array; }
  static m = 10; static w = 60;
  static showboxHeight = PrototypeList.m + PrototypeList.w;
  static showbox = new VS(10, 10, 60, 60);
  static bestMatch = null; // set as a side effect of bestDist()

  show(g) { // draw a list of boxes across the top of the screen
    const { m, w, showbox } = Prototype.List;
    for (let i = 0; i < this.length; i++) {
      const p = this[i], x = m + i * (m + w);
      showbox.loc.set(x, m); // march the showbox across the top of the screen
      g.setColor(Color.ORANGE);
      p.drawAt(g, showbox);
      const p0 = p.points[0], x0 = p0.tx(), y0 = p0.ty();
      g.setColor(Color.RED); g.fillOval(x0 - 2, y0 - 2, 5, 5); // mark the start of the stroke
      g.setColor(Color.ORANGE);
      g.drawString('' + p.nBlend, x, 20);
    }
  }

  bestDist(norm) {
    Prototype.List.bestMatch = null;
    let bestSoFar = UC.noMatchDist; // assume no match
    for (const p of this) {
      const d = p.dist(norm);
      if (d < bestSoFar) { Prototype.List.bestMatch = p; bestSoFar = d; }
    }
    return bestSoFar;
  }

  train(norm) {
    if (this.bestDist(norm) < UC.noMatchDist) { // we found a match so blend
      Prototype.List.bestMatch.blend(norm);
    } else {
      this.push(Prototype.fromNorm(norm)); // didn't match so add a new one
    }
  }
  toJSON() { return Array.from(this, (p) => p.toJSON()); }
}
Prototype.List = PrototypeList;

export class Shape {
  constructor(name) { this.name = name; this.prototypes = new Prototype.List(); }

  static recognize(ink) { // note: can return null
    if (ink.vs.size.x < UC.dotThreshold && ink.vs.size.y < UC.dotThreshold) { return Shape.DOT; }
    let bestMatch = null, bestSoFar = UC.noMatchDist; // assume no match
    for (const s of Shape.DB.values()) {
      const d = s.prototypes.bestDist(ink.norm);
      if (d < bestSoFar) { bestMatch = s; bestSoFar = d; }
    }
    return bestMatch;
  }
}
Shape.Prototype = Prototype;

//--------------Shape.Database-----------------
// A Map<name, Shape>. Loads from and saves to localStorage; merges a JSON baseline.
export class Database extends Map {
  constructor() { super(); this.set('DOT', new Shape('DOT')); } // make sure DOT exists
  forceGet(name) { // always returns a Shape, adding a new one if necessary
    if (!this.has(name)) { this.set(name, new Shape(name)); }
    return this.get(name);
  }
  train(name, norm) { if (Database.isLegal(name)) { this.forceGet(name).prototypes.train(norm); } }
  isKnown(name) { return this.has(name); }
  isUnknown(name) { return !this.has(name); }
  isLegal(name) { return Database.isLegal(name); }
  static isLegal(name) { return name !== '' && name !== 'DOT' && !/\s/.test(name); }

  toJSON() {
    const shapes = {};
    for (const [name, s] of this) { if (name !== 'DOT') { shapes[name] = s.prototypes.toJSON(); } }
    return { version: 1, shapes };
  }
  // Merge shapes from a JSON object. Existing Shape objects keep their identity
  // (Reactions hold references to them); their prototype lists are replaced.
  mergeJSON(obj) {
    const shapes = (obj && obj.shapes) || {};
    for (const name of Object.keys(shapes)) {
      if (!Database.isLegal(name)) { continue; }
      const s = this.forceGet(name);
      s.prototypes = new Prototype.List();
      for (const p of shapes[name]) { s.prototypes.push(Prototype.fromJSON(p)); }
    }
    return this;
  }
  static storage() { try { return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null; } catch (e) { return null; } }
  static load() {
    const res = new Database();
    const store = Database.storage();
    if (store) {
      try {
        const txt = store.getItem(UC.shapeDatabaseFileName);
        if (txt) { res.mergeJSON(JSON.parse(txt)); console.log('ShapeDB loaded from localStorage:', [...res.keys()].join(' ')); }
      } catch (e) { console.log('ShapeDB load failed', e); }
    }
    return res;
  }
  save() {
    const store = Database.storage();
    if (!store) { return false; }
    try { store.setItem(UC.shapeDatabaseFileName, JSON.stringify(this.toJSON())); return true; }
    catch (e) { console.log('ShapeDB save failed', e); return false; }
  }
  clearSaved() { const store = Database.storage(); if (store) { store.removeItem(UC.shapeDatabaseFileName); } }
}
Shape.Database = Database;
Shape.DB = Database.load();
Shape.DOT = Shape.DB.get('DOT');
Object.defineProperty(Shape, 'LIST', { get: () => Shape.DB.values() });

// Fetch the shipped baseline shapes, then let anything the user trained (in
// localStorage) override it. Apps should await this before creating Reactions.
Shape.loadDefaults = async function (url = UC.shapeDatabaseUrl) {
  if (typeof fetch !== 'function') { return Shape.DB; }
  try {
    const res = await fetch(url);
    if (res.ok) {
      const base = new Database().mergeJSON(await res.json());
      for (const [name, s] of base) { if (!Shape.DB.has(name) || Shape.DB.get(name).prototypes.length === 0) { Shape.DB.forceGet(name).prototypes = s.prototypes; } }
    }
  } catch (e) { console.log('default shapes not loaded', e); }
  Shape.ready = true;
  return Shape.DB;
};
Shape.ready = false;

//----------------------Trainer---the training App -----------------------
// An I.Show + I.Area that trains prototypes for whatever name the user has typed.
export class Trainer {
  static UNKNOWN = ' <- this name is currently Unknown.';
  static ILLEGAL = ' <- this name is NOT a legal Shape name.';
  static KNOWN = ' <- this is a known shape.';

  constructor() { this.curName = ''; this.curState = Trainer.ILLEGAL; this.pList = null; this.savedMsg = ''; }

  setState() {
    this.curState = !Shape.DB.isLegal(this.curName) ? Trainer.ILLEGAL : Trainer.UNKNOWN;
    if (this.curState === Trainer.UNKNOWN) {
      if (Shape.DB.isKnown(this.curName)) {
        this.curState = Trainer.KNOWN;
        this.pList = Shape.DB.get(this.curName).prototypes;
      } else { // it really is UNKNOWN
        this.pList = null;
      }
    }
  }

  // I.Show
  show(g) {
    G.fillBack(g);
    g.setColor(Color.BLACK);
    g.drawString('Shape: ' + this.curName, 500, 30);
    g.drawString(this.curState, 620, 30);
    g.drawString('type a name, draw examples, ENTER saves, SPACE clears, click a box above to delete it' + this.savedMsg, 300, 60);
    g.setColor(Color.RED);
    Ink.BUFFER.show(g);
    if (this.pList != null) { this.pList.show(g); }
  }

  // I.Area
  hit(x, y) { return true; }
  dn(x, y) { Ink.BUFFER.dn(x, y); }
  drag(x, y) { Ink.BUFFER.drag(x, y); }
  up(x, y) {
    if (this.removePrototype(x, y)) { return; } // don't train if a proto was removed
    Ink.BUFFER.up(x, y);
    const ink = new Ink();
    Shape.DB.train(this.curName, ink.norm); // safe: legal name testing is done in Database
    this.setState(); // possibly convert previously UNKNOWN to KNOWN
    this.savedMsg = ' (unsaved changes)';
  }

  // a stroke that ends up in the showbox area deletes the prototype it landed on
  removePrototype(x, y) {
    const H = Prototype.List.showboxHeight;
    if (y < H) {
      const ndx = idiv(x, H); // compute a box number
      const plist = this.pList;
      if (plist != null && ndx < plist.length) { plist.splice(ndx, 1); this.savedMsg = ' (unsaved changes)'; }
      Ink.BUFFER.clear();
      return true;
    }
    return false;
  }

  keyTyped(e) {
    const c = e.getKeyChar();
    if (c === '\r' || c === '\n') { this.savedMsg = Shape.DB.save() ? ' (saved)' : ' (save failed)'; }
    if (c === '\b') { this.curName = this.curName.slice(0, -1); }
    else { this.curName = (c === ' ' || c === '\r' || c === '\n') ? '' : this.curName + c; }
    this.setState();
  }
}
Shape.Trainer = Trainer;
Shape.TRAINER = new Trainer();
