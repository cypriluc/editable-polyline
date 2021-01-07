let points = [];
let newPoint = [];

const lineGenerator = d3.line();
let pathData = lineGenerator(points);

// events
let svg = d3.select("svg");
svg.on("click", function (d) {
  newPoint = [d.layerX, d.layerY];
  points.push(newPoint);
  pathData = lineGenerator(points);
  updateCircles();
  if (Array.isArray(points) && points.length > 1) {
    updatePolyline();
  }
});

function updateCircles() {
  d3.select(".points")
    .selectAll("circle")
    .data(points)
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
    .attr("r", 5);
}

function updatePolyline() {
  d3.select(".polyline").attr("d", pathData);
}
