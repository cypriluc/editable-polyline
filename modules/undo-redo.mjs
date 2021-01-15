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

const createSwitchStatusCommand = (stateObject, statusObj) => {
  const previousDrawingStatus = stateObject.drawingStatus;
  const previousPolylineType = stateObject.polylineType;

  return {
    execute() {
      stateObject.drawingStatus = statusObj.drawStatus;
      stateObject.polylineType = statusObj.plineType;
    },
    undo() {
      stateObject.drawingStatus = previousDrawingStatus;
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
const STATUS = "STATUS";
const CLEAR = "CLEAR";

const commands = {
  [ADD]: createAddPointCommand,
  [MOVE]: createMovePointCommand,
  [STATUS]: createSwitchStatusCommand,
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
        console.log(commandType);
        console.log(
          "position:" + position,
          "history length:" + history.length,
          "points:" + target.points.length,
          "drawing:" + target.drawingStatus,
          "polyline-type:" + target.polylineType
        );
      }
    },

    undo() {
      if (position > 0) {
        history[position].undo();
        position -= 1;
        console.log("UNDO");
        this.logCurrentState();
      }
    },

    redo() {
      if (position < history.length - 1) {
        position += 1;
        history[position].execute();
        console.log("REDO");
        this.logCurrentState();
      }
    },
    logCurrentState() {
      console.log(
        "position:" + position,
        "history length:" + history.length,
        "points:" + target.points.length,
        "drawing:" + target.drawingStatus,
        "polyline-type:" + target.polylineType
      );
    },
  };
};

const trackStateObject = createStateObject();
const trackManager = createCommandManager(trackStateObject);

export {
  createStateObject,
  createAddPointCommand,
  createMovePointCommand,
  createSwitchStatusCommand,
  createClearPointsArrayCommand,
  commands,
  createCommandManager,
  trackStateObject,
  trackManager,
  ADD,
  MOVE,
  STATUS,
  CLEAR,
};
