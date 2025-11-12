import mongoose from "mongoose";

const ItemGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    itemType: {
      type: String,
      enum: ["goods", "service"],
      default: "goods",
    },
    description: {
      type: String,
      trim: true,
    },
    returnable: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    taxPreference: {
      type: String,
      enum: ["taxable", "non-taxable"],
      default: "taxable",
    },
    intraStateTaxRate: {
      type: String,
      trim: true,
    },
    interStateTaxRate: {
      type: String,
      trim: true,
    },
    inventoryValuationMethod: {
      type: String,
      trim: true,
    },
    createAttributes: {
      type: Boolean,
      default: true,
    },
    attributeRows: [
      {
        attribute: {
          type: String,
          trim: true,
        },
        options: [{
          type: String,
          trim: true,
        }],
      },
    ],
    sellable: {
      type: Boolean,
      default: true,
    },
    purchasable: {
      type: Boolean,
      default: true,
    },
    trackInventory: {
      type: Boolean,
      default: false,
    },
    items: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        sku: {
          type: String,
          trim: true,
        },
        costPrice: {
          type: Number,
          default: 0,
        },
        sellingPrice: {
          type: Number,
          default: 0,
        },
        upc: {
          type: String,
          trim: true,
        },
        hsnCode: {
          type: String,
          trim: true,
        },
        isbn: {
          type: String,
          trim: true,
        },
        reorderPoint: {
          type: String,
          trim: true,
        },
        sac: {
          type: String,
          trim: true,
        },
        stock: {
          type: Number,
          default: 0,
        },
        attributeCombination: [{
          type: String,
        }],
      },
    ],
    stock: {
      type: Number,
      default: 0,
    },
    reorder: {
      type: String,
      trim: true,
    },
    images: [{
      type: String,
    }],
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ItemGroup = mongoose.model("ItemGroup", ItemGroupSchema);

export default ItemGroup;

