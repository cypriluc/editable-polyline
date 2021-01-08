let points = [];
let newPoint = [];

const lineGenerator = d3.line();
let pathData = lineGenerator(points);

// events
let svg = d3.select("svg");
svg.on("click", function (d) {
  newPoint = [d.layerX, d.layerY];
  points.push(newPoint);
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
    .attr("r", 4);
  circles.exit().remove();
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
