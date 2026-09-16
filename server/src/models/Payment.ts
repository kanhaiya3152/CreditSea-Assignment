import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  loanApplication: Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loanApplication: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    utrNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

paymentSchema.index({ loanApplication: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
