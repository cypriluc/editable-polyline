const STATES = {
  cursorPosition: {
    noPoint: 0,
    firstPoint: 1,
    middlePoint: 2,
    lastPoint: 3,
  },

  drawingStatus: {
    notDrawing: 0,
    drawing: 1,
  },

  polylineType: {
    opened: 0,
    closed: 1,
  },
};

export { STATES };
