import { STATES } from "./constants.mjs";
import * as main from "../main.js";

const svgGeometry = d3.select("#geometry"),
  svg = d3.select("svg");

const createStateObject = () => {
  return {
    activeId: null,
    data: {},
  };
};

// commands
const createSetActiveIdCommand = (stateObject, id) => {
  const previousActiveId = stateObject.activeId;
  return {
    execute() {
      stateObject.activeId = id;
      colorActive();
    },
    undo() {
      stateObject.activeId = previousActiveId;
      colorActive();
    },
  };
};

const createNewSvgGroupCommand = (stateObject) => {
  return {
    execute() {
      stateObject.data[stateObject.activeId] = {
        points: [],
        drawingStatus: STATES.drawingStatus.drawing,
        polylineType: STATES.polylineType.opened,
      };
      // update DOM
      appendSvgGroup(stateObject.activeId);
    },
    undo() {
      delete stateObject.data[stateObject.activeId];
      // remove group from DOM
      svgGeometry.select("#" + stateObject.activeId).remove();
    },
  };
};

const createAddPointCommand = (stateObject, newPoint) => {
  const previousPoints = Array.from(
    stateObject.data[stateObject.activeId].points
  );
  return {
    execute() {
      stateObject.data[stateObject.activeId].points.push(newPoint);
      updateGeometry();
    },
    undo() {
      stateObject.data[stateObject.activeId].points = previousPoints;
      updateGeometry();
    },
  };
};

const createMovePointCommand = (stateObject, ptObj) => {
  const previousPoints = Array.from(
    stateObject.data[stateObject.activeId].points
  );
  return {
    execute() {
      stateObject.data[stateObject.activeId].points[ptObj.index] = ptObj.point;
    },
    undo() {
      stateObject.data[stateObject.activeId].points = previousPoints;
      updateGeometry();
    },
  };
};

const createSwitchStatusCommand = (stateObject, statusObj) => {
  const previousDrawingStatus =
    stateObject.data[stateObject.activeId].drawingStatus;
  const previousPolylineType =
    stateObject.data[stateObject.activeId].polylineType;

  return {
    execute() {
      stateObject.data[stateObject.activeId].drawingStatus =
        statusObj.drawStatus;
      stateObject.data[stateObject.activeId].polylineType = statusObj.plineType;
      main.updatePolyline(stateObject.activeId);
    },
    undo() {
      stateObject.data[
        stateObject.activeId
      ].drawingStatus = previousDrawingStatus;
      stateObject.data[
        stateObject.activeId
      ].polylineType = previousPolylineType;
    },
  };
};

const createDeletePathCommand = (stateObject, id) => {
  const previousState = stateObject.data[id];
  const previousActiveId = stateObject.activeId;
  return {
    execute() {
      // remove from DOM
      svgGeometry.select("#" + stateObject.activeId).remove();
      // modify stateObject
      delete stateObject.data[id];
      stateObject.activeId = null;
    },
    undo() {
      stateObject.data[id] = previousState;
      stateObject.activeId = previousActiveId;
      // update DOM
      if (document.getElementById(stateObject.activeId) === null) {
        appendSvgGroup(stateObject.activeId);
      }
      main.updateCircles(stateObject.activeId);
      main.updatePolyline(stateObject.activeId);
      colorActive();
    },
  };
};

const createClearCanvasCommand = (stateObject) => {
  const previousData = Object.assign({}, stateObject.data);
  const previousActiveId = stateObject.activeId;
  return {
    execute() {
      for (let g in stateObject.data) {
        delete stateObject.data[g];
      }
      stateObject.activeId = null;
      // remove from DOM
      svgGeometry.selectAll("g").remove();
    },
    undo() {
      stateObject.data = previousData;
      stateObject.activeId = previousActiveId;
      // update DOM
      let pathList = [];
      for (let path in stateObject.data) {
        pathList.push(path);
      }
      pathList.forEach(function (pathId) {
        if (document.getElementById(pathId) === null) {
          appendSvgGroup(pathId);
        }
        main.updateCircles(pathId);
        main.updatePolyline(pathId);
      });
      colorActive();
    },
  };
};

