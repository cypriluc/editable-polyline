export const SVG_SIZE = {
  width: 700,
  height: 440,
};

export const GRID_RESOLUTION = (function () {
  let resolution = 20;
  function setResolution(num) {
    resolution = num;
  }
  return {
    set: function (n) {
      setResolution(n);
    },
    value: function () {
      return resolution;
    },
  };
})();

export const CIRCLE_RADIUS = {
  basic: 5,
  hover: 10,
};

export const STATES = {
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
