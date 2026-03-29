import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['transfer_order', 'store_order', 'delete_product', 'delete_item_group', 'create_branch', 'edit_branch', 'delete_branch'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedBy: { type: String, required: true }, // email
  requestedByName: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  // Reference to the entity being acted on
  entityId: { type: String, default: null },   // e.g. transfer order _id
  entityRef: { type: String, default: null },  // e.g. "TO-001"

  // Full payload to execute on approval
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Human-readable summary
  summary: { type: String, default: '' },
}, { timestamps: true });

const Approval = mongoose.model('Approval', approvalSchema);
export default Approval;
