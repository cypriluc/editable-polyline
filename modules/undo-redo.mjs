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
      }
    },

    undo() {
      if (position > 0) {
        history[position].undo();
        position -= 1;
      }
    },

    redo() {
      if (position < history.length - 1) {
        position += 1;
        history[position].execute();
      }
    },
  };
};

const trackStateObject = createStateObject();
const trackManager = createCommandManager(trackStateObject);
/* console.log(trackStateObject.points); */

trackManager.doCommand(ADD, [200, 300]);
console.log("add");
console.log(trackStateObject.points[0]);

trackManager.doCommand(ADD, [100, 200]);
console.log("add");
console.log(trackStateObject.points[0]);
console.log(trackStateObject.points[1]);

trackManager.doCommand(MOVE, { index: 1, point: [50, 50] });
console.log("move");
console.log(trackStateObject.points[0]);
console.log(trackStateObject.points[1]);

trackManager.doCommand(DRAWING, STATES.drawingStatus.notDrawing);
console.log("drawing");
console.log("drawing status: " + trackStateObject.drawingStatus);

trackManager.doCommand(POLYLINE_TYPE, STATES.polylineType.closed);
console.log("polyline-type");
console.log("polyline-type: " + trackStateObject.polylineType);

trackManager.undo();
console.log("undo");
console.log("polyline-type: " + trackStateObject.polylineType);

trackManager.undo();
console.log("undo");
console.log("drawing status: " + trackStateObject.drawingStatus);

trackManager.undo();
console.log("undo");
console.log(trackStateObject.points[0]);
console.log(trackStateObject.points[1]);

trackManager.redo();
console.log("redo");
console.log("drawing status: " + trackStateObject.drawingStatus);
console.log(trackStateObject.points[0]);
console.log(trackStateObject.points[1]);

trackManager.doCommand(CLEAR);
console.log("clear");
console.log(trackStateObject.points);

trackManager.undo();
console.log("undo");
console.log(trackStateObject.points[0]);
console.log(trackStateObject.points[1]);

export { trackStateObject, trackManager };
