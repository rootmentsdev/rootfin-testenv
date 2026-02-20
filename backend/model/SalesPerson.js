import mongoose from "mongoose";

const salesPersonSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      default: "-",
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      comment: 'Unique employee ID for the sales person',
    },
    email: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function(v) {
          if (v && v.trim() !== '') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          }
          return true;
        },
        message: 'Please provide a valid email address'
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      default: "0000000000",
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      comment: 'Reference to Store - determines which store this sales person belongs to',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
salesPersonSchema.index({ storeId: 1 });
salesPersonSchema.index({ employeeId: 1 });
salesPersonSchema.index({ isActive: 1 });
salesPersonSchema.index({ storeId: 1, isActive: 1 });

const SalesPerson = mongoose.model("SalesPerson", salesPersonSchema);
export default SalesPerson;