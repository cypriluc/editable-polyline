// global constants
const SVG_WIDTH = 700;
const SVG_HEIGHT = 450;
const POINT_RADIUS = 4;
const POINT_RADIUS_HOVER = 8;
const LINE_GENERATOR = d3.line();
const SVG = d3.select("svg");
const DRAG_HANDLER = d3.drag();

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

// global variables
let points;
let drawingStatus;
let polylineType;

let pathData;
let cursorPosition;

// set svg size
SVG.attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT);

setInitialVariables();
registerAddPtEvent();
registerDragEvent();

function setInitialVariables() {
  points = [];
  drawingStatus = STATES.drawingStatus.drawing;
  polylineType = STATES.polylineType.opened;
  cursorPosition = STATES.cursorPosition.noPoint;
}

// register event - add new point on click in svg
function registerAddPtEvent() {
  SVG.on("click", function (d) {
    if (drawingStatus) {
      if (cursorPosition === 0) {
        let newPoint = [d.layerX, d.layerY];
        points.push(newPoint);
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
}

// register event - drag existing point
function registerDragEvent() {
  DRAG_HANDLER.on("drag", function (d) {
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

    points[ptIndex] = [newX, newY];
    circle.attr("cx", newX).attr("cy", newY);
    updatePolyline();
  });
}

function registerPointEvents() {
  let circles = d3.select(".points").selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      let circle = d3.select(this);
      let ptIndex = getPtId(this);
      if (drawingStatus) {
        if (ptIndex === 0) {
          cursorPosition = STATES.cursorPosition.firstPoint;
          ptHoverOn(circle);
        } else if (ptIndex === points.length - 1) {
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
  let circles = d3.select(".points").selectAll("circle").data(points);
  circles.exit().remove();
  circles
    .enter()
    .append("circle")
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
  if (drawingStatus) {
    let temporaryPoints = [];
    SVG.on("mousemove", function (d) {
      temporaryPoints = Array.from(points);
      let placingPoint = [d.layerX, d.layerY];
      temporaryPoints.push(placingPoint);
      pathData = LINE_GENERATOR(temporaryPoints);
      setPath();
    });
  } else {
    updatePath();
  }
}

function updatePath() {
  pathData = LINE_GENERATOR(points);
  if (polylineType) {
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
  polylineType = STATES.polylineType.closed;
  removePtEvents();
  updatePath();
}

function finishOpenedPolyline() {
  polylineType = STATES.polylineType.opened;
  removePtEvents();
  updatePath();
}

function getPtId(target) {
  return parseInt(target.id.split("point")[1]);
}

function removePtEvents() {
  SVG.on("mousemove", null);
  SVG.on("click", null);
  drawingStatus = STATES.drawingStatus.notDrawing;
}

function clearSvg() {
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
  setInitialVariables();
  registerAddPtEvent();
  registerDragEvent();
}
