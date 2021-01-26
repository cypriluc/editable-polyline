import { SVG_SIZE, GRID_RESOLUTION } from "./constants.mjs";

const width = SVG_SIZE.width,
  height = SVG_SIZE.height,
  resolution = GRID_RESOLUTION;

const svg = d3.select("svg");

const grid = svg.append("g").attr("id", "grid");
grid
  .selectAll(".vertical")
  .data(d3.range(1, width / resolution))
  .enter()
  .append("line")
  .classed("vertical", true)
  .attr("x1", function (d) {
    return d * resolution;
  })
  .attr("y1", 0)
  .attr("x2", function (d) {
    return d * resolution;
  })
  .attr("y2", height);

grid
  .selectAll(".horizontal")
  .data(d3.range(1, height / resolution))
  .enter()
  .append("line")
  .classed("horizontal", true)
  .attr("x1", 0)
  .attr("y1", function (d) {
    return d * resolution;
  })
  .attr("x2", width)
  .attr("y2", function (d) {
    return d * resolution;
  });
