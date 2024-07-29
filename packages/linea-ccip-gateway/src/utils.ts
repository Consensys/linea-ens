export function logError(error: any, ...objects: any[]) {
  const logObject = {
    error: error.message || error,
    details: objects,
  };
  console.error(logObject);
}

export function logDebug(message: string, ...objects: any[]) {
  if (process.env.NODE_ENV === "debug") {
    const logObject = {
      message,
      details: objects,
    };
    console.dir(logObject, { depth: 6 });
  }
}

export function logInfo(message: string, ...objects: any[]) {
  const logObject = {
    message,
    details: objects,
  };
  console.dir(logObject, { depth: 3 });
}
