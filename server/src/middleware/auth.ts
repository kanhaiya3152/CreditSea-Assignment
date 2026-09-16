import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { Role } from '../utils/constants';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

/**
 * Auth is a bearer token, not a cookie. The client and the API are deployed on
 * separate domains, which makes any cookie between them a third-party cookie -
 * blocked outright by default in incognito and increasingly in normal browsing.
 * A token the client sends explicitly is unaffected by that, and needs no CORS
 * credentials handling.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;

  if (!token) {
    next(ApiError.unauthorized());
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Session expired or invalid. Please log in again.'));
  }
}
