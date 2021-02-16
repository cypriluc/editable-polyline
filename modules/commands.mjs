import { PATH_STATES, CURRENT_MODE } from "./constants.mjs";
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

const createNewSvgGroupCommand = (stateObject, groupObj) => {
  const previousActiveId = stateObject.activeId;
  return {
    execute() {
      stateObject.activeId = groupObj.id;
      colorActive();
      stateObject.data[stateObject.activeId] = {
        points: [],
        drawingStatus: PATH_STATES.drawingStatus.drawing,
        polylineType: PATH_STATES.polylineType.opened,
      };

      appendSvgGroup(stateObject.activeId);
      stateObject.data[stateObject.activeId].points.push(groupObj.point);
      main.updateGeometry();
    },
    undo() {
      delete stateObject.data[stateObject.activeId];
      // remove group from DOM
      svgGeometry.select("#" + stateObject.activeId).remove();
      stateObject.activeId = previousActiveId;
      colorActive();
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
      main.updateGeometry();
    },
    undo() {
      stateObject.data[stateObject.activeId].points = previousPoints;
      main.updateGeometry();
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
      main.updateGeometry();
    },
  };
};

const createTransformGroupCommand = (stateObject, translation) => {
  const previousTranslation = translation;

  return {
    execute() {
      for (
        let i = 0;
        i < stateObject.data[stateObject.activeId].points.length;
        i++
      ) {
        stateObject.data[stateObject.activeId].points[i][0] += translation.x;
        stateObject.data[stateObject.activeId].points[i][1] += translation.y;
      }

      main.updateGeometry();
    },
    undo() {
      for (
        let i = 0;
        i < stateObject.data[stateObject.activeId].points.length;
        i++
      ) {
        stateObject.data[stateObject.activeId].points[i][0] -=
          previousTranslation.x;
        stateObject.data[stateObject.activeId].points[i][1] -=
          previousTranslation.y;
      }
      console.log(stateObject.data[stateObject.activeId].points);
      main.updateGeometry();
    },
  };
};

const createFinishPolylineCommand = (stateObject, plineType) => {
  const previousDrawingStatus =
    stateObject.data[stateObject.activeId].drawingStatus;
  const previousPolylineType =
    stateObject.data[stateObject.activeId].polylineType;

  return {
    execute() {
      stateObject.data[stateObject.activeId].drawingStatus =
        PATH_STATES.drawingStatus.notDrawing;
      stateObject.data[stateObject.activeId].polylineType = plineType;
      main.drawingFinished();
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
const FINISH = "FINISH";
const CLEAR = "CLEAR";
const GROUP = "GROUP";
const ACTIVE = "ACTIVE";
const DELETE = "DELETE";
const TRANSFORM = "TRANSFORM";

const commands = {
  [GROUP]: createNewSvgGroupCommand,
  [ADD]: createAddPointCommand,
  [MOVE]: createMovePointCommand,
  [FINISH]: createFinishPolylineCommand,
  [CLEAR]: createClearCanvasCommand,
  [ACTIVE]: createSetActiveIdCommand,
  [DELETE]: createDeletePathCommand,
  [TRANSFORM]: createTransformGroupCommand,
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
  svgGeometry
    .selectAll("g")
    .classed("active", false)
    .classed("visible-points", false);
  activeG.classed("active", true);
  let currentMode = CURRENT_MODE.get();
  if (currentMode === 0 || currentMode === 1) {
    activeG.classed("visible-points", true);
  }
  addPathsEvent();
}

function addPathsEvent() {
  let allPaths = document.getElementsByClassName("path-group");
  let inActivePaths = [];
  let currentMode = CURRENT_MODE.get();
  if (allPaths.length > 0) {
    for (let group of allPaths) {
      if (!group.classList.contains("active")) {
        inActivePaths.push(group);
      }
    }
    inActivePaths.forEach(function (path) {
      path.addEventListener("click", function (e) {
        let newActiveId = e.target.parentNode.getAttribute("id");
        if (newActiveId != stateObject.activeId && currentMode != 0) {
          commandManager.doCommand(ACTIVE, newActiveId);
        }
      });
    });
  }
}

function appendSvgGroup(id) {
  let newGroup = svgGeometry
    .append("g")
    .attr("id", id)
    .classed("path-group", true);
  let polylineId = "pline" + id;

  newGroup.append("path").attr("id", polylineId);

  newGroup
    .append("use")
    .classed("polyline-hover-area", true)
    .attr("xlink:href", "#" + polylineId);

  newGroup
    .append("use")
    .classed("polyline", true)
    .attr("xlink:href", "#" + polylineId);

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

export {
  createStateObject,
  createAddPointCommand,
  createMovePointCommand,
  createFinishPolylineCommand,
  createClearCanvasCommand,
  createSetActiveIdCommand,
  createDeletePathCommand,
  commands,
  colorActive,
  createCommandManager,
  stateObject,
  commandManager,
  GROUP,
  ADD,
  MOVE,
  FINISH,
  CLEAR,
  ACTIVE,
  DELETE,
  TRANSFORM,
};
