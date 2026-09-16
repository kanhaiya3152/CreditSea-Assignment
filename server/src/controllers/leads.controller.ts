import { Request, Response } from 'express';
import { LoanApplication } from '../models/LoanApplication';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

export const listLeads = asyncHandler(async (_req: Request, res: Response) => {
  const applicantIds = await LoanApplication.distinct('borrower');
  const leads = await User.find({ role: 'BORROWER', _id: { $nin: applicantIds } })
    .sort({ createdAt: -1 })
    .select('fullName email createdAt');

  res.status(200).json({ leads });
});
