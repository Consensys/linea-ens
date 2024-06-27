export function logError(error: any, ...objects: any[]) {
  const logObject = {
    error: error.message || error,
    details: objects,
  };
  console.log(logObject);
}
