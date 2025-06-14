import { syncTwsTransactions } from '../services/syncTwsTransactions.js';
import TwsTransaction from '../model/TwsTransactions.js'; // ✅ Make sure this is imported

// ✅ Trigger Sync Without locCode
export const triggerTwsSync = async (req, res) => {
  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "Missing fromDate or toDate" });
  }

  try {
    await syncTwsTransactions(fromDate, toDate); // ✅ removed locCode
    return res.status(200).json({ message: "✅ TWS sync completed" });
  } catch (error) {
    return res.status(500).json({ message: "❌ Sync failed", error: error.message });
  }
};

// ✅ Get Synced TWS Transactions (No locCode filter)
export const getTwsTransactions = async (req, res) => {
  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "Missing fromDate or toDate" });
  }

  try {
    const result = await TwsTransaction.find({
      date: { $gte: fromDate, $lte: toDate }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch TWS data", error: err.message });
  }
};
