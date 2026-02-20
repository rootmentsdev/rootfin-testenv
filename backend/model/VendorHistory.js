import mongoose from "mongoose";

const vendorHistorySchema = new mongoose.Schema(
  {
    vendorId: {
      type: String, // Can be MongoDB ObjectId or UUID string
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'BILL_ADDED',
        'BILL_UPDATED',
        'BILL_DELETED',
        'CONTACT_ADDED',
        'CONTACT_PERSON_ADDED',
        'CONTACT_PERSON_UPDATED',
        'VENDOR_CREATED',
        'VENDOR_UPDATED',
        'PAYMENT_MADE',
        'VENDOR_CREDIT_ADDED',
        'VENDOR_CREDIT_UPDATED'
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    originator: {
      type: String,
      required: true,
      default: 'System',
      trim: true,
    },
    relatedEntityId: {
      type: String, // Can be bill ID, contact person ID, etc.
      default: null,
    },
    relatedEntityType: {
      type: String, // "bill", "contact_person", "vendor_credit", etc.
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    changedBy: {
      type: String,
      default: '',
      trim: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
vendorHistorySchema.index({ vendorId: 1, changedAt: -1 });
vendorHistorySchema.index({ eventType: 1 });
vendorHistorySchema.index({ vendorId: 1, eventType: 1 });

const VendorHistory = mongoose.model("VendorHistory", vendorHistorySchema);
export default VendorHistory;