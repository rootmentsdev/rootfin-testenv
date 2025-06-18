// // controllers/EditController.js

// import Transaction from "../model/Transaction.js";
// import TransactionHistory from "../model/Transactionhistory.js";

// export const editTransaction = async (req, res) => {
//   try {
//     // ✅ MOCK USER — replace with real auth logic in production
//     req.user = {
//       _id: "000000000000000000000000",
//       power: "super_admin",
//       locCode: "Zorucci-Kochi"
//     };

//     const transactionId = req.params.id;
//     const updates = req.body;
//     const reason = req.body.editReason || 'No reason provided';
//     const user = req.user;

//     // 1. Role validation
//     if (user.power !== 'admin' && user.power !== 'super_admin') {
//       return res.status(403).json({ message: "Access denied: only admins can edit transactions." });
//     }

//     // 2. Get original transaction
//     const originalTransaction = await Transaction.findById(transactionId);
//     if (!originalTransaction) {
//       return res.status(404).json({ message: "Transaction not found." });
//     }

//     // 3. Admins can only edit their branch's data
//     if (user.power === 'admin' && user.locCode !== originalTransaction.locCode) {
//       return res.status(403).json({ message: "Admins can only edit transactions from their own branch." });
//     }

//     // 4. Calculate updated amounts
//     const { cash = 0, bank = 0, upi = 0 } = updates;
//     const amount = Number(cash) + Number(bank) + Number(upi);

//     updates.amount = amount;

//     const invoice = updates.invoiceNo || originalTransaction.invoiceNo; // 🛠️ Ensure fallback if not passed

//     // 5. Save to history
//     await TransactionHistory.create({
//       originalTransactionId: originalTransaction._id,
//       invoiceNo: invoice,
//       historyType: "EDIT",
//       changedBy: user._id,
//       reason,
//       oldData: originalTransaction.toObject(),
//       newData: { ...originalTransaction.toObject(), ...updates },
//     });

//     // 6. Update transaction
//     const updatedTransaction = await Transaction.findByIdAndUpdate(
//       transactionId,
//       {
//         ...updates,
//         invoiceNo: invoice, // 🧠 make sure it's included
//         editedBy: user._id,
//         editedAt: new Date(),
//         editReason: reason,
//       },
//       { new: true }
//     );

//     // 7. Respond
//     return res.status(200).json({
//       message: "Transaction updated successfully",
//       data: updatedTransaction,
//     });

//   } catch (error) {
//     console.error("Edit transaction error:", error);
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };




// controllers/EditController.js

// import Transaction from "../model/Transaction.js";
// import TransactionHistory from "../model/Transactionhistory.js";

// export const editTransaction = async (req, res) => {
//   try {
//     // ✅ MOCK USER — replace with real auth logic in production
//     req.user = {
//       _id: "000000000000000000000000",
//       power: "super_admin",
//       locCode: "Zorucci-Kochi"
//     };

//     const transactionId = req.params.id;
//     const updates = req.body;
//     const reason = req.body.editReason || 'No reason provided';
//     const user = req.user;

//     // 1. Role validation
//     if (user.power !== 'admin' && user.power !== 'super_admin') {
//       return res.status(403).json({ message: "Access denied: only admins can edit transactions." });
//     }

//     // 2. Get original transaction
//     const originalTransaction = await Transaction.findById(transactionId);
//     if (!originalTransaction) {
//       return res.status(404).json({ message: "Transaction not found." });
//     }

//     // 3. Admins can only edit their branch's data
//     if (user.power === 'admin' && user.locCode !== originalTransaction.locCode) {
//       return res.status(403).json({ message: "Admins can only edit transactions from their own branch." });
//     }

//     // 4. Calculate updated amounts
//     const { cash = 0, bank = 0, upi = 0 } = updates;
//     const amount = Number(cash) + Number(bank) + Number(upi);

//     updates.amount = amount;

