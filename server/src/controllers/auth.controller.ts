import { Request, Response } from 'express';
import { User } from '../models/User';
import { comparePassword, hashPassword, signToken } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { logInfo, logWarn } from '../utils/logger';
import { loginSchema, signupSchema } from '../utils/validation';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password } = signupSchema.parse(req.body);

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await hashPassword(password);
  // Role is always forced to BORROWER on public signup - never trust a role
  // field from the request body. Every other role only exists via the seed script.
  const user = await User.create({ fullName, email, passwordHash, role: 'BORROWER' });

  const token = signToken({ id: user._id.toString(), role: user.role });

  logInfo(`signup succeeded: ${user.email} (${user._id})`);
  // The token and the user ship together so the client can sign in without a
  // follow-up /auth/me round trip.
  res.status(201).json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    logWarn(`login failed: no account for ${email}`);
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    logWarn(`login failed: wrong password for ${email}`);
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  logInfo(`login succeeded: ${user.email} (${user.role})`);
  res.status(200).json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    throw ApiError.unauthorized();
  }

  res.status(200).json({
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
});
