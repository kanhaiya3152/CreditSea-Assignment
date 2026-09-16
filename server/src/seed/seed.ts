import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { LoanApplication } from '../models/LoanApplication';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { computeLoanFigures } from '../services/loanMath.service';
import { hashPassword } from '../services/auth.service';
import { Role } from '../utils/constants';

interface SeedAccount {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

const FIXED_ACCOUNTS: SeedAccount[] = [
  { fullName: 'Ananya Rao', email: 'admin@lms.test', password: 'Admin@123', role: 'ADMIN' },
  { fullName: 'Vikram Shah', email: 'sales@lms.test', password: 'Sales@123', role: 'SALES' },
  { fullName: 'Priya Menon', email: 'sanction@lms.test', password: 'Sanction@123', role: 'SANCTION' },
  { fullName: 'Rahul Kapoor', email: 'disbursement@lms.test', password: 'Disbursement@123', role: 'DISBURSEMENT' },
  { fullName: 'Neha Joshi', email: 'collection@lms.test', password: 'Collection@123', role: 'COLLECTION' },
  { fullName: 'Amit Verma', email: 'borrower@lms.test', password: 'Borrower@123', role: 'BORROWER' },
];

// Demo borrowers covering each stage of the lifecycle, beyond the fixed borrower@lms.test account.
const DEMO_BORROWERS = [
  { fullName: 'Kavita Nair', email: 'lead.kavita@lms.test' }, // lead only, no application
  { fullName: 'Suresh Iyer', email: 'applied.suresh@lms.test' },
  { fullName: 'Deepika Pillai', email: 'sanctioned.deepika@lms.test' },
  { fullName: 'Arjun Malhotra', email: 'disbursed.arjun@lms.test' },
  { fullName: 'Sneha Reddy', email: 'closed.sneha@lms.test' },
  { fullName: 'Manoj Tiwari', email: 'rejected.manoj@lms.test' },
];

const DEMO_PASSWORD = 'Demo@123';

function agePAN(seed: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = (i: number) => letters[(seed + i * 7) % 26];
  const digits = String(1000 + (seed * 137) % 9000);
  return `${l(1)}${l(2)}${l(3)}${l(4)}${l(5)}${digits}${l(6)}`;
}

function dobForAge(age: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - age, today.getMonth(), today.getDate() - 15);
}

