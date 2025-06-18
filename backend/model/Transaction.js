import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
      default: "",
    },
    amount: {
      type: String,
      required: true,
    },
    cash: {
      type: String,
      required: true,
    },
    bank: {
      type: String,
      required: true,
    },
    upi: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "upi", "split"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    locCode: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      default: ""
    },

    // ✅ NEW FIELD
    customerName: {
      type: String,
      default: "", // optional fallback
    },
  },
  { timestamps: true }
);


const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
