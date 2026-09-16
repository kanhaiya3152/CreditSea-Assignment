import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { Role } from '../utils/constants';

/** 403s unless req.user.role is one of `roles`, or ADMIN (Admin always passes). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role) {
      next(ApiError.unauthorized());
      return;
    }

    if (role === 'ADMIN' || roles.includes(role)) {
      next();
      return;
    }

    next(ApiError.forbidden(`This action requires one of the following roles: ${roles.join(', ')}.`));
  };
}
