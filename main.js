let points = [];
let newPoint = [];
let cursorOnPt = false;

const lineGenerator = d3.line();
let pathData = lineGenerator(points);

// events
let dragHandler = d3.drag().on("drag", function (d) {
  let circle = d3.select(this);
  circle.attr("cx", d.x).attr("cy", d.y);
  let ptIndex = parseInt(circle.attr("id").slice(5));
  points[ptIndex] = [d.x, d.y];
  updateGeometry();
});
// add new point on click in svg
let svg = d3.select("svg");
svg.on("click", function (d) {
  if (!cursorOnPt) {
    newPoint = [d.layerX, d.layerY];
    points.push(newPoint);
    updateGeometry();
  }
});

function registerPointEvents() {
  let circles = d3.select(".points").selectAll("circle");
  // hover on circles
  circles
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", 6)
        .attr("fill", "purple");
      cursorOnPt = true;
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", 4)
        .attr("fill", "white");
      cursorOnPt = false;
    });

  //call drag handler
  dragHandler(circles);
}

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
    .attr("r", 4);
  circles.exit().remove();
  registerPointEvents();
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
