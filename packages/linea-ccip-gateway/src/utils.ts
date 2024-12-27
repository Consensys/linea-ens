export function logError(error: unknown, ...objects: unknown[]) {
  const logObject = {
    error: error instanceof Error ? error.message : error,
    details: objects,
  };
  console.error(logObject);
}

export function logDebug(message: string, ...objects: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    const logObject = {
      message,
      details: objects,
    };
    console.dir(logObject, { depth: 6 });
  }
}

export function logInfo(message: string, ...objects: unknown[]) {
  const logObject = {
    message,
    details: objects,
  };
  console.dir(logObject, { depth: 3 });
}
