import { SVG_SIZE, GRID_RESOLUTION } from "./constants.mjs";

const width = SVG_SIZE.width,
  height = SVG_SIZE.height;

const resolution = () => {
  return GRID_RESOLUTION.value();
};

const grid = d3.select("#grid");
drawGrid();

const showGridBtn = document.getElementById("show-grid-btn");
const ResBtn10 = document.getElementById("res-10");
const ResBtn20 = document.getElementById("res-20");
const ResBtn30 = document.getElementById("res-30");

ResBtn10.onclick = function () {
  GRID_RESOLUTION.set(10);
  drawGrid();
};

ResBtn20.onclick = function () {
  GRID_RESOLUTION.set(20);
  drawGrid();
};

ResBtn30.onclick = function () {
  GRID_RESOLUTION.set(30);
  drawGrid();
};

showGridBtn.onclick = function () {
  document.getElementById("grid").classList.toggle("hide-grid");
};

function drawGrid() {
  grid.selectAll("line").remove();
  grid
    .selectAll(".vertical")
    .data(d3.range(1, width / resolution()))
    .enter()
    .append("line")
    .classed("vertical", true)
    .attr("x1", function (d) {
      return d * resolution();
    })
    .attr("y1", 0)
    .attr("x2", function (d) {
      return d * resolution();
    })
    .attr("y2", height);

  grid
    .selectAll(".horizontal")
    .data(d3.range(1, height / resolution()))
    .enter()
    .append("line")
    .classed("horizontal", true)
    .attr("x1", 0)
    .attr("y1", function (d) {
      return d * resolution();
    })
    .attr("x2", width)
    .attr("y2", function (d) {
      return d * resolution();
    });
}
