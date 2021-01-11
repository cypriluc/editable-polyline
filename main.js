// global constants
const svgWidth = 700;
const svgHeight = 450;
const pointRadius = 4;
const pointRadiusHover = 6;
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
let plineType;
let pathData;

// set svg size
svg.attr("width", svgWidth).attr("height", svgHeight);

setInitialVariables();
registerAddPtEvent();
registerDragEvent();

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
        closePline();
      }
      if (cursorOnPt === 3) {
        finishPline();
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

// functions
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

function registerPointEvents() {
  let circles = d3.select(".points").selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      let circle = d3.select(this);
      circle
        .transition()
        .duration(100)
        .attr("r", pointRadiusHover)
        .attr("fill", "purple");
      let ptIndex = getPtId(this);
      if (ptIndex === 0) {
        cursorOnPt = firstPoint;
      } else if (ptIndex === points.length - 1) {
        cursorOnPt = lastPoint;
      } else {
        cursorOnPt = middlePoint;
      }
    })
    .on("mouseout", function () {
      let circle = d3.select(this);
      circle
        .transition()
        .duration(100)
        .attr("r", pointRadius)
        .attr("fill", "white");
      cursorOnPt = noPoint;
    });

  //call drag handler
  dragHandler(circles);
}

function updatePolyline() {
  if (drawingStatus) {
    let temporaryPoints = [];
    svg.on("mousemove", function (d) {
      temporaryPoints = Array.from(points);
      placingPoint = [d.layerX, d.layerY];
      temporaryPoints.push(placingPoint);
      pathData = lineGenerator(temporaryPoints);
      d3.select(".polyline").attr("d", pathData);
    });
  } else {
    if (plineType) {
      let closeString = ",Z";
      pathData = lineGenerator(points);
      closedPathData = pathData.concat(closeString);
      d3.select(".polyline").attr("d", closedPathData);
    } else {
      pathData = lineGenerator(points);
      d3.select(".polyline").attr("d", pathData);
    }
  }

  /*   if (Array.isArray(points) && points.length > 1) {
    d3.select(".polyline").attr("d", pathData);
  } else {
    d3.select(".polyline").attr("d", "");
  } */
}

function clearSvg() {
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
  setInitialVariables();
  registerAddPtEvent();
  registerDragEvent();
}

function getPtId(target) {
  return parseInt(target.id.split("point")[1]);
}

function closePline() {
  svg.on("mousemove", null);
  svg.on("click", null);
  drawingStatus = notDrawing;
  plineType = closed;
  let closeString = ",Z";
  pathData = lineGenerator(points);
  closedPathData = pathData.concat(closeString);
  d3.select(".polyline").attr("d", closedPathData);
}

function finishPline() {
  svg.on("mousemove", null);
  svg.on("click", null);
  plineType = opened;
  drawingStatus = notDrawing;
  pathData = lineGenerator(points);
  d3.select(".polyline").attr("d", pathData);
}

function setInitialVariables() {
  points = [];
  newPoint = [];
  placingPoint = [];
  cursorOnPt = noPoint;
  drawingStatus = drawing;
  plineType = opened;
}
