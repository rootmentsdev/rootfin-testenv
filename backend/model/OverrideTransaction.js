import mongoose from 'mongoose';

const overrideTransactionSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true },
  locCode: { type:Number, required: true },
  date: { type: String },
  cash: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  upi: { type: Number, default: 0 },
  overrideBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('OverrideTransaction', overrideTransactionSchema);
