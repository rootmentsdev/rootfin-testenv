// backend/cont/TransactionController.js
import Transaction from "../model/Transaction.js";
import { nextInvoice } from "../utlis/nextInvoice.js";
import parseBase64  from "../utlis/parseBase64.js";  
// CommonJS style



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
      isSecurityReturn,
      attachment        // 🔺 ADDED  (base-64 string from React)
    } = req.body;

    /* ───────── basic validation ───────── */
    if (
      !type || !category || !amount ||
      cash === undefined || bank === undefined || upi === undefined ||
      !paymentMethod || !date || !locCode
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* income must include an attachment (same rule as frontend) */
    if (type === "Expense" && !attachment) {
      return res.status(400).json({ message: "Attachment required for expense" });
    }

    /* ───────── decide if we need an invoice ───────── */
    const isMoneyTransfer =
      type === "money transfer" &&
      (category === "Cash to Bank" || category === "Bank to Cash");

    let finalInvoice = invoiceNo; // keep client’s invoice if sent

    if (!finalInvoice) {
      if (isSecurityReturn) {
        finalInvoice = `SECURITY-${locCode}-${Date.now()}`;
      } else if (isMoneyTransfer) {
        finalInvoice = `TRANSFER-${locCode}-${Date.now()}`;
      } else {
        finalInvoice = await nextInvoice(locCode);
      }
    }

    /* ───────── decode the attachment (if any) ───────── */
    let attachmentObj = undefined;                // 🔺 ADDED
    if (attachment) {
      try {
        attachmentObj = parseBase64(attachment);  // { filename, contentType, data }
      } catch (err) {
        return res.status(400).json({ message: "Invalid attachment data" });
      }
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
      invoiceNo: finalInvoice,
      attachment: attachmentObj                     // 🔺 ADDED
    });

    res.status(201).json(newTx);

  } catch (err) {
    console.error("CreatePayment error:", err);
    if (err.code === 11000 && err.keyPattern?.invoiceNo) {
      return res.status(409).json({ message: "Duplicate invoice number" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/* ========= download route handler (keep in same file or split) ========= */
export const DownloadAttachment = async (req, res) => {
  try {
    const tx = await Transaction
      .findById(req.params.id)
      .select("attachment");

    if (!tx || !tx.attachment || !tx.attachment.data) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res
      .set({
        "Content-Type":        tx.attachment.contentType,
        "Content-Disposition": `attachment; filename="${tx.attachment.filename}"`
      })
      .send(tx.attachment.data);
  } catch (err) {
    res.status(500).json({ message: "Download failed", error: err.message });
  }
};






export const GetPayment = async (req, res) => {
    try {
        const { LocCode, DateFrom, DateTo } = req.query;

        console.log(`\n📊 GetPayment Request:`);
        console.log(`   LocCode: "${LocCode}"`);
        console.log(`   DateFrom: "${DateFrom}"`);
        console.log(`   DateTo: "${DateTo}"`);

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

        console.log(`   Parsed fromDate: ${fromDate.toISOString()}`);
        console.log(`   Parsed toDate: ${toDate.toISOString()}`);

        // Query transactions based on LocCode and Date Range
        const transactions = await Transaction.find({
             locCode: String(req.query.LocCode), // Match location code
            date: { $gte: fromDate, $lte: toDate }, // Match date range
        })
        .sort({ date: -1 })
        .allowDiskUse(true);

        console.log(`   Found ${transactions.length} transactions`);
        if (transactions.length > 0) {
            console.log(`   Sample transaction locCodes: ${transactions.slice(0, 3).map(t => t.locCode).join(", ")}`);
            console.log(`   Sample transaction categories: ${transactions.slice(0, 3).map(t => t.category).join(", ")}`);
            console.log(`   Sample transaction invoiceNos: ${transactions.slice(0, 3).map(t => t.invoiceNo).join(", ")}`);
            console.log(`   Sample full transactions: ${JSON.stringify(transactions.slice(0, 2), null, 2)}`);
        } else {
            // Debug: Check what transactions exist in the database
            console.log(`   ⚠️ No transactions found. Checking all transactions in DB...`);
            const allTransactions = await Transaction.find({}).limit(5);
            console.log(`   Total transactions in DB: ${await Transaction.countDocuments()}`);
            if (allTransactions.length > 0) {
                console.log(`   Sample all transactions: ${JSON.stringify(allTransactions.slice(0, 2), null, 2)}`);
            }
        }

        res.status(200).json({
            data: transactions
        });
    } catch (error) {
        console.error("GetPayment error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
        
    }
};





