// models/TwsTransaction.js
import mongoose from 'mongoose';

const twsTransactionSchema = new mongoose.Schema({
  invoiceNo: String,
  // locCode: Number, ❌ REMOVE THIS if it's not in the API
  date: String,
  cash: Number,
  bank: Number,
  upi: Number,
  customerName: String,
  Category: String,
  SubCategory: String,
  remark: String,
  amount: Number,
  originalData: mongoose.Schema.Types.Mixed
});

export default mongoose.model('TwsTransaction', twsTransactionSchema);
