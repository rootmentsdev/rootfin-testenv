import Transaction from "../model/Transaction.js";
import TransactionHistory from "../model/Transactionhistory.js";


export const editTransaction = async (req, res) => {
  try {
    // ✅ MOCK USER — remove this when auth is implemented
    req.user = {
      _id: "000000000000000000000000",
      power: "super_admin",
      locCode: "Zorucci-Kochi"
    };

    const transactionId = req.params.id;
    const updates = req.body;
    const reason = req.body.editReason || 'No reason provided';
    const user = req.user;

    // 1. Ensure user is admin or super_admin
    if (user.power !== 'admin' && user.power !== 'super_admin') {
      return res.status(403).json({ message: "Access denied: only admins can edit transactions." });
    }

    // 2. Find the original transaction
    const originalTransaction = await Transaction.findById(transactionId);
    if (!originalTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    // 3. Enforce branch-based access for 'admin'
    if (user.power === 'admin' && user.locCode !== originalTransaction.locCode) {
      return res.status(403).json({ message: "Admins can only edit transactions from their own branch." });
    }

    const { cash = 0, bank = 0, upi = 0 } = updates;
updates.amount = Number(cash) + Number(bank) + Number(upi);

    // 4. Save history before editing
    await TransactionHistory.create({
      originalTransactionId: originalTransaction._id,
      historyType: "EDIT",
      changedBy: user._id,
     
      reason,
      oldData: originalTransaction.toObject(),
      newData: { ...originalTransaction.toObject(), ...updates },
    });
   const amount = Number(updates.cash || 0) + Number(updates.bank || 0) + Number(updates.upi || 0);
    // 5. Perform the update
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        ...updates,
        amount,
        editedBy: user._id,
        editedAt: new Date(),
        editReason: reason,
      },
      { new: true }
    );

    // 6. Send response
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



