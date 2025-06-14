// import axios from 'axios';
// import TwsTransaction from '../model/TwsTransactions.js';

// export const syncTwsTransactions = async (fromDate, toDate) => {
// const url = `https://rentalapi.rootments.live/api/GetBooking/GetTransactionList?DateFrom=${fromDate}&DateTo=${toDate}`;
//   console.log(`Fetching TWS transactions from URL: ${url}`);

//   try {
//     const { data } = await axios.get(url);
//     const transactions = data?.data || [];
//     console.log(`Fetched ${transactions.length} transactions.`);

//     for (const tx of transactions) {
//       await TwsTransaction.findOneAndUpdate(
//         { invoiceNo: tx.invoiceNo },
//         {
//           ...tx,
//           amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//           originalData: tx,
//         },
//         { upsert: true, new: true }
//       );
//     }
//     console.log(`✅ Synced ${transactions.length} TWS transactions.`);
//   } catch (error) {
//     console.error("❌ Error syncing TWS transactions:", error.message);
//     throw error;
//   }
// };



import axios from 'axios';
import TwsTransaction from '../model/TwsTransactions.js';

export const syncTwsTransactions = async (fromDate, toDate) => {
  const base = "https://rentalapi.rootments.live/api/GetBooking";

  const urls = [
    `${base}/GetBookingList?DateFrom=${fromDate}&DateTo=${toDate}`,
    `${base}/GetRentoutList?DateFrom=${fromDate}&DateTo=${toDate}`,
    `${base}/GetReturnList?DateFrom=${fromDate}&DateTo=${toDate}`
  ];

  let allData = [];

  for (const url of urls) {
    try {
      const res = await axios.get(url);
      const records = res.data?.data || [];
      console.log(`🔄 ${url} → ${records.length} records`);
      allData = allData.concat(records);
    } catch (err) {
      console.error(`❌ Failed: ${url}`, err.message);
    }
  }

  if (allData.length === 0) {
    console.warn("⚠️ No data fetched from RMS");
    return;
  }

  let inserted = 0;
  for (const tx of allData) {
    const updated = await TwsTransaction.findOneAndUpdate(
      { invoiceNo: tx.invoiceNo },
      {
        ...tx,
        amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
        originalData: tx
      },
      { upsert: true, new: true }
    );
    if (updated) inserted++;
  }

  console.log(`✅ Synced ${inserted} RMS transactions to MongoDB`);
};
