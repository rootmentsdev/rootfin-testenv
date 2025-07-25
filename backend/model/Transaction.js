// import mongoose from "mongoose";

// const transactionSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       required: true,
//     },
//     invoiceNo: {
//       type: String,
//       required: true,
//       unique: true
//     },
//     category: {
//       type: String,
//       required: true,

//     },
//     remark: {
//       type: String,
//       default: "",
//     },
//     billValue: {
//   type: Number,
//   default: 0,
// },
//     amount: {
//       type: String,
//       required: true,
//     },
//     cash: {
//       type: String,
//       required: true,
//     },
//     bank: {
//       type: String,
//       required: true,
//     },
//     upi: {
//       type: String,
//       required: true,
//     },
//     paymentMethod: {
//       type: String,
//       enum: ["cash", "bank", "upi", "split"],
//       required: true,
//     },
//     date: {
//       type: Date,
//       required: true,
//     },
//     locCode: {
//       type: String,
//       required: true,
//     },
//     quantity: {
//       type: String,
//       default: ""
//     },

//     // ✅ NEW FIELD
//     customerName: {
//       type: String,
//       default: "", // optional fallback
//     },
//     securityAmount: 
//     { type: Number,
//        default: 0 },

// Balance:
//  { type: Number, 
//   default: 0 },


//   subCategory1: {
//   type: String,
//   default: "",   // ← helps prevent undefined values
// },

// totalTransaction: {
//   type: Number,
//   default: 0
// },



//   },
//   { timestamps: true }
// );


// const Transaction = mongoose.model("Transaction", transactionSchema);
// export default Transaction;



import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type:         { type: String, required: true },

    invoiceNo:    { type: String, required: true, unique: true },

    category:     { type: String, required: true },

    remark:       { type: String, default: "" },

    billValue:    { type: Number, default: 0 },

    amount:       { type: String,  required: true },

    cash:         { type: String,  required: true },
    bank:         { type: String,  required: true },
    upi:          { type: String,  required: true },

    paymentMethod:{ type: String,  enum: ["cash","bank","upi","split"], required: true },

    date:         { type: Date,    required: true },

    locCode:      { type: String,  required: true },

    quantity:     { type: String,  default: "" },

    /* existing extras */
    customerName:    { type: String, default: "" },
    securityAmount:  { type: Number, default: 0 },
    Balance:         { type: Number, default: 0 },
    subCategory1:    { type: String, default: "" },
    totalTransaction:{ type: Number, default: 0 },

    /* 🔺 NEW – stores the uploaded file inside MongoDB */
    attachment: {
      filename:    { type: String },
      contentType: { type: String },
      data:        { type: Buffer }   // binary data (base-64 decoded)
    }
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
