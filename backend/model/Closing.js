import mongoose from "mongoose";

const CloseSchema = new mongoose.Schema(
    {

        cash: {
            type: Number,
            required: true,
        },
        Closecash: {
            type: Number,
            required: true,
        },
        bank: {
            type: Number,
            required: true,
        },
        Closebank: {
            type: Number,
            default: 0,
        },
        Closeupi: {
            type: Number,
            default: 0,
        },

        date: {
            type: Date,
            required: true,
        },
        locCode: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

const CloseTransaction = mongoose.model("Close", CloseSchema);
export default CloseTransaction;
