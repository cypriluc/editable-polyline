import {
  SVG_SIZE,
  CIRCLE_RADIUS,
  STATES,
  GRID_RESOLUTION,
} from "./modules/constants.mjs";
import * as command from "./modules/commands.mjs";
import * as grid from "./modules/grid.mjs";

// global constants
const svgWidth = SVG_SIZE.width,
  svgHeight = SVG_SIZE.height,
  pointRadius = CIRCLE_RADIUS.basic,
  pointRadiusHover = CIRCLE_RADIUS.hover;
// d3 objects / methods
const lineGenerator = d3.line(),
  svg = d3.select("svg"),
  svgGeometry = d3.select("#geometry"),
  dragHandler = d3.drag();
// buttons in DOM
const clearBtn = document.getElementById("clear-svg"),
  undoBtn = document.getElementById("undo"),
  redoBtn = document.getElementById("redo"),
  snapBtn = document.getElementById("snap-btn");
// undo-redo module most used
const doCommand = command.commandManager.doCommand,
  addPt = command.ADD,
  movePt = command.MOVE,
  updateStatus = command.STATUS,
  clearPoints = command.CLEAR,
  createGroup = command.GROUP,
  setActive = command.ACTIVE,
  commandData = command.stateObject.data;
// variables used in more functions
let cursorPosition = STATES.cursorPosition.noPoint,
  temporaryPoint,
  activePtIndex,
  temporaryPoints = [],
  snap = true;
// return values from undo-redo.mjs
const activeId = () => {
    return command.stateObject.activeId;
  },
  points = () => {
    if (typeof commandData[activeId()] != "undefined") {
      return commandData[activeId()].points;
    } else {
      return [];
    }
  },
  drawingStatus = () => {
    if (typeof commandData[activeId()] != "undefined") {
      return commandData[activeId()].drawingStatus;
    } else {
      return STATES.drawingStatus.notDrawing;
    }
  },
  polylineType = () => {
    if (typeof commandData[activeId()] != "undefined") {
      return commandData[activeId()].polylineType;
    } else {
      return STATES.polylineType.opened;
    }
  };

// set svg size
svg.attr("width", svgWidth).attr("height", svgHeight);

// register events
svg.on("click", svgClicked);
dragHandler.on("start", started);
dragHandler.on("drag", dragged);
dragHandler.on("end", dragend);

// register snap toggle button function
snapBtn.onclick = function () {
  snap = !snap;
};

// register clear Canvas button function
clearBtn.onclick = function () {
  svgGeometry.selectAll("g").remove();
  doCommand(clearPoints);
};
// register undo button function
undoBtn.onclick = function () {
  command.commandManager.undo();
  updateGeometry();
  colorActive();
};
// register redo button function
redoBtn.onclick = function () {
  command.commandManager.redo();
  updateGeometry();
  colorActive();
};
// register undo / redo on keypress
document.onkeypress = function (e) {
  if (e.ctrlKey && e.code === "KeyY") {
    command.commandManager.undo();
    updateGeometry();
    colorActive();
  }
  if (e.ctrlKey && e.code === "KeyZ") {
    command.commandManager.redo();
    updateGeometry();
    colorActive();
  }
};

function svgClicked(d) {
  if (drawingStatus()) {
    if (cursorPosition === 0) {
      addNewPoint(d);
    }
    if (cursorPosition === 1) {
      finishClosedPolyline();
    }
    if (cursorPosition === 3) {
      finishOpenedPolyline();
    }
  } else {
    createSvgGroup();
    addNewPoint(d);
  }
}

function started() {
  if (!drawingStatus()) {
    let newActiveId = this.parentNode.parentNode.getAttribute("id");
    if (activeId() != newActiveId) {
      doCommand(setActive, newActiveId);
      colorActive();
    }
  }
}

function dragged(d) {
  if (!drawingStatus()) {
    let circle = d3.select(this);
    ptHoverOn(circle);
    activePtIndex = getPtId(this);
    let newX = Math.max(pointRadius, Math.min(svgWidth - pointRadius, d.x));
    let newY = Math.max(pointRadius, Math.min(svgHeight - pointRadius, d.y));
    if (snap) {
      newX = roundToSnap(newX, GRID_RESOLUTION);
      newY = roundToSnap(newY, GRID_RESOLUTION);
    }
    circle.attr("cx", newX).attr("cy", newY);
    temporaryPoints = Array.from(points());
    temporaryPoint = [newX, newY];
    temporaryPoints[activePtIndex] = temporaryPoint;
    generatePathData(temporaryPoints);
    temporaryPoints = [];
  }
}

function dragend() {
  if (!drawingStatus()) {
    doCommand(movePt, { index: activePtIndex, point: temporaryPoint });
    temporaryPoint = [];
    activePtIndex = null;
    ptHoverOff(d3.select(this));
  }
}

function createSvgGroup() {
  let newId = generateId();
  doCommand(setActive, newId);
  doCommand(createGroup);
  let newGroup = svgGeometry.append("g").attr("id", activeId());
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

function addNewPoint(d) {
  let mouseX = d.layerX,
    mouseY = d.layerY,
    newPoint;
  if (snap) {
    newPoint = [
      roundToSnap(mouseX, GRID_RESOLUTION),
      roundToSnap(mouseY, GRID_RESOLUTION),
    ];
  } else {
    newPoint = [mouseX, mouseY];
  }
  doCommand(addPt, newPoint);
  updateGeometry();
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
    .attr("r", pointRadiusHover)
    .attr("fill", "rgba(218, 112, 214, 0.5)");
}

function ptHoverOff(circle) {
  circle
    .transition()
    .duration(100)
    .attr("r", pointRadius)
    .attr("fill", "rgba(255, 255, 255, 0.5)");
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
    .attr("r", pointRadius)
    .attr("fill", "rgba(255,255,255,0.5)");
  registerPointEvents();
}

function updatePolyline() {
  generatePathData(points());
  svg.on("mousemove", function (d) {
    if (drawingStatus()) {
      temporaryPoints = Array.from(points());
      temporaryPoint = [d.layerX, d.layerY];
      temporaryPoints.push(temporaryPoint);
      generatePathData(temporaryPoints);
      temporaryPoints = [];
      temporaryPoint = null;
    }
  });
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
  doCommand(updateStatus, {
    drawStatus: STATES.drawingStatus.notDrawing,
    plineType: STATES.polylineType.closed,
  });
  drawingFinished();
}

function finishOpenedPolyline() {
  doCommand(updateStatus, {
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
  if (command.commandManager.getCurrentState().position === 0) {
    undoBtn.disabled = true;
  } else {
    undoBtn.disabled = false;
  }
  // disable redo button when not possible to redo
  if (
    command.commandManager.getCurrentState().position >=
    command.commandManager.getCurrentState().historyLength - 1
  ) {
    redoBtn.disabled = true;
  } else {
    redoBtn.disabled = false;
  }
}

function colorActive() {
  let activeG = svgGeometry.select("#" + activeId());
  svgGeometry.selectAll("g").classed("active", false);
  activeG.classed("active", true);
}

function roundToSnap(position, resolution) {
  return position % resolution < resolution / 2
    ? position - (position % resolution)
    : position + resolution - (position % resolution);
}
