import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { LoanApplication } from '../models/LoanApplication';
import { Payment } from '../models/Payment';
import { BRE_RULE_MESSAGES, runBre } from '../services/bre.service';
import { computeLoanFigures } from '../services/loanMath.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { APPLICATION_STATUSES, ApplicationStatus, Role } from '../utils/constants';
import { logInfo } from '../utils/logger';
import {
  applicationSubmitSchema,
  personalDetailsSchema,
  recordPaymentSchema,
  rejectSchema,
} from '../utils/validation';

export const breCheck = asyncHandler(async (req: Request, res: Response) => {
  const details = personalDetailsSchema.parse(req.body);
  const breResult = runBre(details, new Date());

  logInfo(
    `bre-check for user ${req.user!.id}: ${breResult.passed ? 'passed' : `failed [${breResult.failedRules.join(', ')}]`}`,
  );

  res.status(200).json({
    breResult,
    failedRuleMessages: breResult.failedRules.map((rule) => BRE_RULE_MESSAGES[rule]),
  });
});

export const submitApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = applicationSubmitSchema.parse(req.body);

  // A borrower can only have one loan "in flight" at a time - REJECTED and CLOSED are
  // the only terminal statuses, so any application not in one of those means they
  // already have an application either awaiting a decision or actively being repaid.
  // Without this, a borrower could stack multiple simultaneous loans, each independently
  // BRE-approved against their income but never evaluated against their *combined*
  // exposure across all of them - real credit risk, not just a data-modeling nicety.
  const existingActive = await LoanApplication.findOne({
    borrower: userId,
    status: { $nin: ['REJECTED', 'CLOSED'] },
  });
  if (existingActive) {
    throw ApiError.conflict(
      'You already have an active loan application. You can apply again once it is rejected or fully repaid.',
      'ACTIVE_APPLICATION_EXISTS',
    );
  }

  // Authoritative re-check - the client's earlier bre-check result is never trusted here.
  const breResult = runBre(body.personalDetails, new Date());
  if (!breResult.passed) {
    throw ApiError.badRequest(
      `This application does not meet eligibility rules: ${breResult.failedRules
        .map((rule) => BRE_RULE_MESSAGES[rule])
        .join(' ')}`,
      'BRE_FAILED',
    );
  }

  // The salary slip reference must point at a Cloudinary asset this user actually uploaded
  // (our own upload endpoint prefixes the public_id with the uploader's user id).
  const isOwnCloudinaryAsset =
    body.salarySlip.filePath.startsWith('https://res.cloudinary.com/') &&
    body.salarySlip.filePath.includes(`/lms/salary-slips/${userId}-`);
  if (!isOwnCloudinaryAsset) {
    throw ApiError.badRequest('Salary slip reference is invalid. Please re-upload the file.', 'INVALID_UPLOAD_REF');
  }

  const loanConfig = computeLoanFigures(body.loanConfig.principal, body.loanConfig.tenureDays);

  const application = await LoanApplication.create({
    borrower: userId,
    personalDetails: body.personalDetails,
    breResult,
    salarySlip: { ...body.salarySlip, uploadedAt: new Date() },
    loanConfig,
    status: 'APPLIED',
    appliedAt: new Date(),
  });

  logInfo(
    `application submitted: ${application._id} by user ${userId}, ₹${loanConfig.principal} / ${loanConfig.tenureDays}d`,
  );
  res.status(201).json({ application });
});

export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await LoanApplication.find({ borrower: req.user!.id }).sort({ appliedAt: -1 });
  res.status(200).json({ applications });
});