async function run(): Promise<void> {
  await connectDB();

  console.log('[seed] wiping existing data...');
  await Promise.all([User.deleteMany({}), LoanApplication.deleteMany({}), Payment.deleteMany({})]);

  console.log('[seed] creating fixed role accounts...');
  const fixedUsers: Record<string, InstanceType<typeof User>> = {};
  for (const acc of FIXED_ACCOUNTS) {
    const passwordHash = await hashPassword(acc.password);
    const user = await User.create({ fullName: acc.fullName, email: acc.email, passwordHash, role: acc.role });
    fixedUsers[acc.role] = user;
  }

  console.log('[seed] creating demo borrowers...');
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);
  const demoUsers = await Promise.all(
    DEMO_BORROWERS.map((b) =>
      User.create({ fullName: b.fullName, email: b.email, passwordHash: demoPasswordHash, role: 'BORROWER' }),
    ),
  );
  const [lead, appliedBorrower, sanctionedBorrower, disbursedBorrower, closedBorrower, rejectedBorrower] = demoUsers;
  void lead; // intentionally left with no application - this is the "lead" case

  const sanctionUser = fixedUsers.SANCTION;
  const disbursementUser = fixedUsers.DISBURSEMENT;
  const collectionUser = fixedUsers.COLLECTION;

  const salarySlipStub = (label: string) => ({
    fileName: `${label}-salary-slip.pdf`,
    filePath: `seed-${label}.pdf`,
    mimeType: 'application/pdf',
    sizeBytes: 245_000,
    uploadedAt: new Date(),
  });

  console.log('[seed] creating APPLIED application...');
  await LoanApplication.create({
    borrower: appliedBorrower._id,
    personalDetails: {
      fullName: appliedBorrower.fullName,
      pan: agePAN(1),
      dateOfBirth: dobForAge(29),
      monthlySalary: 42000,
      employmentMode: 'SALARIED',
    },
    breResult: { passed: true, failedRules: [], evaluatedAt: new Date() },
    salarySlip: salarySlipStub('applied'),
    loanConfig: computeLoanFigures(150000, 180),
    status: 'APPLIED',
    appliedAt: new Date(),
  });

  console.log('[seed] creating SANCTIONED application...');
  await LoanApplication.create({
    borrower: sanctionedBorrower._id,
    personalDetails: {
      fullName: sanctionedBorrower.fullName,
      pan: agePAN(2),
      dateOfBirth: dobForAge(34),
      monthlySalary: 55000,
      employmentMode: 'SALARIED',
    },
    breResult: { passed: true, failedRules: [], evaluatedAt: new Date() },
    salarySlip: salarySlipStub('sanctioned'),
    loanConfig: computeLoanFigures(200000, 120),
    status: 'SANCTIONED',
    appliedAt: new Date(Date.now() - 5 * 86400000),
    sanctionedAt: new Date(Date.now() - 3 * 86400000),
    sanctionedBy: sanctionUser._id,
  });

  console.log('[seed] creating DISBURSED application with a partial payment...');
  const disbursedLoanConfig = computeLoanFigures(300000, 240);
  const disbursedApp = await LoanApplication.create({
    borrower: disbursedBorrower._id,
    personalDetails: {
      fullName: disbursedBorrower.fullName,
      pan: agePAN(3),
      dateOfBirth: dobForAge(41),
      monthlySalary: 68000,
      employmentMode: 'SELF_EMPLOYED',
    },
    breResult: { passed: true, failedRules: [], evaluatedAt: new Date() },
    salarySlip: salarySlipStub('disbursed'),
    loanConfig: disbursedLoanConfig,
    status: 'DISBURSED',
    appliedAt: new Date(Date.now() - 20 * 86400000),
    sanctionedAt: new Date(Date.now() - 18 * 86400000),
    sanctionedBy: sanctionUser._id,
    disbursedAt: new Date(Date.now() - 15 * 86400000),
    disbursedBy: disbursementUser._id,
  });
  await Payment.create({
    loanApplication: disbursedApp._id,
    utrNumber: 'UTR000DISB01',
    amount: Math.round(disbursedLoanConfig.totalRepayment * 0.4),
    paymentDate: new Date(Date.now() - 5 * 86400000),
    recordedBy: collectionUser._id,
  });

  console.log('[seed] creating CLOSED application (fully paid)...');
  const closedLoanConfig = computeLoanFigures(100000, 90);
  const closedApp = await LoanApplication.create({
    borrower: closedBorrower._id,
    personalDetails: {
      fullName: closedBorrower.fullName,
      pan: agePAN(4),
      dateOfBirth: dobForAge(27),
      monthlySalary: 38000,
      employmentMode: 'SALARIED',
    },
    breResult: { passed: true, failedRules: [], evaluatedAt: new Date() },
    salarySlip: salarySlipStub('closed'),
    loanConfig: closedLoanConfig,
    status: 'DISBURSED',
    appliedAt: new Date(Date.now() - 100 * 86400000),
    sanctionedAt: new Date(Date.now() - 95 * 86400000),
    sanctionedBy: sanctionUser._id,
    disbursedAt: new Date(Date.now() - 90 * 86400000),
    disbursedBy: disbursementUser._id,
  });
  await Payment.create({
    loanApplication: closedApp._id,
    utrNumber: 'UTR000CLOSE1',
    amount: closedLoanConfig.totalRepayment,
    paymentDate: new Date(Date.now() - 10 * 86400000),
    recordedBy: collectionUser._id,
  });
  closedApp.status = 'CLOSED';
  closedApp.closedAt = new Date(Date.now() - 10 * 86400000);
  await closedApp.save();

  console.log('[seed] creating REJECTED application...');
  await LoanApplication.create({
    borrower: rejectedBorrower._id,
    personalDetails: {
      fullName: rejectedBorrower.fullName,
      pan: agePAN(5),
      dateOfBirth: dobForAge(30),
      monthlySalary: 27000,
      employmentMode: 'SALARIED',
    },
    breResult: { passed: true, failedRules: [], evaluatedAt: new Date() },
    salarySlip: salarySlipStub('rejected'),
    loanConfig: computeLoanFigures(80000, 60),
    status: 'REJECTED',
    appliedAt: new Date(Date.now() - 10 * 86400000),
    rejectionReason: 'Salary slip does not match the declared monthly salary for the last 3 months.',
    rejectedAt: new Date(Date.now() - 8 * 86400000),
    rejectedBy: sanctionUser._id,
  });

  console.log('[seed] done.');
  console.log('\nSeeded accounts:');
  for (const acc of FIXED_ACCOUNTS) {
    console.log(`  ${acc.role.padEnd(12)} ${acc.email.padEnd(24)} ${acc.password}`);
  }
  console.log(`  Demo borrowers password: ${DEMO_PASSWORD} (e.g. ${DEMO_BORROWERS[0].email})`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
