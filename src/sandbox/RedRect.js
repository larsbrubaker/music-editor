// RedRect - the graphics "Hello World": the smallest possible WinApp.
import { WinApp } from '../graphics/WinApp.js';
import { Color } from '../graphics/Color.js';

export class RedRect extends WinApp {
  constructor() { super('Red Rect', 1000, 700); } // title, width, height

  paintComponent(g) {           // called by the harness whenever the canvas needs painting
    g.setColor(Color.WHITE); g.fillRect(0, 0, 9000, 9000); // clear (Macs do this for you, Windows does not)
    g.setColor(Color.RED);      // use the color red..
    g.fillRect(100, 100, 100, 100); // ..to fill in a rectangle
  }
}
