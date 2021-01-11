// global constants
const svgWidth = 700;
const svgHeight = 450;
const pointRadius = 4;
const pointRadiusHover = 8;
const lineGenerator = d3.line();
const svg = d3.select("svg");
const dragHandler = d3.drag();
// cursor positions
const noPoint = 0;
const firstPoint = 1;
const middlePoint = 2;
const lastPoint = 3;
// drawing status
const notDrawing = 0;
const drawing = 1;
// polyline types
const opened = 0;
const closed = 1;

// global variables
let points;
let newPoint;
let placingPoint;
let cursorOnPt;
let drawingStatus;
let polylineType;
let pathData;

// set svg size
svg.attr("width", svgWidth).attr("height", svgHeight);

setInitialVariables();
registerAddPtEvent();
registerDragEvent();

function setInitialVariables() {
  points = [];
  newPoint = [];
  placingPoint = [];
  cursorOnPt = noPoint;
  drawingStatus = drawing;
  polylineType = opened;
}

// register event - add new point on click in svg
function registerAddPtEvent() {
  svg.on("click", function (d) {
    if (drawingStatus) {
      if (cursorOnPt === 0) {
        newPoint = [d.layerX, d.layerY];
        points.push(newPoint);
        updateGeometry();
      }
      if (cursorOnPt === 1) {
        finishClosedPolyline();
      }
      if (cursorOnPt === 3) {
        finishOpenedPolyline();
      }
    }
  });
}

// register event - drag existing point
function registerDragEvent() {
  dragHandler.on("drag", function (d) {
    let circle = d3.select(this);
    let ptIndex = getPtId(this);
    let newX;
    let newY;

    if (d.x < svgWidth - pointRadius && d.x > pointRadius) {
      newX = d.x;
    } else if (d.x >= svgWidth - pointRadius) {
      newX = svgWidth - pointRadius;
    } else {
      newX = pointRadius;
    }

    if (d.y < svgHeight - pointRadius && d.y > pointRadius) {
      newY = d.y;
    } else if (d.y >= svgHeight - pointRadius) {
      newY = svgHeight - pointRadius;
    } else {
      newY = pointRadius;
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
          cursorOnPt = firstPoint;
          ptHoverOn(circle);
        } else if (ptIndex === points.length - 1) {
          cursorOnPt = lastPoint;
          ptHoverOn(circle);
        } else {
          cursorOnPt = middlePoint;
        }
      } else {
        ptHoverOn(circle);
      }
    })
    .on("mouseout", function () {
      let circle = d3.select(this);
      ptHoverOff(circle);
      cursorOnPt = noPoint;
    });
  //call drag handler
  dragHandler(circles);
}

function ptHoverOn(circle) {
  circle
    .transition()
    .duration(100)
    .attr("r", pointRadiusHover)
    .attr("fill", "purple");
}

function ptHoverOff(circle) {
  circle
    .transition()
    .duration(100)
    .attr("r", pointRadius)
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
    .attr("r", pointRadius)
    .attr("fill", "white");
  registerPointEvents();
}

function updatePolyline() {
  if (drawingStatus) {
    let temporaryPoints = [];
    svg.on("mousemove", function (d) {
      temporaryPoints = Array.from(points);
      placingPoint = [d.layerX, d.layerY];
      temporaryPoints.push(placingPoint);
      pathData = lineGenerator(temporaryPoints);
      setPath();
    });
  } else {
    updatePath();
  }
}

function updatePath() {
  pathData = lineGenerator(points);
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
  polylineType = closed;
  removePtEvents();
  updatePath();
}

function finishOpenedPolyline() {
  polylineType = opened;
  removePtEvents();
  updatePath();
}

function getPtId(target) {
  return parseInt(target.id.split("point")[1]);
}

function removePtEvents() {
  svg.on("mousemove", null);
  svg.on("click", null);
  drawingStatus = notDrawing;
}

function clearSvg() {
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
  setInitialVariables();
  registerAddPtEvent();
  registerDragEvent();
}
