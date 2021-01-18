import { STATES } from "./states.mjs";

const createStateObject = () => {
  return {};
};

// commands
const createNewSvgGroupCommand = (stateObject, activeId) => {
  const previousGroup = stateObject.activeId;
  return {
    execute() {
      stateObject.activeId = {
        points: [],
        drawingStatus: STATES.drawingStatus.drawing,
        polylineType: STATES.polylineType.opened,
      };
    },
    undo() {
      stateObject.activeId = previousGroup;
    },
  };
};

const createAddPointCommand = (stateObject, activeId, newPoint) => {
  const previousPoints = Array.from(stateObject.activeId.points);
  return {
    execute() {
      stateObject.activeId.points.push(newPoint);
    },
    undo() {
      stateObject.activeId.points = previousPoints;
    },
  };
};

const createMovePointCommand = (stateObject, activeId, ptObj) => {
  const previousPoints = Array.from(stateObject.activeId.points);
  return {
    execute() {
      stateObject.activeId.points[ptObj.index] = ptObj.point;
    },
    undo() {
      stateObject.activeId.points = previousPoints;
    },
  };
};

const createSwitchStatusCommand = (stateObject, activeId, statusObj) => {
  const previousDrawingStatus = stateObject.activeId.drawingStatus;
  const previousPolylineType = stateObject.activeId.polylineType;

  return {
    execute() {
      stateObject.activeId.drawingStatus = statusObj.drawStatus;
      stateObject.activeId.polylineType = statusObj.plineType;
    },
    undo() {
      stateObject.activeId.drawingStatus = previousDrawingStatus;
      stateObject.activeId.polylineType = previousPolylineType;
    },
  };
};

const createClearCanvasCommand = (stateObject) => {
  const previousState = stateObject;
  return {
    execute() {
      stateObject = {};
    },
    undo() {
      stateObject = previousState;
    },
  };
};

const ADD = "ADD";
const MOVE = "MOVE";
const STATUS = "STATUS";
const CLEAR = "CLEAR";
const GROUP = "GROUP";

const commands = {
  [GROUP]: createNewSvgGroupCommand,
  [ADD]: createAddPointCommand,
  [MOVE]: createMovePointCommand,
  [STATUS]: createSwitchStatusCommand,
  [CLEAR]: createClearCanvasCommand,
};

const createCommandManager = (target) => {
  let history = [null];
  let position = 0;

  return {
    doCommand(commandType, activeId, argument) {
      if (position < history.length - 1) {
        history = history.slice(0, position + 1);
      }

      if (commands[commandType]) {
        const concreteCommand = commands[commandType](
          target,
          activeId,
          argument
        );
        history.push(concreteCommand);
        position += 1;
        concreteCommand.execute();
        console.log(commandType);
        console.log(
          "position:" + position,
          "history length:" + history.length,
          "activeId:" + activeId,
          "points:" + target.activeId.points,
          "drawing:" + target.activeId.drawingStatus,
          "polyline-type:" + target.activeId.polylineType
        );
      }
    },

    undo() {
      if (position > 0) {
        history[position].undo();
        position -= 1;
        console.log("UNDO");
        console.log(this.getCurrentState());
      }
    },

    redo() {
      if (position < history.length - 1) {
        position += 1;
        history[position].execute();
        console.log("REDO");
        console.log(this.getCurrentState());
      }
    },
    getCurrentState() {
      return {
        position: position,
        historyLength: history.length,
        activeId: target,
        points: target.activeId.points.length,
        drawing: target.activeId.drawingStatus,
        polylineType: target.activeId.polylineType,
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
  createSwitchStatusCommand,
  createClearCanvasCommand,
  commands,
  createCommandManager,
  trackStateObject,
  trackManager,
  GROUP,
  ADD,
  MOVE,
  STATUS,
  CLEAR,
};
