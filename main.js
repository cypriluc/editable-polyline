import { STATES } from "./modules/states.mjs";
import * as track from "./modules/undo-redo.mjs";

// global constants
const SVG_WIDTH = 700;
const SVG_HEIGHT = 450;
const POINT_RADIUS = 4;
const POINT_RADIUS_HOVER = 8;
// d3 objects / methods
const LINE_GENERATOR = d3.line();
const SVG = d3.select("svg");
const DRAG_HANDLER = d3.drag();
// buttons in DOM
const CLEAR_BTN = document.getElementById("clear-svg");
const UNDO_BTN = document.getElementById("undo");
const REDO_BTN = document.getElementById("redo");
// undo-redo module most used
const command = track.trackManager.doCommand;
const addPt = track.ADD;
const movePt = track.MOVE;
const setDrawingStatus = track.DRAWING;
const setPolylineType = track.POLYLINE_TYPE;
const clearPoints = track.CLEAR;

// return values from undo-redo.mjs
const points = () => {
  return track.trackStateObject.points;
};
const drawingStatus = () => {
  return track.trackStateObject.drawingStatus;
};
const polylineType = () => {
  return track.trackStateObject.polylineType;
};

let pathData;
let cursorPosition = STATES.cursorPosition.noPoint;

// set svg size
SVG.attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT);

// register event - add new point on click in svg
SVG.on("click", function (d) {
  if (drawingStatus()) {
    if (cursorPosition === 0) {
      let newPoint = [d.layerX, d.layerY];
      command(addPt, newPoint);
      updateGeometry();
    }
    if (cursorPosition === 1) {
      finishClosedPolyline();
    }
    if (cursorPosition === 3) {
      finishOpenedPolyline();
    }
  }
});

// register event - drag existing point
DRAG_HANDLER.on("drag", function (d) {
  if (!drawingStatus()) {
    let circle = d3.select(this);
    let ptIndex = getPtId(this);
    let newX;
    let newY;

    if (d.x < SVG_WIDTH - POINT_RADIUS && d.x > POINT_RADIUS) {
      newX = d.x;
    } else if (d.x >= SVG_WIDTH - POINT_RADIUS) {
      newX = SVG_WIDTH - POINT_RADIUS;
    } else {
      newX = POINT_RADIUS;
    }

    if (d.y < SVG_HEIGHT - POINT_RADIUS && d.y > POINT_RADIUS) {
      newY = d.y;
    } else if (d.y >= SVG_HEIGHT - POINT_RADIUS) {
      newY = SVG_HEIGHT - POINT_RADIUS;
    } else {
      newY = POINT_RADIUS;
    }

    circle.attr("cx", newX).attr("cy", newY);
    let temporaryPoints = Array.from(points());
    let temporaryPoint = [newX, newY];
    temporaryPoints[ptIndex] = temporaryPoint;
    generatePathData(temporaryPoints);
  }
});

DRAG_HANDLER.on("end", function (d) {
  if (!drawingStatus()) {
    let ptIndex = getPtId(this);
    command(movePt, { index: ptIndex, point: [d.x, d.y] });
  }
});

// register clear Canvas button function
CLEAR_BTN.onclick = function () {
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
  setInitialVariables();
};
// register undo button function
UNDO_BTN.onclick = function () {
  track.trackManager.undo();
  updateGeometry();
};
// register redo button function
REDO_BTN.onclick = function () {
  track.trackManager.redo();
  updateGeometry();
};
// register undo / redo on keypress
document.onkeypress = function (e) {
  if (e.ctrlKey && e.code === "KeyY") {
    track.trackManager.undo();
    updateGeometry();
  }
  if (e.ctrlKey && e.code === "KeyZ") {
    track.trackManager.redo();
    updateGeometry();
  }
};

function setInitialVariables() {
  command(clearPoints);
  command(setDrawingStatus, STATES.drawingStatus.drawing);
  command(setPolylineType, STATES.polylineType.opened);
}

function registerPointEvents() {
  let circles = d3.select(".points").selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      let circle = d3.select(this);
      let ptIndex = getPtId(this);
      if (drawingStatus()) {
        if (ptIndex === 0) {
          cursorPosition = STATES.cursorPosition.firstPoint;
          ptHoverOn(circle);
        } else if (ptIndex === points().length - 1) {
          cursorPosition = STATES.cursorPosition.lastPoint;
          ptHoverOn(circle);
        } else {
          cursorPosition = STATES.cursorPosition.middlePoint;
        }
      } else {
        ptHoverOn(circle);
      }
    })
    .on("mouseout", function () {
      let circle = d3.select(this);
      ptHoverOff(circle);
      cursorPosition = STATES.cursorPosition.noPoint;
    });
  //call drag handler
  DRAG_HANDLER(circles);
}

function ptHoverOn(circle) {
  circle
    .transition()
    .duration(100)
    .attr("r", POINT_RADIUS_HOVER)
    .attr("fill", "purple");
}

function ptHoverOff(circle) {
  circle
    .transition()
    .duration(100)
    .attr("r", POINT_RADIUS)
    .attr("fill", "white");
}

function updateGeometry() {
  updateCircles();
  updatePolyline();
}

function updateCircles() {
  let circles = d3.select(".points").selectAll("circle").data(points());
  circles.exit().remove();
  circles
    .enter()
    .append("circle")
    .merge(circles)
    .attr("id", function (d, i) {
      return "point" + i;
    })
    .attr("cx", function (d) {
      return d[0];
    })
    .attr("cy", function (d) {
      return d[1];
    })
    .attr("r", POINT_RADIUS)
    .attr("fill", "white");
  registerPointEvents();
}

function updatePolyline() {
  if (drawingStatus()) {
    let temporaryPoints = [];
    SVG.on("mousemove", function (d) {
      temporaryPoints = Array.from(points());
      let placingPoint = [d.layerX, d.layerY];
      temporaryPoints.push(placingPoint);
      generatePathData(temporaryPoints);
    });
  } else {
    generatePathData(points());
  }
}

function generatePathData(points) {
  pathData = LINE_GENERATOR(points);
  if (polylineType()) {
    let closeString = ",Z";
    pathData = pathData.concat(closeString);
    setPath();
  } else {
    setPath();
  }
}

function setPath() {
  d3.select(".polyline").attr("d", pathData);
}

function finishClosedPolyline() {
  command(setPolylineType, STATES.polylineType.closed);
  drawingFinished();
  generatePathData(points());
}

function finishOpenedPolyline() {
  command(setPolylineType, STATES.polylineType.opened);
  drawingFinished();
  generatePathData(points());
}

function getPtId(target) {
  return parseInt(target.id.split("point")[1]);
}

function drawingFinished() {
  SVG.on("mousemove", null);
  command(setDrawingStatus, STATES.drawingStatus.notDrawing);
}
