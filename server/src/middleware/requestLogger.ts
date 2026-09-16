import { NextFunction, Request, Response } from 'express';
import { logInfo } from '../utils/logger';

/**
 * Baseline access log for every successful request (status < 400), independent
 * of whatever a given route handler does or doesn't log itself. Failures are not
 * logged here - every error response in this app is produced by errorHandler.ts,
 * which logs each one with the actual rejection reason, so logging it again here
 * would just duplicate the same request as a second, less specific line.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    if (res.statusCode < 400) {
      const duration = Date.now() - start;
      logInfo(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}
