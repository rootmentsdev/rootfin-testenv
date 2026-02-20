import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    locCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      comment: 'Location code (e.g., "EDAPALLY")',
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    pinCode: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function(v) {
          // Only validate email format if email is provided (allow empty strings)
          if (v && v.trim() !== '') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          }
          return true;
        },
        message: 'Please provide a valid email address'
      },
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
storeSchema.index({ name: 1 });
storeSchema.index({ locCode: 1 });
storeSchema.index({ isActive: 1 });

const Store = mongoose.model("Store", storeSchema);
export default Store;