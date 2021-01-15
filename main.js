import { STATES } from "./modules/states.mjs";
import * as track from "./modules/undo-redo.mjs";

// global constants
const SVG_WIDTH = 700;
const SVG_HEIGHT = 450;
const POINT_RADIUS = 4;
const POINT_RADIUS_HOVER = 8;
// d3 objects / methods
const lineGenerator = d3.line();
const svgDOM = d3.select("svg");
const dragHandler = d3.drag();
// buttons in DOM
const clearBtn = document.getElementById("clear-svg");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
// undo-redo module most used
const command = track.trackManager.doCommand;
const addPt = track.ADD;
const movePt = track.MOVE;
const updateStatus = track.STATUS;
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
let temporaryPoint;
let ptIndex;
let temporaryPoints = [];

// set svg size
svgDOM.attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT);

// register event - add new point on click in svg
svgDOM.on("click", function (d) {
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
dragHandler.on("drag", function (d) {
  if (!drawingStatus()) {
    let circle = d3.select(this);
    ptIndex = getPtId(this);
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
    temporaryPoints = Array.from(points());
    temporaryPoint = [newX, newY];
    temporaryPoints[ptIndex] = temporaryPoint;
    generatePathData(temporaryPoints);
    temporaryPoints = [];
  }
});

dragHandler.on("end", function (d) {
  if (!drawingStatus()) {
    command(movePt, { index: ptIndex, point: temporaryPoint });
    temporaryPoint = [];
    ptIndex = null;
  }
});

// register clear Canvas button function
clearBtn.onclick = function () {
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
  setInitialVariables();
};
// register undo button function
undoBtn.onclick = function () {
  track.trackManager.undo();
  updateGeometry();
};
// register redo button function
redoBtn.onclick = function () {
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
  command(updateStatus, {
    drawStatus: STATES.drawingStatus.drawing,
    plineType: STATES.polylineType.opened,
  });
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
  dragHandler(circles);
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
  checkButtons();
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
    svgDOM.on("mousemove", function (d) {
      temporaryPoints = Array.from(points());
      temporaryPoint = [d.layerX, d.layerY];
      temporaryPoints.push(temporaryPoint);
      generatePathData(temporaryPoints);
      temporaryPoints = [];
      temporaryPoint = null;
    });
  } else {
    generatePathData(points());
  }
}

function generatePathData(points) {
  pathData = lineGenerator(points);
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
  command(updateStatus, {
    drawStatus: STATES.drawingStatus.notDrawing,
    plineType: STATES.polylineType.closed,
  });
  drawingFinished();
}

function finishOpenedPolyline() {
  command(updateStatus, {
    drawStatus: STATES.drawingStatus.notDrawing,
    plineType: STATES.polylineType.opened,
  });
  drawingFinished();
}

function getPtId(target) {
  return parseInt(target.id.split("point")[1]);
}

function drawingFinished() {
  svgDOM.on("mousemove", null);
  generatePathData(points());
}

function checkButtons() {
  if (track.trackManager.getCurrentState().position === 0) {
    undoBtn.disabled = true;
  } else {
    undoBtn.disabled = false;
  }
  // disable redo button when not possible to redo
  if (
    track.trackManager.getCurrentState().position >=
    track.trackManager.getCurrentState().historyLength - 1
  ) {
    redoBtn.disabled = true;
  } else {
    redoBtn.disabled = false;
  }
}
