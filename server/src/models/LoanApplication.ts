import { Schema, model, Document, Types } from 'mongoose';
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  BRE_RULES,
  BreRule,
  EMPLOYMENT_MODES,
  EmploymentMode,
} from '../utils/constants';

export interface IPersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface IBreResult {
  passed: boolean;
  failedRules: BreRule[];
  evaluatedAt: Date;
}

export interface ISalarySlip {
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface ILoanConfig {
  principal: number;
  tenureDays: number;
  interestRatePct: number;
  simpleInterest: number;
  totalRepayment: number;
}

export interface ILoanApplication extends Document {
  _id: Types.ObjectId;
  borrower: Types.ObjectId;
  personalDetails: IPersonalDetails;
  breResult: IBreResult;
  salarySlip: ISalarySlip;
  loanConfig: ILoanConfig;
  status: ApplicationStatus;
  rejectionReason?: string;
  appliedAt: Date;
  sanctionedAt?: Date;
  sanctionedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  disbursedAt?: Date;
  disbursedBy?: Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const personalDetailsSchema = new Schema<IPersonalDetails>(
  {
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: { type: String, enum: EMPLOYMENT_MODES, required: true },
  },
  { _id: false },
);

const breResultSchema = new Schema<IBreResult>(
  {
    passed: { type: Boolean, required: true },
    failedRules: [{ type: String, enum: BRE_RULES }],
    evaluatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

const loanConfigSchema = new Schema<ILoanConfig>(
  {
    principal: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRatePct: { type: Number, required: true },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
  },
  { _id: false },
);

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    personalDetails: { type: personalDetailsSchema, required: true },
    breResult: { type: breResultSchema, required: true },
    salarySlip: { type: salarySlipSchema, required: true },
    loanConfig: { type: loanConfigSchema, required: true },
    status: { type: String, enum: APPLICATION_STATUSES, required: true, default: 'APPLIED' },
    rejectionReason: { type: String },
    appliedAt: { type: Date, required: true, default: Date.now },
    sanctionedAt: { type: Date },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

loanApplicationSchema.index({ borrower: 1 });
loanApplicationSchema.index({ status: 1 });

export const LoanApplication = model<ILoanApplication>('LoanApplication', loanApplicationSchema);
