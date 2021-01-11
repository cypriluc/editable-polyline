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

// global variables
let points = [];
let newPoint = [];
let placingPoint = [];
let cursorOnPt = noPoint;
let pathData;

// set svg size
svg.attr("width", svgWidth).attr("height", svgHeight);

// register event - add new point on click in svg
svg.on("click", function (d) {
  if (!cursorOnPt) {
    newPoint = [d.layerX, d.layerY];
    points.push(newPoint);
    updateGeometry();
  }
  if (cursorOnPt === 1) {
    console.log("close pline");
    //closePline();
  }
  if (cursorOnPt === 3) {
    console.log("finish pline");
    //finishPline();
  }
});

// register event - drag existing point
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
  let temporaryPoints = [];
  svg.on("mousemove", function (d) {
    temporaryPoints = Array.from(points);
    placingPoint = [d.layerX, d.layerY];
    temporaryPoints.push(placingPoint);
    pathData = lineGenerator(temporaryPoints);
    d3.select(".polyline").attr("d", pathData);
  });
  /*   if (Array.isArray(points) && points.length > 1) {
    d3.select(".polyline").attr("d", pathData);
  } else {
    d3.select(".polyline").attr("d", "");
  } */
}

function clearSvg() {
  points = [];
  newPoint = [];
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
}

function getPtId(target) {
  return parseInt(target.id.split("point")[1]);
}
