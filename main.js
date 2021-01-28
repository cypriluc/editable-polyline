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
  deletePath = command.DELETE;
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
  commandData = () => {
    return command.stateObject.data;
  },
  points = (id) => {
    if (typeof commandData()[id] != "undefined") {
      return commandData()[id].points;
    } else {
      return [];
    }
  },
  drawingStatus = (id) => {
    if (typeof commandData()[id] != "undefined") {
      return commandData()[id].drawingStatus;
    } else {
      return STATES.drawingStatus.notDrawing;
    }
  },
  polylineType = (id) => {
    if (typeof commandData()[id] != "undefined") {
      return commandData()[id].polylineType;
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
  doCommand(clearPoints);
};
// register undo button function
undoBtn.onclick = function () {
  command.commandManager.undo();
};
// register redo button function
redoBtn.onclick = function () {
  command.commandManager.redo();
};
// register undo / redo on keypress
document.onkeydown = function (e) {
  if (e.ctrlKey && e.code === "KeyY") {
    command.commandManager.undo();
  }
  if (e.ctrlKey && e.code === "KeyZ") {
    command.commandManager.redo();
  }
  if (
    drawingStatus(activeId()) &&
    points(activeId()).length > 2 &&
    e.key === "Enter"
  ) {
    finishClosedPolyline();
  }
  if (
    drawingStatus(activeId()) &&
    points(activeId()).length > 1 &&
    e.key === "Escape"
  ) {
    finishOpenedPolyline();
  }
  if (activeId() && e.key === "Delete") {
    doCommand(deletePath, activeId());
  }
};

function svgClicked(d) {
  if (drawingStatus(activeId())) {
    if (cursorPosition === 0) {
      addNewPoint(d);
    }
    if (cursorPosition === 1 && points(activeId()).length > 2) {
      finishClosedPolyline();
    }
    if (cursorPosition === 3 && points(activeId()).length > 1) {
      finishOpenedPolyline();
    }
  } else {
    createNewGroup();
    addNewPoint(d);
  }
}

function started() {
  if (!drawingStatus(activeId())) {
    let newActiveId = this.parentNode.parentNode.getAttribute("id");
    if (activeId() != newActiveId) {
      doCommand(setActive, newActiveId);
    }
  }
}

function dragged(d) {
  if (!drawingStatus(activeId())) {
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
    temporaryPoints = Array.from(points(activeId()));
    temporaryPoint = [newX, newY];
    temporaryPoints[activePtIndex] = temporaryPoint;
    generatePathData(temporaryPoints, activeId());
    temporaryPoints = [];
  }
}

function dragend() {
  if (!drawingStatus(activeId())) {
    doCommand(movePt, { index: activePtIndex, point: temporaryPoint });
    temporaryPoint = [];
    activePtIndex = null;
    ptHoverOff(d3.select(this));
  }
}

function createNewGroup() {
  let newId = generateId();
  doCommand(setActive, newId);
  doCommand(createGroup);
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
    newPoint = [mouseX, mouseY];
  if (snap) {
    newPoint = [
      roundToSnap(mouseX, GRID_RESOLUTION),
      roundToSnap(mouseY, GRID_RESOLUTION),
    ];
  }
  doCommand(addPt, newPoint);
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

function updateCircles(id) {
  let circles = d3
    .select("#" + id)
    .select(".points")
    .selectAll("circle")
    .data(points(id));
  circles.exit().remove();
  circles
    .enter()
    .append("circle")
    .merge(circles)
    .attr("id", function (d, i) {
      return id + "_" + i;
    })
    .attr("cx", function (d) {
      return d[0];
    })
    .attr("cy", function (d) {
      return d[1];
    })
    .attr("r", pointRadius)
    .attr("fill", "rgba(255,255,255,0.5)");
  registerPointEvents(id);
}

function registerPointEvents(id) {
  let circles = d3.select("#" + id).selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      let circle = d3.select(this);
      let circleIndex = getPtId(this);
      if (drawingStatus(id)) {
        if (circleIndex === 0) {
          cursorPosition = STATES.cursorPosition.firstPoint;
          if (points(activeId()).length > 2) {
            ptHoverOn(circle);
          }
        } else if (circleIndex === points(id).length - 1) {
          cursorPosition = STATES.cursorPosition.lastPoint;
          if (points(activeId()).length > 1) {
            ptHoverOn(circle);
          }
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

function updatePolyline(id) {
  generatePathData(points(id), id);
  svg.on("mousemove", function (d) {
    if (drawingStatus(id)) {
      temporaryPoints = Array.from(points(id));
      temporaryPoint = [d.layerX, d.layerY];
      temporaryPoints.push(temporaryPoint);
      generatePathData(temporaryPoints, id);
      temporaryPoints = [];
      temporaryPoint = null;
    }
  });
}

function generatePathData(points, id) {
  let pathData = lineGenerator(points);
  if (polylineType(id)) {
    let closeString = ",Z";
    pathData = pathData.concat(closeString);
  }
  setPath(pathData, id);
}

function setPath(data, id) {
  d3.select("#" + id)
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
  generatePathData(points(activeId()), activeId());
}

function roundToSnap(position, resolution) {
  return position % resolution < resolution / 2
    ? position - (position % resolution)
    : position + resolution - (position % resolution);
}

export { undoBtn, redoBtn, updateCircles, updatePolyline };
