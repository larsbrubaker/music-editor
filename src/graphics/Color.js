// Color constants that mirror the java.awt.Color statics used throughout the course.
// A color is just a CSS color string, which is what the canvas API wants.
export const Color = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  RED: '#ff0000',
  GREEN: '#00ff00',
  BLUE: '#0000ff',
  ORANGE: '#ffc800',
  CYAN: '#00ffff',
  GRAY: '#808080',
  LIGHT_GRAY: '#c0c0c0',
  // new Color(r,g,b) in Java -> Color.rgb(r,g,b) here
  rgb(r, g, b) { return `rgb(${r},${g},${b})`; },
};
