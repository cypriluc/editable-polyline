import { STATES } from "./constants.mjs";

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
    },
    undo() {
      stateObject.activeId = previousActiveId;
    },
  };
};

const createNewSvgGroupCommand = (stateObject) => {
  const previousGroup = stateObject.data[stateObject.activeId];
  return {
    execute() {
      stateObject.data[stateObject.activeId] = {
        points: [],
        drawingStatus: STATES.drawingStatus.drawing,
        polylineType: STATES.polylineType.opened,
      };
    },
    undo() {
      stateObject.data[stateObject.activeId] = previousGroup;
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
    },
    undo() {
      stateObject.data[stateObject.activeId].points = previousPoints;
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

const createClearCanvasCommand = (stateObject) => {
  const previousState = stateObject.data;
  return {
    execute() {
      for (let g in stateObject.data) {
        delete stateObject.data[g];
      }
    },
    undo() {
      stateObject.data = previousState;
    },
  };
};

const ADD = "ADD";
const MOVE = "MOVE";
const STATUS = "STATUS";
const CLEAR = "CLEAR";
const GROUP = "GROUP";
const ACTIVE = "ACTIVE";

const commands = {
  [GROUP]: createNewSvgGroupCommand,
  [ADD]: createAddPointCommand,
  [MOVE]: createMovePointCommand,
  [STATUS]: createSwitchStatusCommand,
  [CLEAR]: createClearCanvasCommand,
  [ACTIVE]: createSetActiveIdCommand,
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
        console.log(target);
        console.log("position:" + position, "history length:" + history.length);
      }
    },

    undo() {
      if (position > 0) {
        history[position].undo();
        position -= 1;
        console.log("UNDO");
        console.log(target);
        console.log(this.getCurrentState());
      }
    },

    redo() {
      if (position < history.length - 1) {
        position += 1;
        history[position].execute();
        console.log("REDO");
        console.log(target);
        console.log(this.getCurrentState());
      }
    },
    getCurrentState() {
      return {
        position: position,
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
  createSwitchStatusCommand,
  createClearCanvasCommand,
  createSetActiveIdCommand,
  commands,
  createCommandManager,
  trackStateObject,
  trackManager,
  GROUP,
  ADD,
  MOVE,
  STATUS,
  CLEAR,
  ACTIVE,
};
