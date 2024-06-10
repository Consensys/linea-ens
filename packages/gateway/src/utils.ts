export function serializeBigInt(value: any) {
  return typeof value === "bigint" ? value.toString() : value;
}

export function logError(error: any, ...objects: any[]) {
  const logObject = {
    error: error.message || error,
    details: objects,
  };
  console.log(JSON.stringify(logObject, serializeBigInt, 2));
}
