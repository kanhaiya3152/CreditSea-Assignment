function timestamp(): string {
  return new Date().toISOString();
}

/** Confirms a request succeeded or a business event happened - the counterpart to logError. */
export function logInfo(message: string): void {
  // eslint-disable-next-line no-console
  console.log(`[${timestamp()}] [info] ${message}`);
}

/** Consistent, greppable error logging for anywhere an error is caught and handled inline. */
export function logError(context: string, err: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[${timestamp()}] [error] ${context}:`, err);
}

/** A request that failed validation / was rejected by design (4xx) - expected, but worth a trace. */
export function logWarn(message: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[${timestamp()}] [warn] ${message}`);
}