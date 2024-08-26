"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = exports.logDebug = exports.logError = void 0;
function logError(error) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    var logObject = {
        error: error.message || error,
        details: objects,
    };
    console.error(logObject);
}
exports.logError = logError;
function logDebug(message) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    if (process.env.NODE_ENV === "development") {
        var logObject = {
            message: message,
            details: objects,
        };
        console.dir(logObject, { depth: 6 });
    }
}
exports.logDebug = logDebug;
function logInfo(message) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    var logObject = {
        message: message,
        details: objects,
    };
    console.dir(logObject, { depth: 3 });
}
exports.logInfo = logInfo;
//# sourceMappingURL=utils.js.map