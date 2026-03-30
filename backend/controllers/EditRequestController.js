import EditRequest from "../model/EditRequest.js";
import Transaction from "../model/Transaction.js";
import TransactionHistory from "../model/Transactionhistory.js";

// Admin submits an edit request (pending super-admin approval)
export const requestEdit = async (req, res) => {
  try {
    const { transactionId, newData, oldData, requestedBy, requestedByName, locCode, source } = req.body;

    if (!transactionId || !newData || !requestedBy || !locCode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if there's already a pending request for this transaction
    const existing = await EditRequest.findOne({ transactionId, status: "pending" });
    if (existing) {
      return res.status(409).json({ message: "A pending edit request already exists for this transaction." });
    }

    const editReq = await EditRequest.create({
      transactionId,
      invoiceNo: newData.invoiceNo || oldData?.invoiceNo || "",
      locCode,
      requestedBy,
      requestedByName: requestedByName || "",
      newData,
      oldData: oldData || {},
      source: source || "",
    });

    return res.status(201).json({ message: "Edit request submitted for approval.", data: editReq });
  } catch (err) {
    console.error("requestEdit error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Super admin: get all pending edit requests
export const getPendingEditRequests = async (req, res) => {
  try {
    const { status = "pending", locCode } = req.query;
    const query = { status };
    if (locCode) query.locCode = locCode;

    const requests = await EditRequest.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ data: requests });
  } catch (err) {
    console.error("getPendingEditRequests error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Super admin: approve an edit request → apply the actual transaction update
export const approveEditRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;

    const editReq = await EditRequest.findById(id);
    if (!editReq) return res.status(404).json({ message: "Edit request not found." });
    if (editReq.status !== "pending") return res.status(400).json({ message: "Request already processed." });

    const tx = await Transaction.findById(editReq.transactionId);
    if (!tx) return res.status(404).json({ message: "Original transaction not found." });

    const updates = editReq.newData;
    const { cash = 0, rbl = 0, bank = 0, upi = 0, securityAmount = 0, Balance = 0 } = updates;

    const rowType = (tx.type || "").toLowerCase();
    const isRentOut = rowType === "rentout";
    const isRefund  = rowType === "return" || rowType === "cancel";

    const splitTotal = Number(securityAmount) + Number(Balance);
    const payTotal   = Number(cash) + Number(rbl) + Number(bank) + Number(upi);
    let amount = isRentOut ? splitTotal : payTotal;
    if (isRefund) amount = -Math.abs(amount);

    const finalUpdates = {
      ...updates,
      cash: String(cash),
      rbl:  String(rbl),
      bank: String(bank),
      upi:  String(upi),
      amount,
      totalTransaction: amount,
      billValue: tx.billValue ?? tx.invoiceAmount ?? 0,
      invoiceNo: updates.invoiceNo || tx.invoiceNo || "",
      customerName: updates.customerName || tx.customerName || "",
      securityAmount: isRentOut ? Number(securityAmount) : 0,
      Balance:        isRentOut ? Number(Balance) : 0,
      subCategory1:   isRentOut ? (updates.subCategory1 || "Balance Payable") : "",
      editedBy: reviewedBy || "super_admin",
      editedAt: new Date(),
      editReason: `Approved by ${reviewedBy || "super_admin"}`,
    };

    // Write history (changedBy must be an ObjectId — use dummy system ID)
    const SYSTEM_ID = "000000000000000000000000";
    await TransactionHistory.create({
      originalTransactionId: tx._id,
      invoiceNo: finalUpdates.invoiceNo,
      historyType: "EDIT",
      changedBy: SYSTEM_ID,
      reason: finalUpdates.editReason,
      oldData: tx.toObject(),
      newData: { ...tx.toObject(), ...finalUpdates },
    });

    await Transaction.findByIdAndUpdate(editReq.transactionId, finalUpdates, { new: true });

    // Mark request as approved
    editReq.status = "approved";
    editReq.reviewedBy = reviewedBy || "super_admin";
    editReq.reviewedAt = new Date();
    await editReq.save();

    return res.status(200).json({ message: "Edit request approved and transaction updated." });
  } catch (err) {
    console.error("approveEditRequest error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Super admin: reject an edit request
export const rejectEditRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, rejectReason } = req.body;

    const editReq = await EditRequest.findById(id);
    if (!editReq) return res.status(404).json({ message: "Edit request not found." });
    if (editReq.status !== "pending") return res.status(400).json({ message: "Request already processed." });

    editReq.status = "rejected";
    editReq.reviewedBy = reviewedBy || "super_admin";
    editReq.reviewedAt = new Date();
    editReq.rejectReason = rejectReason || "";
    await editReq.save();

    return res.status(200).json({ message: "Edit request rejected." });
  } catch (err) {
    console.error("rejectEditRequest error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
