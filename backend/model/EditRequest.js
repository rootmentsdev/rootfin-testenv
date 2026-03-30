import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true },
    invoiceNo:     { type: String, default: "" },
    locCode:       { type: String, required: true },
    requestedBy:   { type: String, required: true }, // email
    requestedByName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy:   { type: String, default: null },
    reviewedAt:   { type: Date,   default: null },
    rejectReason: { type: String, default: "" },

    // snapshot of what the admin wants to change TO
    newData: { type: mongoose.Schema.Types.Mixed, default: {} },
    // snapshot of original values
    oldData: { type: mongoose.Schema.Types.Mixed, default: {} },

    source: { type: String, default: "" }, // "daybook" | "billwise"
  },
  { timestamps: true }
);

const EditRequest = mongoose.model("EditRequest", editRequestSchema);
export default EditRequest;
