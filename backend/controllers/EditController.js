

import Transaction from "../model/Transaction.js";
import TransactionHistory from "../model/Transactionhistory.js";
import CloseTransaction from "../model/Closing.js";



export const editTransaction = async (req, res) => {
  try {
    req.user = {
      _id: "000000000000000000000000",
      power: "super_admin",
      locCode: "Zorucci-Kochi"
    };

    const transactionId = req.params.id;
    const updates = req.body;
    const reason = req.body.editReason || 'No reason provided';
    const user = req.user;

    if (user.power !== 'admin' && user.power !== 'super_admin') {
      return res.status(403).json({ message: "Access denied: only admins can edit transactions." });
    }

    const originalTransaction = await Transaction.findById(transactionId);
    if (!originalTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    if (user.power === 'admin' && user.locCode !== originalTransaction.locCode) {
      return res.status(403).json({ message: "Admins can only edit transactions from their own branch." });
    }

    const {
      cash = 0,
      bank = 0,
      upi = 0,
      securityAmount = 0,
      Balance = 0
    } = updates;

    const isRentOut = originalTransaction.type === "RentOut";

    // 👇 Use split total if RentOut
    const amount = isRentOut
      ? Number(securityAmount) + Number(Balance)
      : Number(cash) + Number(bank) + Number(upi);

    updates.amount = amount;

    const invoice = updates.invoiceNo || originalTransaction.invoiceNo;
    updates.invoiceNo = invoice;

    // ✅ Retain security & balance
    updates.securityAmount = Number(securityAmount) || 0;
    updates.Balance = Number(Balance) || 0;
    if (isRentOut) {
  updates.subCategory1 = updates.subCategory1 || "Balance Payable";
} else {
  updates.subCategory1 = undefined; // 🧹 remove leftover if not RentOut
}


    const totalTransaction = isRentOut
      ? Number(securityAmount || 0) + Number(Balance || 0)
      : Number(cash || 0) + Number(bank || 0) + Number(upi || 0);

    updates.totalTransaction = totalTransaction;



    await TransactionHistory.create({
      originalTransactionId: originalTransaction._id,
      invoiceNo: invoice,
      historyType: "EDIT",
      changedBy: user._id,
      reason,
      oldData: originalTransaction.toObject(),
      newData: { ...originalTransaction.toObject(), ...updates },
    });

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

    const formatted = edited.map(tx => {
      const cash = Number(tx.cash || 0);
      const bank = Number(tx.bank || 0);
      const upi = Number(tx.upi || 0);
      const securityAmount = Number(tx.securityAmount || 0);
      const balance = Number(tx.Balance || 0);
      const isRentOut = tx.type === "RentOut";

      const computedTotal = isRentOut
        ? securityAmount + balance
        : cash + bank + upi;

      return {
        ...tx._doc,

        invoiceNo: String(tx.invoiceNo || "").trim(),
        customerName: tx.customerName || "",

        cash,
        bank,
        upi,

        securityAmount,
        Balance: balance,

        // ✅ Safe fallback: Only show Balance Payable for RentOut
        subCategory1: isRentOut ? (tx.subCategory1 || "Balance Payable") : "",

        amount: typeof tx.amount !== "undefined" ? Number(tx.amount) : computedTotal,
        totalTransaction: typeof tx.totalTransaction !== "undefined" ? Number(tx.totalTransaction) : computedTotal,
      };
    });

    res.status(200).json({ data: formatted });

  } catch (err) {
    console.error("❌ getEditedTransactions error:", err.message);
    res.status(500).json({ message: "Error fetching edited transactions", error: err.message });
  }
};


// -------------------------------
// 3. GET SAVE CASH/BANK (OPENING BALANCE)
// -------------------------------
// export const getsaveCashBank = async (req, res) => {
//   try {
//     const { locCode, date } = req.query;

//     if (!locCode || !date) {
//       return res.status(400).json({ message: "locCode and date are required" });
//     }

//     let formattedDate;
//     if (date.includes("-") && date.split("-")[0].length === 2) {
//       const [day, month, year] = date.split("-");
//       formattedDate = new Date(`${year}-${month}-${day}`);
//     } else {
//       formattedDate = new Date(date);
//     }

//     if (isNaN(formattedDate.getTime())) {
//       return res.status(400).json({ message: "Invalid date format." });
//     }

//     const result = await CloseTransaction.findOne({ locCode, date: formattedDate });

//     if (!result) {
//       return res.status(404).json({ message: "No closing balance found for this date." });
//     }

//     res.status(200).json({ data: result });

//   } catch (err) {
//     console.error("❌ getsaveCashBank Error:", err.message);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// };


// export const getsaveCashBank = async (req, res) => {
//   try {
//     const { locCode, date } = req.query;

//     if (!locCode || !date) {
//       return res.status(400).json({ message: "locCode and date are required" });
//     }

//     let formattedDate;
//     if (date.includes("-") && date.split("-")[0].length === 2) {
//       const [day, month, year] = date.split("-");
//       formattedDate = new Date(`${year}-${month}-${day}`);
//     } else {
//       formattedDate = new Date(date);
//     }

//     if (isNaN(formattedDate.getTime())) {
//       return res.status(400).json({ message: "Invalid date format." });
//     }

//     const startOfDay = new Date(formattedDate);
//     startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date(formattedDate);
//     endOfDay.setHours(23, 59, 59, 999);

//     const result = await CloseTransaction.findOne({
//       locCode,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });

//     if (!result) {
//       return res.status(404).json({ message: "No closing balance found for this date." });
//     }

//     res.status(200).json({ data: result });

//   } catch (err) {
//     console.error("❌ getsaveCashBank Error:", err.message);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// };



// export const getsaveCashBank = async (req, res) => {
//   try {
//     const { locCode, date } = req.query;

//     if (!locCode || !date) {
//       return res.status(400).json({ message: "locCode and date are required" });
//     }

//     let formattedDate;

//     // ✅ Universal date parsing
//     if (date.includes("-")) {
//       const parts = date.split("-");
//       if (parts[0].length === 4) {
//         // yyyy-mm-dd
//         formattedDate = new Date(date);
//       } else if (parts[2]?.length === 4) {
//         // dd-mm-yyyy
//         const [dd, mm, yyyy] = parts;
//         formattedDate = new Date(`${yyyy}-${mm}-${dd}`);
//       } else {
//         return res.status(400).json({ message: "Unrecognized date format." });
//       }
//     } else if (!isNaN(Date.parse(date))) {
//       // Fallback for valid parseable formats
//       formattedDate = new Date(date);
//     } else {
//       return res.status(400).json({ message: "Invalid date input." });
//     }

//     // ✅ Validate final result
//     if (isNaN(formattedDate.getTime())) {
//       return res.status(400).json({ message: "Invalid date format." });
//     }

//     // ✅ Match full day
//     const startOfDay = new Date(formattedDate);
//     startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date(formattedDate);
//     endOfDay.setHours(23, 59, 59, 999);

//     const result = await CloseTransaction.findOne({
//       locCode,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });

//     if (!result) {
//       return res.status(404).json({ message: "No closing balance found for this date." });
//     }

//     res.status(200).json({ data: result });

//   } catch (err) {
//     console.error("❌ getsaveCashBank Error:", err.message);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// };


export const getsaveCashBank = async (req, res) => {
  try {
    const { locCode, date } = req.query;

    if (!locCode || !date) {
      return res.status(400).json({ message: "locCode and date are required" });
    }

    let formattedDate;

    // ✅ Universal date parsing
    if (date.includes("-")) {
      const parts = date.split("-");
      if (parts[0].length === 4) {
        // yyyy-mm-dd
        formattedDate = new Date(date);
      } else if (parts[2]?.length === 4) {
        // dd-mm-yyyy
        const [dd, mm, yyyy] = parts;
        formattedDate = new Date(`${yyyy}-${mm}-${dd}`);
      } else {
        return res.status(400).json({ message: "Unrecognized date format." });
      }
    } else if (!isNaN(Date.parse(date))) {
      // Fallback for valid parseable formats
      formattedDate = new Date(date);
    } else {
      return res.status(400).json({ message: "Invalid date input." });
    }

    // ✅ Validate final result
    if (isNaN(formattedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // ✅ Match full day
    const startOfDay = new Date(formattedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await CloseTransaction.findOne({
      locCode,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // ✅ Add debug logging to trace 500 errors
    if (!result) {
      console.warn(`⚠️ No closing balance found for locCode=${locCode} on ${formattedDate.toISOString()}`);
      return res.status(404).json({ message: "No closing balance found for this date." });
    }

    res.status(200).json({ data: result });
  } catch (err) {
    console.error("❌ getsaveCashBank Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};