//     // 5. Ensure invoiceNo is preserved or updated
//     const invoice = updates.invoiceNo || originalTransaction.invoiceNo;
//     updates.invoiceNo = invoice; // 🧠 required so the override logic matches on frontend

//     // 6. Save to transaction history
//     await TransactionHistory.create({
//       originalTransactionId: originalTransaction._id,
//       invoiceNo: invoice,
//       historyType: "EDIT",
//       changedBy: user._id,
//       reason,
//       oldData: originalTransaction.toObject(),
//       newData: { ...originalTransaction.toObject(), ...updates },
//     });

//     // 7. Update transaction
//     const updatedTransaction = await Transaction.findByIdAndUpdate(
//       transactionId,
//       {
//         ...updates,
//         invoiceNo: invoice,
//         editedBy: user._id,
//         editedAt: new Date(),
//         editReason: reason,
//       },
//       { new: true }
//     );

//     // 8. Respond with updated transaction
//     return res.status(200).json({
//       message: "Transaction updated successfully",
//       data: updatedTransaction,
//     });

//   } catch (error) {
//     console.error("Edit transaction error:", error);
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };


import Transaction from "../model/Transaction.js";
import TransactionHistory from "../model/Transactionhistory.js";

// -------------------------------
// 1. EDIT TRANSACTION
// -------------------------------
export const editTransaction = async (req, res) => {
  try {
    // 🔐 TEMP MOCK USER (replace with real auth)
    req.user = {
      _id: "000000000000000000000000",
      power: "super_admin",
      locCode: "Zorucci-Kochi"
    };

    const transactionId = req.params.id;
    const updates = req.body;
    const reason = req.body.editReason || 'No reason provided';
    const user = req.user;

    // 1. Role validation
    if (user.power !== 'admin' && user.power !== 'super_admin') {
      return res.status(403).json({ message: "Access denied: only admins can edit transactions." });
    }

    // 2. Find original
    const originalTransaction = await Transaction.findById(transactionId);
    if (!originalTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    // 3. Branch check for admins
    if (user.power === 'admin' && user.locCode !== originalTransaction.locCode) {
      return res.status(403).json({ message: "Admins can only edit transactions from their own branch." });
    }

    // 4. Recalculate amount
    const { cash = 0, bank = 0, upi = 0 } = updates;
    const amount = Number(cash) + Number(bank) + Number(upi);
    updates.amount = amount;

    // 5. Preserve invoiceNo
const invoice = updates.invoiceNo || originalTransaction.invoiceNo;
    updates.invoiceNo = invoice;

    // 6. Save history
    await TransactionHistory.create({
      originalTransactionId: originalTransaction._id,
      invoiceNo: invoice,
      historyType: "EDIT",
      changedBy: user._id,
      reason,
      oldData: originalTransaction.toObject(),
      newData: { ...originalTransaction.toObject(), ...updates },
    });

    // 7. Update transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        ...updates,
        invoiceNo: invoice,
        customerName: updates.customerName || originalTransaction.customerName || "",
        editedBy: user._id,
        editedAt: new Date(),
        editReason: reason,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });

  } catch (error) {
    console.error("Edit transaction error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// -------------------------------
// 2. GET EDITED TRANSACTIONS
// -------------------------------
export const getEditedTransactions = async (req, res) => {
  const { fromDate, toDate, locCode } = req.query;

  try {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0); 
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const edited = await Transaction.find({
      locCode,
      date: { $gte: from, $lte: to },
      editedBy: { $exists: true }
    });

    const formatted = edited.map(tx => ({
      ...tx._doc,
      invoiceNo: String(tx.invoiceNo).trim(),
        customerName: tx.customerName || "",
      cash: Number(tx.cash || 0),
      bank: Number(tx.bank || 0),
      upi: Number(tx.upi || 0),
      amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
      totalTransaction: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
    }));

    res.status(200).json({ data: formatted });

  } catch (err) {
    console.error("❌ getEditedTransactions error:", err.message);
    res.status(500).json({ message: "Error fetching edited transactions", error: err.message });
  }
};

