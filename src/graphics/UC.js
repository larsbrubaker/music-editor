// UC - Universal Constants. Every magic number in the project lives here so that
// there is one place to look when a value needs to change. Names are long and
// global here; classes are free to alias them to shorter local names.
export const UC = {
  // -- window --
  mainWindowWidth: 1000,
  mainWindowHeight: 800,
  // -- ink & recognition --
  inkBufferMax: 500,        // max mouse points captured in one stroke
  normSampleSize: 25,       // points kept after sub-sampling a stroke
  normCoordMax: 1000,       // normalized coordinate box is 0..1000
  noMatchDist: 500000,      // squared distance beyond which two norms are not the same shape
  dotThreshold: 5,          // strokes smaller than this (in both x and y) are a DOT
  noBid: 10000,             // a reaction returns this when it does not want a gesture
  shapeDatabaseFileName: 'ShapeDB',   // localStorage key for the trained shapes
  shapeDatabaseUrl: 'assets/shapes.json', // resolved relative to the page that loads it
  inkColor: '#000000',
  // -- music layout --
  minStaffGap: 30,
  minSysGap: 40,
  barToMarginSnap: 20,
  snapTime: 30,
  augDotOffset: 28,
  augDotSpacing: 11,
  initialClefOffset: 30,
  marginKeyOffset: 60,
  barKeyOffset: 10,
  defaultStaffH: 8,
  fontName: 'Sinfonia',
};
