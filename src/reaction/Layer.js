// Layer - z-ordering. A Layer is a list of showable things; Layer.ALL is the layer
// of all the other layers, in the order they were created (background first).
//
// Note the static initialization order: byName MUST be created before ALL, because
// the Layer constructor writes into byName. (The course text got that backwards
// the first time and hit a null pointer during class initialization.)
export class Layer extends Array {
  static get [Symbol.species]() { return Array; } // map/filter must not construct Layers
  static byName = new Map();
  static ALL = new Layer('ALL');

  constructor(name) {
    super();
    this.name = name;
    if (name !== 'ALL' && Layer.ALL) { Layer.ALL.push(this); }
    Layer.byName.set(name, this);
  }
  show(g) { for (const item of this) { item.show(g); } }
  removeItem(item) { const i = this.indexOf(item); if (i >= 0) { this.splice(i, 1); } }

  // get-or-create, so that several apps on one page can each "create" the same layers
  static ensure(name) { return Layer.byName.get(name) || new Layer(name); }
  static nuke() { // NUKE all layers in preparation for undo. ALL remains intact.
    for (const lay of Layer.ALL) { lay.length = 0; }
  }
  static resetAll() { Layer.byName.clear(); Layer.ALL = new Layer('ALL'); }
  toString() { return 'Layer(' + this.name + ')[' + this.map((x) => String(x)).join(',') + ']'; }
}
