import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logError, logWarn } from '../utils/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

/**
 * Every error that reaches here gets exactly one log line, at a level matching
 * whether it's an expected rejection (warn) or a genuine failure (error) - so
 * nothing that goes wrong on the server passes through silently.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const where = `${req.method} ${req.originalUrl}`;

  if (err instanceof ApiError) {
    logWarn(`${where} -> ${err.status} ${err.code}: ${err.message}`);
    res.status(err.status).json({ error: { message: err.message, code: err.code } });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    logWarn(`${where} -> 400 VALIDATION_ERROR: ${message}`);
    res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
    return;
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 5MB size limit.' : err.message;
    logWarn(`${where} -> 400 UPLOAD_ERROR: ${message}`);
    res.status(400).json({ error: { message, code: 'UPLOAD_ERROR' } });
    return;
  }

  if (err && typeof err === 'object' && 'code' in err && (err as { code: unknown }).code === 11000) {
    logWarn(`${where} -> 409 DUPLICATE_KEY`);
    res.status(409).json({ error: { message: 'A record with this value already exists.', code: 'DUPLICATE_KEY' } });
    return;
  }

  logError(`unhandled error on ${where}`, err);
  res.status(500).json({ error: { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' } });
}
