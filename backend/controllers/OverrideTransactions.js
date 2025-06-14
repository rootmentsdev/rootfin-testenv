// controllers/OverrideTransactionController.js
import OverrideTransaction from '../model/OverrideModel.js';

export const saveOverride = async (req, res) => {
  const { invoiceNo } = req.params;
  const { cash, bank, upi, userId, role } = req.body;

  if (!userId || role !== 'admin') {
    return res.status(403).json({ message: "Access denied: Only admins can save overrides." });
  }

  try {
    const override = await OverrideTransaction.findOneAndUpdate(
      { invoiceNo },
      {
        cash,
        bank,
        upi,
        overrideBy: userId,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Override saved", data: override });
  } catch (err) {
    res.status(500).json({ message: "Failed to save override", error: err.message });
  }
};

export const getOverrides = async (req, res) => {
  try {
    const overrides = await OverrideTransaction.find();
    res.status(200).json({ data: overrides });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch overrides", error: err.message });
  }
};
