import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
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

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.cookieName];

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
