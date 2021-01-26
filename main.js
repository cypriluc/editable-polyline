import {
  SVG_SIZE,
  CIRCLE_RADIUS,
  STATES,
  GRID_RESOLUTION,
} from "./modules/constants.mjs";
import * as track from "./modules/undo-redo.mjs";
import * as grid from "./modules/grid.mjs";

// global constants
const SVG_WIDTH = SVG_SIZE.width,
  SVG_HEIGHT = SVG_SIZE.height,
  POINT_RADIUS = CIRCLE_RADIUS.basic,
  POINT_RADIUS_HOVER = CIRCLE_RADIUS.hover;
// d3 objects / methods
const lineGenerator = d3.line(),
  svg = d3.select("svg"),
  dragHandler = d3.drag();
// buttons in DOM
const clearBtn = document.getElementById("clear-svg"),
  undoBtn = document.getElementById("undo"),
  redoBtn = document.getElementById("redo");
// undo-redo module most used
const command = track.trackManager.doCommand,
  addPt = track.ADD,
  movePt = track.MOVE,
  updateStatus = track.STATUS,
  clearPoints = track.CLEAR,
  createGroup = track.GROUP,
  setActive = track.ACTIVE,
  trackData = track.trackStateObject.data;
// variables used in more functions
let cursorPosition = STATES.cursorPosition.noPoint,
  temporaryPoint,
  activePtIndex,
  temporaryPoints = [];
// return values from undo-redo.mjs
const activeId = () => {
    return track.trackStateObject.activeId;
  },
  points = () => {
    if (typeof trackData[activeId()] != "undefined") {
      return trackData[activeId()].points;
    } else {
      return [];
    }
  },
  drawingStatus = () => {
    if (typeof trackData[activeId()] != "undefined") {
      return trackData[activeId()].drawingStatus;
    } else {
      return STATES.drawingStatus.notDrawing;
    }
  },
  polylineType = () => {
    if (typeof trackData[activeId()] != "undefined") {
      return trackData[activeId()].polylineType;
    } else {
      return STATES.polylineType.opened;
    }
  };

// set svg size
svg.attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT);

// register event - add new point on click in svg
svg.on("click", function (d) {
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
  } else {
    createSvgGroup();
    let newPoint = [d.layerX, d.layerY];
    command(addPt, newPoint);
    updateGeometry();
  }
});

// register event - drag existing point
dragHandler.on("start", function (d) {
  if (!drawingStatus()) {
    let newActiveId = this.parentNode.parentNode.getAttribute("id");
    if (activeId() != newActiveId) {
      command(setActive, newActiveId);
      colorActive();
    }
  }
});

dragHandler.on("drag", function (d) {
  if (!drawingStatus()) {
    let circle = d3.select(this);
    activePtIndex = getPtId(this);

    let newX = Math.max(POINT_RADIUS, Math.min(SVG_WIDTH - POINT_RADIUS, d.x));
    let newY = Math.max(POINT_RADIUS, Math.min(SVG_HEIGHT - POINT_RADIUS, d.y));

    circle.attr("cx", newX).attr("cy", newY);
    temporaryPoints = Array.from(points());
    temporaryPoint = [newX, newY];
    temporaryPoints[activePtIndex] = temporaryPoint;
    generatePathData(temporaryPoints);
    temporaryPoints = [];
  }
});

dragHandler.on("end", function (d) {
  if (!drawingStatus()) {
    command(movePt, { index: activePtIndex, point: temporaryPoint });
    temporaryPoint = [];
    activePtIndex = null;
  }
});

// register clear Canvas button function
clearBtn.onclick = function () {
  svg.selectAll("g").remove();
  command(clearPoints);
};
// register undo button function
undoBtn.onclick = function () {
  track.trackManager.undo();
  updateGeometry();
  colorActive();
};
// register redo button function
redoBtn.onclick = function () {
  track.trackManager.redo();
  updateGeometry();
  colorActive();
};
// register undo / redo on keypress
document.onkeypress = function (e) {
  if (e.ctrlKey && e.code === "KeyY") {
    track.trackManager.undo();
    updateGeometry();
    colorActive();
  }
  if (e.ctrlKey && e.code === "KeyZ") {
    track.trackManager.redo();
    updateGeometry();
    colorActive();
  }
};

function createSvgGroup() {
  let newId = generateId();
  command(setActive, newId);
  command(createGroup);
  let newGroup = svg.append("g").attr("id", activeId());
  newGroup.append("path").classed("polyline", true);
  newGroup.append("g").classed("points", true);
  colorActive();
}

function generateId() {
  let newId = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < 10; i++) {
    newId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return newId;
}

function registerPointEvents() {
  let circles = d3.select("#" + activeId()).selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      let circle = d3.select(this);
      let circleIndex = getPtId(this);
      if (drawingStatus()) {
        if (circleIndex === 0) {
          cursorPosition = STATES.cursorPosition.firstPoint;
          ptHoverOn(circle);
        } else if (circleIndex === points().length - 1) {
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
    .attr("fill", "orchid");
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
  let circles = d3
    .select("#" + activeId())
    .select(".points")
    .selectAll("circle")
    .data(points());
  circles.exit().remove();
  circles
    .enter()
    .append("circle")
    .merge(circles)
    .attr("id", function (d, i) {
      return activeId() + "_" + i;
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
    svg.on("mousemove", function (d) {
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
  let pathData = lineGenerator(points);
  if (polylineType()) {
    let closeString = ",Z";
    pathData = pathData.concat(closeString);
    setPath(pathData);
  } else {
    setPath(pathData);
  }
}

function setPath(data) {
  d3.select("#" + activeId())
    .select("path")
    .attr("d", data);
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
  return parseInt(target.id.split(activeId() + "_")[1]);
}

function drawingFinished() {
  svg.on("mousemove", null);
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

function colorActive() {
  let activeG = svg.select("#" + activeId());
  svg.selectAll("g").classed("active", false);
  activeG.classed("active", true);
}
