import mongoose from "mongoose";

const salesInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    customer: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "Head Office",
    },
    orderNumber: {
      type: String,
      default: "",
    },
    terms: {
      type: String,
      default: "Due on Receipt",
    },
    salesperson: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    warehouse: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    subCategory: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    paymentAmounts: {
      Cash: { type: Number, default: 0 },
      UPI: { type: Number, default: 0 },
      Bank: { type: Number, default: 0 },
      RBL: { type: Number, default: 0 },
    },
    lineItems: [
      {
        item: String,
        itemData: mongoose.Schema.Types.Mixed,
        itemGroupId: String,
        itemSku: String,
        size: String,
        quantity: Number,
        rate: Number,
        tax: String,
        amount: Number,
      },
    ],
    customerNotes: {
      type: String,
      default: "Thanks for your business.",
    },
    remark: {
      type: String,
      default: "",
    },
    refundMode: {
      type: String,
      enum: ["cash", "rbl"],
      default: "cash",
    },
    termsAndConditions: {
      type: String,
      default: "",
    },
    discount: {
      value: { type: String, default: "0" },
      type: { type: String, default: "%" },
    },
    applyDiscountAfterTax: {
      type: Boolean,
      default: false,
    },
    tdsTcsType: {
      type: String,
      enum: ["TDS", "TCS"],
      default: "TDS",
    },
    tdsTcsTax: {
      type: String,
      default: "",
    },
    adjustment: {
      type: String,
      default: "0.00",
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    tdsTcsAmount: {
      type: Number,
      default: 0,
    },
    adjustmentAmount: {
      type: Number,
      default: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },
    returnStatus: {
      type: String,
      enum: ["none", "partial", "full"],
      default: "none",
    },
    userId: {
      type: String,
      required: true,
    },
    locCode: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for faster queries
salesInvoiceSchema.index({ userId: 1, createdAt: -1 });
salesInvoiceSchema.index({ invoiceNumber: 1 });

const SalesInvoice = mongoose.model("SalesInvoice", salesInvoiceSchema);
export default SalesInvoice;

