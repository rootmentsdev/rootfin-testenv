import mongoose from "mongoose";

const purchaseReceiveSchema = new mongoose.Schema(
  {
    // Purchase Order Reference
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    purchaseOrderNumber: { type: String, required: true },
    
    // Vendor Information
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    vendorName: { type: String, default: "" },
    
    // Receive Details
    receiveNumber: { type: String, required: true, unique: true },
    receivedDate: { type: Date, required: true },
    
    // Items Received
    items: [{
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoeItem" },
      itemName: String,
      itemDescription: String,
      ordered: { type: Number, default: 0 }, // Quantity from purchase order
      received: { type: Number, default: 0 }, // Quantity received
      inTransit: { type: Number, default: 0 }, // Quantity in transit
      quantityToReceive: { type: Number, default: 0 }, // Remaining quantity to receive
    }],
    
    // Notes
    notes: { type: String, default: "" },
    
    // Attachments
    attachments: [{
      filename: String,
      contentType: String,
      data: Buffer,
    }],
    
    // User association
    userId: { type: String, required: true },
    locCode: { type: String, default: "" },
    
    // Status
    status: { type: String, default: "received" }, // "draft", "received"
  },
  { timestamps: true }
);

const PurchaseReceive = mongoose.model("PurchaseReceive", purchaseReceiveSchema);
export default PurchaseReceive;

