// backend/cont/TransactionController.js
import Transaction from "../model/Transaction.js";
import { nextInvoice } from "../utlis/nextInvoice.js";


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
      invoiceNo,        // may be omitted
      isSecurityReturn
    } = req.body;

    /* ───────── basic validation ───────── */
    if (
      !type || !category || !amount ||
      cash === undefined || bank === undefined || upi === undefined ||
      !paymentMethod || !date || !locCode
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* ───────── decide if we need an invoice ───────── */
    const isMoneyTransfer =
      type === "money transfer" &&
      (category === "Cash to Bank" || category === "Bank to Cash");

    let finalInvoice = invoiceNo;           // keep client’s value if sent
    if (!finalInvoice && !isSecurityReturn && !isMoneyTransfer) {
      // Generate the next unique invoice number for this locCode
      finalInvoice = await nextInvoice(locCode);
    }

    /* ───────── create & save ───────── */
    const newTx = await Transaction.create({
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
      invoiceNo: finalInvoice            // always populated now
    });

    return res.status(201).json(newTx);

  } catch (err) {
    console.error("CreatePayment error:", err);
    // Duplicate invoice guard (unique index)
    if (err.code === 11000 && err.keyPattern?.invoiceNo) {
      return res.status(409).json({ message: "Duplicate invoice number" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






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