const ADD = "ADD";
const MOVE = "MOVE";
const STATUS = "STATUS";
const CLEAR = "CLEAR";
const GROUP = "GROUP";
const ACTIVE = "ACTIVE";
const DELETE = "DELETE";

const commands = {
  [GROUP]: createNewSvgGroupCommand,
  [ADD]: createAddPointCommand,
  [MOVE]: createMovePointCommand,
  [STATUS]: createSwitchStatusCommand,
  [CLEAR]: createClearCanvasCommand,
  [ACTIVE]: createSetActiveIdCommand,
  [DELETE]: createDeletePathCommand,
};

const createCommandManager = (target) => {
  let history = [null];
  let position = 0;

  return {
    doCommand(commandType, argument) {
      if (position < history.length - 1) {
        history = history.slice(0, position + 1);
      }

      if (commands[commandType]) {
        const concreteCommand = commands[commandType](target, argument);
        history.push(concreteCommand);
        position += 1;
        concreteCommand.execute();
        checkButtons();

        console.log(commandType);
        //console.log("position:" + position, "history length:" + history.length);
        console.log(target);
      }
    },

    undo() {
      if (position > 0) {
        history[position].undo();
        position -= 1;
        checkButtons();
        console.log("UNDO");
        console.log(target);
        //console.log(this.getCurrentState());
      }
    },

    redo() {
      if (position < history.length - 1) {
        position += 1;
        history[position].execute();
        checkButtons();
        console.log("REDO");
        console.log(target);
        //console.log(this.getCurrentState());
      }
    },
    getCurrentState() {
      return {
        active: target.activeId,
        position: position,
        historyLength: history.length,
      };
    },
  };
};

const stateObject = createStateObject();
const commandManager = createCommandManager(stateObject);

function colorActive() {
  let activeG = svgGeometry.select("#" + stateObject.activeId);
  svgGeometry.selectAll("g").classed("active", false);
  activeG.classed("active", true);
  addPathsEvent();
}

function addPathsEvent() {
  let allPaths = document.getElementsByClassName("path-group");
  let inActivePaths = [];
  if (allPaths.length > 1) {
    for (let group of allPaths) {
      if (!group.classList.contains("active")) {
        inActivePaths.push(group);
      }
    }
    inActivePaths.forEach(function (path) {
      path.addEventListener("click", function (e) {
        console.log("_____CLICK!!!!!!!!!!!!!");
        svg.on("click", null);
        let newActiveId = e.target.parentNode.getAttribute("id");
        commandManager.doCommand(ACTIVE, newActiveId);
        //setTimeout(svg.on("click", main.svgClicked()), 3000);
      });
    });
  }
}

function appendSvgGroup(id) {
  let newGroup = svgGeometry
    .append("g")
    .attr("id", id)
    .classed("path-group", true);
  newGroup.append("path").classed("polyline", true);
  newGroup.append("g").classed("points", true);
  colorActive();
}

function checkButtons() {
  if (commandManager.getCurrentState().position === 0) {
    main.undoBtn.disabled = true;
  } else {
    main.undoBtn.disabled = false;
  }
  // disable redo button when not possible to redo
  if (
    commandManager.getCurrentState().position >=
    commandManager.getCurrentState().historyLength - 1
  ) {
    main.redoBtn.disabled = true;
  } else {
    main.redoBtn.disabled = false;
  }
}

function updateGeometry() {
  main.updateCircles(stateObject.activeId);
  main.updatePolyline(stateObject.activeId);
}

export {
  createStateObject,
  createAddPointCommand,
  createMovePointCommand,
  createSwitchStatusCommand,
  createClearCanvasCommand,
  createSetActiveIdCommand,
  createDeletePathCommand,
  commands,
  createCommandManager,
  stateObject,
  commandManager,
  GROUP,
  ADD,
  MOVE,
  STATUS,
  CLEAR,
  ACTIVE,
  DELETE,
};
