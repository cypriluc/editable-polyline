export const SVG_SIZE = {
  width: 1000,
  height: 520,
};

export const GRID_RESOLUTION = (function () {
  let resolution = 10;
  return {
    set(n) {
      resolution = n;
    },
    value() {
      return resolution;
    },
  };
})();

export const MODES = {
  draw: 0,
  edit: 1,
  move: 2,
};

export const CURRENT_MODE = (function () {
  let mode = MODES.draw;
  return {
    set(m) {
      mode = m;
    },
    get() {
      return mode;
    },
  };
})();

export const CIRCLE_RADIUS = {
  basic: 5,
  hover: 10,
};

export const PATH_STATES = {
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
