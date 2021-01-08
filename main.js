// global constants
const svgWidth = d3.select("svg").attr("width");
const svgHeight = d3.select("svg").attr("height");
const lineGenerator = d3.line();
const pointRadius = 4;
const pointRadiusHover = 6;

// global variables
let points = [];
let newPoint = [];
let cursorOnPt = false;
let pathData;

// register event - add new point on click in svg
let svg = d3.select("svg");
svg.on("click", function (d) {
  if (!cursorOnPt) {
    newPoint = [d.layerX, d.layerY];
    points.push(newPoint);
    updateGeometry();
  }
});

// register event - drag existing point
let dragHandler = d3.drag().on("drag", function (d) {
  let circle = d3.select(this);
  let ptIndex = parseInt(circle.attr("id").slice(5));
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
  updateGeometry();
});

// function definitions
function updateGeometry() {
  pathData = lineGenerator(points);
  updateCircles();
  updatePolyline();
}

function updateCircles() {
  let circles = d3.select(".points").selectAll("circle").data(points);
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
  circles.exit().remove();
  registerPointEvents();
}

function registerPointEvents() {
  let circles = d3.select(".points").selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", pointRadiusHover)
        .attr("fill", "purple");
      cursorOnPt = true;
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", pointRadius)
        .attr("fill", "white");
      cursorOnPt = false;
    });

  //call drag handler
  dragHandler(circles);
}

function updatePolyline() {
  if (Array.isArray(points) && points.length > 1) {
    d3.select(".polyline").attr("d", pathData);
  } else {
    d3.select(".polyline").attr("d", "");
  }
}

function clearSvg() {
  points = [];
  newPoint = [];
  d3.select(".polyline").attr("d", "");
  d3.select(".points").selectAll("circle").remove();
}