const ROLE_STATUS_SCOPE: Partial<Record<Role, ApplicationStatus>> = {
  SANCTION: 'APPLIED',
  DISBURSEMENT: 'SANCTIONED',
  COLLECTION: 'DISBURSED',
};

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const role = req.user!.role;
  const requestedStatus = req.query.status as string | undefined;

  if (requestedStatus && !APPLICATION_STATUSES.includes(requestedStatus as ApplicationStatus)) {
    throw ApiError.badRequest(`Invalid status filter: ${requestedStatus}`);
  }

  let status = requestedStatus as ApplicationStatus | undefined;

  if (role !== 'ADMIN') {
    const allowed = ROLE_STATUS_SCOPE[role];
    if (!allowed || (status && status !== allowed)) {
      throw ApiError.forbidden(`Your role can only view ${allowed ?? 'no'} applications.`);
    }
    status = allowed;
  }

  const filter = status ? { status } : {};
  const applications = await LoanApplication.find(filter)
    .sort({ appliedAt: -1 })
    .populate('borrower', 'fullName email')
    .lean();

  // The Collection module's table needs Amount Paid / Outstanding Balance per row -
  // computed here in one aggregation rather than N+1 payment lookups from the client.
  const disbursedIds = applications.filter((a) => a.status === 'DISBURSED').map((a) => a._id);
  const withBalances = applications as Array<
    (typeof applications)[number] & { paidTotal?: number; outstandingBalance?: number }
  >;

  if (disbursedIds.length > 0) {
    const sums = await Payment.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: { loanApplication: { $in: disbursedIds } } },
      { $group: { _id: '$loanApplication', total: { $sum: '$amount' } } },
    ]);
    const sumMap = new Map(sums.map((s) => [s._id.toString(), s.total]));

    for (const app of withBalances) {
      if (app.status === 'DISBURSED') {
        const paid = roundRupees(sumMap.get(app._id.toString()) ?? 0);
        app.paidTotal = paid;
        app.outstandingBalance = Math.max(0, roundRupees(app.loanConfig.totalRepayment - paid));
      }
    }
  }

  res.status(200).json({ applications: withBalances });
});

export const sanctionApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await LoanApplication.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found.');

  if (application.status !== 'APPLIED') {
    throw ApiError.conflict(
      `Cannot sanction an application with status ${application.status}. It must be APPLIED.`,
      'INVALID_TRANSITION',
    );
  }

  application.status = 'SANCTIONED';
  application.sanctionedAt = new Date();
  application.sanctionedBy = new Types.ObjectId(req.user!.id);
  await application.save();

  logInfo(`application sanctioned: ${application._id} by user ${req.user!.id}`);
  res.status(200).json({ application });
});

export const rejectApplication = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = rejectSchema.parse(req.body);
  const application = await LoanApplication.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found.');

  if (application.status !== 'APPLIED') {
    throw ApiError.conflict(
      `Cannot reject an application with status ${application.status}. It must be APPLIED.`,
      'INVALID_TRANSITION',
    );
  }

  application.status = 'REJECTED';
  application.rejectionReason = reason;
  application.rejectedAt = new Date();
  application.rejectedBy = new Types.ObjectId(req.user!.id);
  await application.save();

  logInfo(`application rejected: ${application._id} by user ${req.user!.id}: ${reason}`);
  res.status(200).json({ application });
});

export const disburseApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await LoanApplication.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found.');

  if (application.status !== 'SANCTIONED') {
    throw ApiError.conflict(
      `Cannot disburse an application with status ${application.status}. It must be SANCTIONED.`,
      'INVALID_TRANSITION',
    );
  }

  application.status = 'DISBURSED';
  application.disbursedAt = new Date();
  application.disbursedBy = new Types.ObjectId(req.user!.id);
  await application.save();

  logInfo(`application disbursed: ${application._id} by user ${req.user!.id}`);
  res.status(200).json({ application });
});

// Whole rupees, not paise - matches computeLoanFigures and everything the UI displays/accepts.
function roundRupees(n: number): number {
  return Math.round(n);
}

