
import Transaction from "../model/Transaction.js";



export const CreatePayment = async (req, res) => {
    try {
        const {
            type,
            category,
            remark,
            amount,
            cash,
            bank,
            upi,
            paymentMethod,
            locCode,
            quantity,
            date,
            invoiceNo,
            isSecurityReturn // 🆕 From frontend
        } = req.body;

        console.log(type, category, remark, amount, cash, bank, upi, paymentMethod, locCode, date);

        // ✅ Validate required fields
        if (
            !type ||
            !category ||
            !amount ||
            cash === undefined ||
            upi === undefined ||
            bank === undefined ||
            !paymentMethod ||
            !date ||
            !locCode
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ✅ New logic: Allow skip invoiceNo for security return or money transfer
        const isMoneyTransfer =
            type === "money transfer" &&
            (category === "Cash to Bank" || category === "Bank to Cash");

        if (!invoiceNo && !isSecurityReturn && !isMoneyTransfer) {
            return res.status(400).json({ message: "invoiceNo is required for this transaction type." });
        }

        // ✅ Prepare transaction object
        const newTransaction = new Transaction({
            type,
            category,
            remark,
            amount,
            quantity,
            cash,
            bank,
            upi,
            locCode,
            paymentMethod,
            date,
            ...(invoiceNo && { invoiceNo }) // add only if present
        });

        // ✅ Save transaction
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);

    } catch (error) {
        console.error("CreatePayment error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};





// export const CreatePayment = async (req, res) => {
//     try {
//         const {
//             type,
//             category,
//             remark,
//             amount,
//             cash,
//             bank,
//             upi,
//             paymentMethod,
//             locCode,
//             quantity,
//             date,
//             invoiceNo,
//             isSecurityReturn  // 🆕 Received from frontend
//         } = req.body;

//         console.log(type, category, remark, amount, cash, bank, upi, paymentMethod, locCode, date);

//         // ✅ Validate required fields
//         if (
//             !type ||
//             !category ||
//             !amount ||
//             cash === undefined ||
//             upi === undefined ||
//             bank === undefined ||
//             !paymentMethod ||
//             !date ||
//             !locCode
//         ) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         // ✅ Only enforce invoiceNo if not a Security Return
//         if (!invoiceNo && !isSecurityReturn) {
//             return res.status(400).json({ message: "invoiceNo is required for this transaction type." });
//         }

//         // ✅ Prepare new transaction object
//         const newTransaction = new Transaction({
//             type,
//             category,
//             remark,
//             amount,
//             quantity,
//             cash,
//             bank,
//             upi,
//             locCode,
//             paymentMethod,
//             date,
//             ...(invoiceNo && { invoiceNo })  // only add invoiceNo if present
//         });

//         // ✅ Save transaction
//         const savedTransaction = await newTransaction.save();
//         res.status(201).json(savedTransaction);

//     } catch (error) {
//         console.error("CreatePayment error:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };


export const GetPayment = async (req, res) => {
    try {
        const { LocCode, DateFrom, DateTo } = req.query;

        if (!LocCode) {
            return res.status(400).json({ message: "'LocCode' is required" });
        }

        if (!DateFrom || !DateTo) {
            return res.status(400).json({ message: "Both 'DateFrom' and 'DateTo' are required" });
        }

        // Convert to Date objects and normalize to start and end of the day
        const fromDate = new Date(DateFrom);
        const toDate = new Date(DateTo);

        fromDate.setUTCHours(0, 0, 0, 0); // Start of the day
        toDate.setUTCHours(23, 59, 59, 999); // End of the day

        // Query transactions based on LocCode and Date Range
        const transactions = await Transaction.find({
             locCode: String(req.query.LocCode), // Match location code
            date: { $gte: fromDate, $lte: toDate }, // Match date range
        }).sort({ date: -1 });

        res.status(200).json({
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
        
    }
};





