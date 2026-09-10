// Mass - anything visible on the screen that can hold reactions. A Mass lives in a
// Layer (so it gets shown) and IS a Reaction.List (so its reactions can be cleaned
// up when it is deleted).
//
// The Java version had to override equals()/hashCode() so ArrayList.remove would
// use referential equality. JavaScript arrays already compare by reference, so no
// such fix is needed here.
import { ReactionList } from './Reaction.js';
import { Layer } from './Layer.js';

export class Mass extends ReactionList {
  constructor(layerName) {
    super();
    this.layer = Layer.byName.get(layerName);
    if (this.layer != null) { this.layer.push(this); } else { console.log('BAD LAYER NAME-' + layerName); }
  }
  deleteMass() {
    this.clearAll(); // clears all reactions from this list AND from the byShape Map
    if (this.layer) { this.layer.removeItem(this); } // remove self from the layers
  }
  show(g) {} // usually overridden; a Mass CAN have reactions and show nothing
}
