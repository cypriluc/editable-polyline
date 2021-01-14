import { STATES } from "./states.mjs";

const createStateObject = () => {
  return {
    points: [],
    drawingStatus: STATES.drawingStatus.drawing,
    polylineType: STATES.polylineType.opened,
  };
};

// commands
const createAddPointCommand = (stateObject, newPoint) => {
  const previousPoints = Array.from(stateObject.points);
  return {
    execute() {
      stateObject.points.push(newPoint);
    },
    undo() {
      stateObject.points = previousPoints;
    },
  };
};

const createMovePointCommand = (stateObject, ptObj) => {
  const previousPoints = Array.from(stateObject.points);
  return {
    execute() {
      stateObject.points[ptObj.index] = ptObj.point;
    },
    undo() {
      stateObject.points = previousPoints;
    },
  };
};

const createChangeDrawingStatusCommand = (stateObject, status) => {
  const previousDrawingStatus = stateObject.drawingStatus;
  return {
    execute() {
      stateObject.drawingStatus = status;
    },
    undo() {
      stateObject.drawingStatus = previousDrawingStatus;
    },
  };
};

const createChangePolylineTypeCommand = (stateObject, type) => {
  const previousPolylineType = stateObject.polylineType;
  return {
    execute() {
      stateObject.polylineType = type;
    },
    undo() {
      stateObject.polylineType = previousPolylineType;
    },
  };
};

const createClearPointsArrayCommand = (stateObject) => {
  const previousPoints = Array.from(stateObject.points);
  return {
    execute() {
      stateObject.points = [];
    },
    undo() {
      stateObject.points = previousPoints;
    },
  };
};

const ADD = "ADD";
const MOVE = "MOVE";
const DRAWING = "DRAWING";
const POLYLINE_TYPE = "POLYLINE_TYPE";
const CLEAR = "CLEAR";

const commands = {
  [ADD]: createAddPointCommand,
  [MOVE]: createMovePointCommand,
  [DRAWING]: createChangeDrawingStatusCommand,
  [POLYLINE_TYPE]: createChangePolylineTypeCommand,
  [CLEAR]: createClearPointsArrayCommand,
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
        console.log(
          "position: " + position,
          "history length: " + history.length,
          "points: " + target.points.length
        );
      }
    },

    undo() {
      if (position > 0) {
        history[position].undo();
        position -= 1;
        console.log(this.getCurrentState());
        console.log("points: " + target.points.length);
      }
    },

    redo() {
      if (position < history.length - 1) {
        position += 1;
        history[position].execute();
        console.log(this.getCurrentState());
        console.log("points: " + target.points.length);
      }
    },
    getCurrentState() {
      return {
        position,
        historyLength: history.length,
      };
    },
  };
};

const trackStateObject = createStateObject();
const trackManager = createCommandManager(trackStateObject);

export {
  createStateObject,
  createAddPointCommand,
  createMovePointCommand,
  createChangeDrawingStatusCommand,
  createChangePolylineTypeCommand,
  createClearPointsArrayCommand,
  commands,
  createCommandManager,
  trackStateObject,
  trackManager,
  ADD,
  MOVE,
  DRAWING,
  POLYLINE_TYPE,
  CLEAR,
};
