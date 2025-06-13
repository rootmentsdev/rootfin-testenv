import OverrideTransaction from '../model/OverrideTransaction.js';

export const saveOverride = async (req, res) => {
  const { invoiceNo } = req.params;
  const { locCode, date, cash, bank, upi, userId, role } = req.body;

  if (!userId || role !== 'admin') {
    return res.status(403).json({ message: "Access denied: Only admins can save overrides." });
  }

  try {
    const result = await OverrideTransaction.findOneAndUpdate(
      { invoiceNo, locCode },
      {
        cash,
        bank,
        upi,
        date,
        overrideBy: userId,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Override saved", data: result });
  } catch (error) {
    res.status(500).json({ message: "Error saving override", error: error.message });
  }
};

export const getOverrides = async (req, res) => {
  try {
    const locCode = req.query.locCode;
    if (!locCode) {
      return res.status(400).json({ message: 'Missing locCode in query' });
    }

    const overrides = await OverrideTransaction.find({ locCode }).sort({ date: -1 });
    res.status(200).json({ data: overrides });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overrides', error: error.message });
  }
};