// Strips the time-of-day, keeping only the calendar date (in UTC, matching how
// paymentDate - a plain YYYY-MM-DD string - is parsed by z.coerce.date()).
function dateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// This app is explicitly for the Indian market, so "today" for date validation is
// always the Indian calendar day - regardless of what timezone the server process
// itself happens to be running in (dev machine, cloud host, etc). Using the server's
// own local clock here is what caused the original bug: it disagreed with what an
// IST user's browser considers "today" for part of every day.
function todayIST(): Date {
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { utrNumber, amount, paymentDate } = recordPaymentSchema.parse(req.body);
  const application = await LoanApplication.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found.');

  if (application.status !== 'DISBURSED') {
    throw ApiError.conflict(
      `Cannot record a payment against a loan with status ${application.status}. It must be DISBURSED.`,
      'INVALID_TRANSITION',
    );
  }

  // A repayment must fall on or between the disbursement date and today (inclusive),
  // compared as calendar dates rather than exact timestamps - disbursedAt carries a
  // time-of-day (whatever moment it was marked disbursed), and paymentDate is a
  // date-only value, so comparing raw instants would wrongly reject a payment dated
  // the same calendar day as disbursement. "Today" is the Indian calendar day (see
  // todayIST) so this doesn't depend on the server process's own local timezone.
  if (application.disbursedAt) {
    const disbursedDateOnly = dateOnlyUTC(application.disbursedAt);
    if (paymentDate < disbursedDateOnly) {
      throw ApiError.badRequest(
        `Payment date cannot be before the disbursement date (${disbursedDateOnly.toISOString().slice(0, 10)}).`,
        'PAYMENT_DATE_BEFORE_DISBURSEMENT',
      );
    }
  }
  const today = todayIST();
  if (paymentDate > today) {
    throw ApiError.badRequest(
      `Payment date cannot be after today (${today.toISOString().slice(0, 10)}).`,
      'PAYMENT_DATE_IN_FUTURE',
    );
  }

  const existingPayments = await Payment.find({ loanApplication: application._id });
  const paidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = roundRupees(application.loanConfig.totalRepayment - paidSoFar);

  if (amount > outstanding) {
    throw ApiError.badRequest(
      `Amount exceeds the outstanding balance of ₹${outstanding.toLocaleString('en-IN')}.`,
      'OVERPAYMENT',
    );
  }

  let payment;
  try {
    payment = await Payment.create({
      loanApplication: application._id,
      utrNumber: utrNumber.toUpperCase(),
      amount,
      paymentDate,
      recordedBy: req.user!.id,
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      throw ApiError.conflict('A payment with this UTR number has already been recorded.', 'DUPLICATE_UTR');
    }
    throw err;
  }

  logInfo(`payment recorded: ${payment._id} (${utrNumber.toUpperCase()}, ₹${amount}) on application ${application._id}`);

  const newPaidTotal = roundRupees(paidSoFar + amount);
  if (newPaidTotal >= application.loanConfig.totalRepayment) {
    application.status = 'CLOSED';
    application.closedAt = new Date();
    await application.save();
    logInfo(`application auto-closed: ${application._id} (fully repaid)`);
  }

  res.status(201).json({
    payment,
    application,
    outstandingBalance: Math.max(0, roundRupees(application.loanConfig.totalRepayment - newPaidTotal)),
  });
});

export const getApplicationPayments = asyncHandler(async (req: Request, res: Response) => {
  const application = await LoanApplication.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found.');

  const role = req.user!.role;
  const isOwner = application.borrower.toString() === req.user!.id;
  const isOps = role === 'ADMIN' || role === 'COLLECTION';
  if (!isOwner && !isOps) {
    throw ApiError.forbidden();
  }

  const payments = await Payment.find({ loanApplication: application._id }).sort({ paymentDate: -1 });
  const paidTotal = roundRupees(payments.reduce((sum, p) => sum + p.amount, 0));
  const outstandingBalance = Math.max(0, roundRupees(application.loanConfig.totalRepayment - paidTotal));

  res.status(200).json({ payments, paidTotal, outstandingBalance });
});

export const getSalarySlipFile = asyncHandler(async (req: Request, res: Response) => {
  const application = await LoanApplication.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found.');

  const role = req.user!.role;
  const isOwner = application.borrower.toString() === req.user!.id;
  const isOps = role === 'ADMIN' || ['SANCTION', 'DISBURSEMENT', 'COLLECTION'].includes(role);
  if (!isOwner && !isOps) {
    throw ApiError.forbidden();
  }

  // Storage is Cloudinary, not local disk - the access-control check above already
  // gated this, so it's safe to hand the caller straight to the CDN URL.
  res.redirect(application.salarySlip.filePath);
});
