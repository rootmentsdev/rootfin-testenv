import Headers from '../components/Header.jsx';
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import useFetch from '../hooks/useFetch.jsx';
import baseUrl from '../api/api.js';
import { CSVLink } from 'react-csv';
import { Helmet } from "react-helmet";


const categories = [
  { value: "all", label: "All" },
  { value: "booking", label: "Booking" },
  { value: "RentOut", label: "Rent Out" },
  { value: "Refund", label: "Refund" },
  { value: "Return", label: "Return" },
  { value: "Cancel", label: "Cancel" },

  { value: "income", label: "income" },
  { value: "expense", label: "Expense" },
  { value: "money transfer", label: "Cash to Bank" },
];

const headers = [
  { label: "Date", key: "date", },
  { label: "Invoice No", key: "invoiceNo" },
  { label: "Customer Name", key: "customerName" },
  { label: "Category", key: "Category" },
  { label: "Sub Category", key: "SubCategory" },
  { label: "Balance Payable", key: "SubCategory1" },
  { label: "Amount", key: "amount" },
  { label: "Total Transaction", key: "totalTransaction" },
  { label: "security", key: "securityAmount" },
  { label: "Balance Payable", key: "Balance" },
  { label: "Remark", key: "remark" },
  { label: "Bill Value", key: "billValue" },
  { label: "Cash", key: "cash" },
  { label: "Bank", key: "bank" },
  { label: "UPI", key: "upi" },
];

const subCategories = [
  { value: "all", label: "All" },
  { value: "advance", label: "Advance" },
  { value: "Balance Payable", label: "Balance Payable" },
  { value: "security", label: "Security" },
  { value: "cancellation Refund", label: "Cancellation Refund" },
  { value: "security Refund", label: "Security Refund" },
  { value: "compensation", label: "Compensation" },
  { value: "petty expenses", label: "petty expenses" },
  { value: "shoe sales", label: "shoe sales" }

];


// const opening = [{ cash: "60000", bank: "54000" }];
const Datewisedaybook = () => {

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiUrl1, setApiUrl1] = useState("");
  const [apiUrl2, setApiUrl2] = useState("");
  const [preOpen, setPreOpen] = useState([])

  const [apiUrl3, setApiUrl3] = useState("");
  const [apiUrl4, setApiUrl4] = useState("");
  const [apiUrl5, setApiUrl5] = useState("");
  console.log(apiUrl5);

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object

  // const handleFetch = () => {
  //   setPreOpen([])

  //   const fromDates = new Date(fromDate); // or use new Date() for current date

  //   // Subtract 1 day (24 hours)
  //   const previousDay = new Date(fromDates);
  //   previousDay.setDate(previousDay.getDate() - 1);
  //   const formattedDate = previousDay.toISOString().split('T')[0];

  //   const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
  //   const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  //   const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  //   const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  //   const updatedApiUrl3 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  //   const updatedApiUrl4 = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`
  //   const updatedApiUrl5 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`

  //   setApiUrl(updatedApiUrl);
  //   setApiUrl1(updatedApiUrl1);
  //   setApiUrl2(updatedApiUrl2);
  //   // alert(updatedApiUrl3)
  //   setApiUrl3(updatedApiUrl3)
  //   setApiUrl4(updatedApiUrl4)
  //   setApiUrl5(updatedApiUrl5)
  //   GetCreateCashBank(updatedApiUrl5)

  //   // console.log("API URLs Updated:", updatedApiUrl2);
  // };
// const handleFetch = async () => {
//   setPreOpen([]);

//   const fromDates = new Date(fromDate);
//   const previousDay = new Date(fromDates);
//   previousDay.setDate(previousDay.getDate() - 1);
//   const formattedDate = previousDay.toISOString().split('T')[0];

//   const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
//   const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl3 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl4 = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl5 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`;

//   setApiUrl(updatedApiUrl);
//   setApiUrl1(updatedApiUrl1);
//   setApiUrl2(updatedApiUrl2);
//   setApiUrl3(updatedApiUrl3);
//   setApiUrl4(updatedApiUrl4);
//   setApiUrl5(updatedApiUrl5);
//   GetCreateCashBank(updatedApiUrl5);

//   try {
//     const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
//       fetch(updatedApiUrl),
//       fetch(updatedApiUrl1),
//       fetch(updatedApiUrl2),
//       fetch(updatedApiUrl4),
//       fetch(updatedApiUrl3),
//     ]);

//     const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
//       bookingRes.json(),
//       rentoutRes.json(),
//       returnRes.json(),
//       deleteRes.json(),
//       mongoRes.json(),
//     ]);

//     const bookingList = bookingData?.data || [];
//     const rentoutList = rentoutData?.data || [];
//     const returnList = returnData?.data || [];
//     const deleteList = deleteData?.data || [];
//  const mongoList = (mongoData?.data || []).map(tx => ({
//   ...tx,
//   Category: tx.type,
//   SubCategory: tx.category,
//   billValue: Number(tx.amount),
//   amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//   totalTransaction: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//   cash: Number(tx.cash),
//   bank: Number(tx.bank),
//   upi: Number(tx.upi),
//   source: "mongo",
// }));

//     // Optional: mark TWS transactions too
//     const combinedTWS = [
//       ...bookingList.map(i => ({ ...i, source: "booking" })),
//       ...rentoutList.map(i => ({ ...i, source: "rentout" })),
//       ...returnList.map(i => ({ ...i, source: "return" })),
//       ...deleteList.map(i => ({ ...i, source: "deleted" })),
//     ];

//     const all = [...combinedTWS, ...mongoList];
//     setMongoTransactions(mongoList);
//     setFilteredTransactions(all); // combined data
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };


// const handleFetch = async () => {
//   setPreOpen([]);

//   const fromDates = new Date(fromDate);
//   const previousDay = new Date(fromDates);
//   previousDay.setDate(previousDay.getDate() - 1);
//   const formattedDate = previousDay.toISOString().split("T")[0];

//   try {
//     const syncUrl = `http://localhost:7000/api/tws/sync-tws?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`;
//     await fetch(syncUrl);
//     console.log("✅ RMS sync done");
//   } catch (err) {
//     console.error("❌ RMS sync failed:", err.message);
//   }

//   const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
//   const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl3 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl4 = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl5 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`;

//   setApiUrl(updatedApiUrl);
//   setApiUrl1(updatedApiUrl1);
//   setApiUrl2(updatedApiUrl2);
//   setApiUrl3(updatedApiUrl3);
//   setApiUrl4(updatedApiUrl4);
//   setApiUrl5(updatedApiUrl5);
//   GetCreateCashBank(updatedApiUrl5);

//   try {
//     const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
//       fetch(updatedApiUrl),
//       fetch(updatedApiUrl1),
//       fetch(updatedApiUrl2),
//       fetch(updatedApiUrl4),
//       fetch(updatedApiUrl3)
//     ]);

//     const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
//       bookingRes.json(),
//       rentoutRes.json(),
//       returnRes.json(),
//       deleteRes.json(),
//       mongoRes.json()
//     ]);

//     const bookingList = bookingData?.data || [];
//     const rentoutList = rentoutData?.data || [];
//     const returnList = returnData?.data || [];
//     const deleteList = deleteData?.data || [];

//     const mongoList = (mongoData?.data || []).map(tx => ({
//       ...tx,
//       Category: tx.type,
//       SubCategory: tx.category,
//       billValue: Number(tx.amount),
//       amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//       totalTransaction: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//       cash: Number(tx.cash),
//       bank: Number(tx.bank),
//       upi: Number(tx.upi),
//       source: "mongo"
//     }));

//     // 🔁 FETCH edited overrides
//     let overrideRes = [];
//     try {
//       const overrideFetch = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const overrideJson = await overrideFetch.json();
//       overrideRes = overrideJson?.data || [];
//     } catch (err) {
//       console.warn("⚠️ Override fetch failed", err.message);
//     }


  

//     // 🧠 CREATE override map
//     const overrideMap = new Map();
//     overrideRes.forEach(item => {
//       const key = String(item.invoiceNo).trim();
//       overrideMap.set(key, {
//         ...item,
//         invoiceNo: key,
//         cash: Number(item.cash || 0),
//         bank: Number(item.bank || 0),
//         upi: Number(item.upi || 0),
//         amount: Number(item.cash || 0) + Number(item.bank || 0) + Number(item.upi || 0),
//         totalTransaction: Number(item.cash || 0) + Number(item.bank || 0) + Number(item.upi || 0),
//       });
//     });

   

//     // ✏️ Apply overrides
//     const finalTws = [...bookingList, ...rentoutList, ...returnList, ...deleteList].map(t => {
//       const invoiceKey = String(t.invoiceNo).trim();
//       const override = overrideMap.get(invoiceKey);
//       return override
//         ? { ...t, ...override, source: "edited" }
//         : { ...t };
//     });

//     const allTransactions = [...finalTws, ...mongoList];

//     setFilteredTransactions(allTransactions);
//     setMongoTransactions(mongoList);
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };

// const handleFetch = async () => {
//   setPreOpen([]);

//   const fromDates = new Date(fromDate);
//   const previousDay = new Date(fromDates);
//   previousDay.setDate(previousDay.getDate() - 1);
//   const formattedDate = previousDay.toISOString().split("T")[0];

//   try {
//     const syncUrl = `http://localhost:7000/api/tws/sync-tws?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`;
//     await fetch(syncUrl);
//     console.log("✅ RMS sync done");
//   } catch (err) {
//     console.error("❌ RMS sync failed:", err.message);
//   }

//   const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
//   const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl3 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl4 = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl5 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`;

//   setApiUrl(updatedApiUrl);
//   setApiUrl1(updatedApiUrl1);
//   setApiUrl2(updatedApiUrl2);
//   setApiUrl3(updatedApiUrl3);
//   setApiUrl4(updatedApiUrl4);
//   setApiUrl5(updatedApiUrl5);
//   GetCreateCashBank(updatedApiUrl5);

//   try {
//     const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
//       fetch(updatedApiUrl),
//       fetch(updatedApiUrl1),
//       fetch(updatedApiUrl2),
//       fetch(updatedApiUrl4),
//       fetch(updatedApiUrl3)
//     ]);

//     const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
//       bookingRes.json(),
//       rentoutRes.json(),
//       returnRes.json(),
//       deleteRes.json(),
//       mongoRes.json()
//     ]);

//     const bookingList = bookingData?.data || [];
//     const rentoutList = rentoutData?.data || [];
//     const returnList = returnData?.data || [];
//     const deleteList = deleteData?.data || [];

//     const mongoList = (mongoData?.data || []).map(tx => ({
//       ...tx,
//       Category: tx.type,
//       SubCategory: tx.category,
//       billValue: Number(tx.amount),
//       amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//       totalTransaction: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//       cash: Number(tx.cash),
//       bank: Number(tx.bank),
//       upi: Number(tx.upi),
//       source: "mongo"
//     }));

//     let overrideRes = [];
//     try {
//       const overrideFetch = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const overrideJson = await overrideFetch.json();
//       overrideRes = overrideJson?.data || [];
//     } catch (err) {
//       console.warn("⚠️ Override fetch failed", err.message);
//     }

//     const overrideMap = new Map();
//     overrideRes.forEach(item => {
//       const key = String(item.invoiceNo).trim();
//       overrideMap.set(key, {
//         ...item,
//         invoiceNo: key,
//         cash: Number(item.cash || 0),
//         bank: Number(item.bank || 0),
//         upi: Number(item.upi || 0),
//         amount: Number(item.cash || 0) + Number(item.bank || 0) + Number(item.upi || 0),
//         totalTransaction: Number(item.cash || 0) + Number(item.bank || 0) + Number(item.upi || 0),
//       });
//     });

//     const finalTws = [...bookingList, ...rentoutList, ...returnList, ...deleteList].map(t => {
//       const invoiceKey = String(t.invoiceNo).trim();
//       const override = overrideMap.get(invoiceKey);
//       return override
//         ? { ...t, ...override, source: "edited" }
//         : { ...t };
//     });

//     const allTransactions = [...finalTws, ...mongoList];

//     setFilteredTransactions(allTransactions);
//     setMongoTransactions(mongoList);
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };


// const handleFetch = async () => {
//   setPreOpen([]);

//   const fromDates = new Date(fromDate);
//   const previousDay = new Date(fromDates);
//   previousDay.setDate(previousDay.getDate() - 1);
//   const formattedDate = previousDay.toISOString().split("T")[0];

//   try {
//     const syncUrl = `http://localhost:7000/api/tws/sync-tws?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`;
//     await fetch(syncUrl);
//     console.log("✅ RMS sync done");
//   } catch (err) {
//     console.error("❌ RMS sync failed:", err.message);
//   }

//   const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
//   const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl3 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl4 = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const updatedApiUrl5 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`;

//   setApiUrl(updatedApiUrl);
//   setApiUrl1(updatedApiUrl1);
//   setApiUrl2(updatedApiUrl2);
//   setApiUrl3(updatedApiUrl3);
//   setApiUrl4(updatedApiUrl4);
//   setApiUrl5(updatedApiUrl5);
//   GetCreateCashBank(updatedApiUrl5);

//   try {
//     const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
//       fetch(updatedApiUrl),
//       fetch(updatedApiUrl1),
//       fetch(updatedApiUrl2),
//       fetch(updatedApiUrl4),
//       fetch(updatedApiUrl3)
//     ]);

//     const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
//       bookingRes.json(),
//       rentoutRes.json(),
//       returnRes.json(),
//       deleteRes.json(),
//       mongoRes.json()
//     ]);

//     const bookingList = bookingData?.data || [];
//     const rentoutList = rentoutData?.data || [];
//     const returnList = returnData?.data || [];
//     const deleteList = deleteData?.data || [];

//     const mongoList = (mongoData?.data || []).map(tx => ({
//       ...tx,
//       Category: tx.type,
//       SubCategory: tx.category,
//       billValue: Number(tx.amount),
//       amount: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//       totalTransaction: Number(tx.cash || 0) + Number(tx.bank || 0) + Number(tx.upi || 0),
//       cash: Number(tx.cash),
//       bank: Number(tx.bank),
//       upi: Number(tx.upi),
//       source: "mongo"
//     }));

//     let overrideRes = [];
//     try {
//       const overrideFetch = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const overrideJson = await overrideFetch.json();
//       overrideRes = overrideJson?.data || [];
//     } catch (err) {
//       console.warn("⚠️ Override fetch failed", err.message);
//     }

//     const overrideMap = new Map();
//     overrideRes.forEach(item => {
//       const key = String(item.invoiceNo).trim();
//       overrideMap.set(key, {
//         ...item,
//         invoiceNo: key,
//         cash: Number(item.cash || 0),
//         bank: Number(item.bank || 0),
//         upi: Number(item.upi || 0),
//         amount: Number(item.cash || 0) + Number(item.bank || 0) + Number(item.upi || 0),
//         totalTransaction: Number(item.cash || 0) + Number(item.bank || 0) + Number(item.upi || 0),
//       });
//     });

//     const finalTws = [...bookingList, ...rentoutList, ...returnList, ...deleteList].map(t => {
//       const invoiceKey = String(t.invoiceNo).trim();
//       const override = overrideMap.get(invoiceKey);
//       return override
//         ? { ...t, ...override, source: "edited" }
//         : { ...t };
//     });

//     const allTransactions = [...finalTws, ...mongoList];

//     setMergedTransactions(allTransactions); // ✅ renamed to avoid conflict
//     setMongoTransactions(mongoList);
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };


// ------------------------------------------------------------------
// NEW handleFetch – edited Mongo rows always win over TWS rows
// ------------------------------------------------------------------
// const handleFetch = async () => {
//   // 0. Reset opening-balance row shown at the very top
//   setPreOpen([]);

//   // 1. Build “previous day” string ― needed for opening balance API
//   const fromDates     = new Date(fromDate);
//   const previousDay   = new Date(fromDates);
//   previousDay.setDate(previousDay.getDate() - 1);
//   const formattedDate = previousDay.toISOString().split('T')[0];

//   // 2. Ask backend to sync fresh RMS ➜ Mongo
//   try {
//     const syncUrl = `http://localhost:7000/api/tws/sync-tws`
//                   + `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`;
//     await fetch(syncUrl);
//     console.log('✅ RMS sync done');
//   } catch (err) {
//     console.error('❌ RMS sync failed:', err.message);
//   }

//   // 3. Build all endpoint URLs
//   const baseUrl1      = 'https://rentalapi.rootments.live/api/GetBooking';
//   const bookingURL    = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const rentoutURL    = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const returnURL     = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const deleteURL     = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const mongoURL      = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const openingURL    = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`;

//   // Store URLs so that useFetch hooks re-run automatically
//   setApiUrl(bookingURL);
//   setApiUrl1(rentoutURL);
//   setApiUrl2(returnURL);
//   setApiUrl3(mongoURL);
//   setApiUrl4(deleteURL);
//   setApiUrl5(openingURL);

//   // Fetch the opening balance row right away
//   GetCreateCashBank(openingURL);

//   // 4. Fetch *all* datasets in parallel
//   try {
//     const [
//       bookingRes, rentoutRes, returnRes, deleteRes, mongoRes
//     ] = await Promise.all([
//       fetch(bookingURL),
//       fetch(rentoutURL),
//       fetch(returnURL),
//       fetch(deleteURL),
//       fetch(mongoURL)
//     ]);

//     const [
//       bookingData, rentoutData, returnData, deleteData, mongoData
//     ] = await Promise.all([
//       bookingRes.json(),
//       rentoutRes.json(),
//       returnRes.json(),
//       deleteRes.json(),
//       mongoRes.json()
//     ]);

//     // 4-a Normalise TWS arrays (no transformations needed yet)
//     const bookingList = bookingData?.data || [];
//     const rentoutList = rentoutData?.data || [];
//     const returnList  = returnData?.data || [];
//     const deleteList  = deleteData?.data || [];

//     // 4-b Normalise Mongo “payment” rows so their shape matches TWS
//     const mongoList = (mongoData?.data || []).map(tx => ({
//       ...tx,
//       Category        : tx.type,
//       SubCategory     : tx.category,
//       billValue       : Number(tx.amount),
//       cash            : Number(tx.cash  || 0),
//       bank            : Number(tx.bank  || 0),
//       upi             : Number(tx.upi   || 0),
//       amount          : Number(tx.cash  || 0)
//                       + Number(tx.bank  || 0)
//                       + Number(tx.upi   || 0),
//       totalTransaction: Number(tx.cash  || 0)
//                       + Number(tx.bank  || 0)
//                       + Number(tx.upi   || 0),
//       source          : 'mongo'
//     }));

//     // 5. Fetch the *edited* rows (overrides) from Mongo
//     let overrideRows = [];
//     try {
//       const res = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions`
//         + `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const json = await res.json();
//       overrideRows = json?.data || [];
//     } catch (err) {
//       console.warn('⚠️ Override fetch failed', err.message);
//     }

//     // 6. Build a map keyed by invoiceNo for O(1) lookup
//     const editedMap = new Map();
//     overrideRows.forEach(row => {
//       const key = String(row.invoiceNo).trim();
//       editedMap.set(key, {
//         ...row,
//         Category        : row.type,
//         SubCategory     : row.category,
//         billValue       : Number(row.amount),
//         cash            : Number(row.cash  || 0),
//         bank            : Number(row.bank  || 0),
//         upi             : Number(row.upi   || 0),
//         amount          : Number(row.cash  || 0)
//                         + Number(row.bank  || 0)
//                         + Number(row.upi   || 0),
//         totalTransaction: Number(row.cash  || 0)
//                         + Number(row.bank  || 0)
//                         + Number(row.upi   || 0),
//         source          : 'edited'
//       });
//     });

//     // 7. Keep each raw TWS row only when no edited version exists
//     const untouchedTwsRows = [
//       ...bookingList,
//       ...rentoutList,
//       ...returnList,
//       ...deleteList
//     ].filter(t => !editedMap.has(String(t.invoiceNo).trim()));

//     // 8. Final dataset: edited rows → rest of TWS rows → native Mongo rows
//     const allTransactions = [
//       ...editedMap.values(), // newest versions first
//       ...untouchedTwsRows,
//       ...mongoList
//     ];

//     // 9. Push into React state
//     setMergedTransactions(allTransactions);
//     setMongoTransactions(mongoList); // still needed for inline editing
//   } catch (err) {
//     console.error('❌ Error fetching transactions', err);
//   }
// };
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// handleFetch – edited Mongo rows always override TWS rows
// ------------------------------------------------------------------


// ------------------------------------------------------------------
// handleFetch v2 – shows the latest Mongo edits (invoiceNo unified)
// ------------------------------------------------------------------
// const handleFetch = async () => {
//   /* 0. clear opening balance row */
//   setPreOpen([]);

//   /* 1. helper date for opening balance (previous day) */
//   const prev = new Date(new Date(fromDate));
//   prev.setDate(prev.getDate() - 1);
//   const prevDayStr = prev.toISOString().split("T")[0];

//   /* 2. ask server to sync fresh RMS→Mongo first */
//   try {
//     await fetch(
//       `http://localhost:7000/api/tws/sync-tws` +
//       `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//     );
//     console.log("✅ RMS sync done");
//   } catch (err) {
//     console.error("❌ RMS sync failed:", err.message);
//   }

//   /* 3. build all endpoint URLs */
//   const twsBase  = "https://rentalapi.rootments.live/api/GetBooking";
//   const bookingU = `${twsBase}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const rentoutU = `${twsBase}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const returnU  = `${twsBase}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const deleteU  = `${twsBase}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const mongoU   = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const openingU = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${prevDayStr}`;

//   /* 4. put URLs in state so useFetch hooks run */
//   setApiUrl(bookingU);  setApiUrl1(rentoutU);  setApiUrl2(returnU);
//   setApiUrl3(mongoU);   setApiUrl4(deleteU);   setApiUrl5(openingU);

//   /* fetch opening balance now */
//   GetCreateCashBank(openingU);

//   /* 5. fetch every data-set in parallel */
//   try {
//     const [
//       bookingRes, rentoutRes, returnRes, deleteRes, mongoRes
//     ] = await Promise.all([
//       fetch(bookingU), fetch(rentoutU), fetch(returnU),
//       fetch(deleteU),  fetch(mongoU)
//     ]);

//     const [
//       bookingData, rentoutData, returnData, deleteData, mongoData
//     ] = await Promise.all([
//       bookingRes.json(), rentoutRes.json(), returnRes.json(),
//       deleteRes.json(),  mongoRes.json()
//     ]);

//     /* 5-a  prepare TWS arrays */
//     const bookingList = bookingData?.data || [];
//     const rentoutList = rentoutData?.data || [];
//     const returnList  = returnData?.data || [];
//     const deleteList  = deleteData?.data || [];

//     /* 5-b  prepare Mongo “payment” rows (add invoiceNo!) */
//     const mongoList = (mongoData?.data || []).map(tx => {
//       const cash = Number(tx.cash || 0);
//       const bank = Number(tx.bank || 0);
//       const upi  = Number(tx.upi  || 0);
//       const total = cash + bank + upi;

//       return {
//         ...tx,
//         invoiceNo       : tx.invoiceNo || tx.invoice || "",   // ★ unify
//         Category        : tx.type,
//         SubCategory     : tx.category,
//         billValue       : Number(tx.amount),
//         cash, bank, upi,
//         amount          : total,
//         totalTransaction: total,
//         source          : "mongo"
//       };
//     });

//     /* 6. fetch override edits */
//     let overrideRows = [];
//     try {
//       const res  = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions` +
//         `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const json = await res.json();
//       overrideRows = json?.data || [];
//     } catch (err) {
//       console.warn("⚠️ Override fetch failed", err.message);
//     }

//     /* 7. build editedMap keyed by unified invoiceNo */
//     const editedMap = new Map();
//     overrideRows.forEach(row => {
//       const key  = String(row.invoiceNo || row.invoice).trim(); // ★ unify
//       const cash = Number(row.cash || 0);
//       const bank = Number(row.bank || 0);
//       const upi  = Number(row.upi  || 0);
//       const total = cash + bank + upi;

//       editedMap.set(key, {
//         ...row,
//         invoiceNo       : key,
//         Category        : row.type,
//         SubCategory     : row.category,
//         billValue       : Number(row.amount),
//         cash, bank, upi,
//         amount          : total,
//         totalTransaction: total,
//         source          : "edited"
//       });
//     });

//     /* 8. keep each raw TWS row only if no edited copy exists */
//     const untouchedTws = [
//       ...bookingList, ...rentoutList, ...returnList, ...deleteList
//     ].filter(t => !editedMap.has(String(t.invoiceNo).trim()));

//     /* 9. final merge order: edited → untouched TWS → native Mongo */
//     const allTransactions = [
//       ...editedMap.values(),
//       ...untouchedTws,
//       ...mongoList
//     ];

//     /* 10. push into React state */
//     setMergedTransactions(allTransactions);
//     setMongoTransactions(mongoList);  // still needed for inline edits
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };
// ------------------------------------------------------------------


// const handleFetch = async () => {
//   /* 0. clear opening balance row */
//   setPreOpen([]);

//   /* 1. helper date for opening balance (previous day) */
//   const prev = new Date(new Date(fromDate));
//   prev.setDate(prev.getDate() - 1);
//   const prevDayStr = prev.toISOString().split("T")[0];

//   /* 2. ask server to sync fresh RMS→Mongo first */
//   try {
//     await fetch(
//       `http://localhost:7000/api/tws/sync-tws` +
//       `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//     );
//     console.log("✅ RMS sync done");
//   } catch (err) {
//     console.error("❌ RMS sync failed:", err.message);
//   }

//   /* 3. build all endpoint URLs */
//   const twsBase  = "https://rentalapi.rootments.live/api/GetBooking";
//   const bookingU = `${twsBase}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const rentoutU = `${twsBase}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const returnU  = `${twsBase}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const deleteU  = `${twsBase}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const mongoU   = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const openingU = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${prevDayStr}`;

//   /* 4. put URLs in state so useFetch hooks run */
//   setApiUrl(bookingU);  setApiUrl1(rentoutU);  setApiUrl2(returnU);
//   setApiUrl3(mongoU);   setApiUrl4(deleteU);   setApiUrl5(openingU);

//   /* fetch opening balance now */
//   GetCreateCashBank(openingU);

//   /* 5. fetch every data-set in parallel */
//   try {
//     const [
//       bookingRes, rentoutRes, returnRes, deleteRes, mongoRes
//     ] = await Promise.all([
//       fetch(bookingU), fetch(rentoutU), fetch(returnU),
//       fetch(deleteU),  fetch(mongoU)
//     ]);

//     const [
//       bookingData, rentoutData, returnData, deleteData, mongoData
//     ] = await Promise.all([
//       bookingRes.json(), rentoutRes.json(), returnRes.json(),
//       deleteRes.json(),  mongoRes.json()
//     ]);

//     /* ✅ FIXED: Use correct paths for TWS arrays */
//     const bookingList = bookingData?.dataSet?.data || [];
//     const rentoutList = rentoutData?.dataSet?.data || [];
//     const returnList  = returnData?.dataSet?.data || [];
//     const deleteList  = deleteData?.dataSet?.data || [];

//     /* 5-b  prepare Mongo “payment” rows (add invoiceNo!) */
//     const mongoList = (mongoData?.data || []).map(tx => {
//       const cash = Number(tx.cash || 0);
//       const bank = Number(tx.bank || 0);
//       const upi  = Number(tx.upi  || 0);
//       const total = cash + bank + upi;

//       return {
//         ...tx,
//         invoiceNo       : tx.invoiceNo || tx.invoice || "",   // ★ unify
//         Category        : tx.type,
//         SubCategory     : tx.category,
//         billValue       : Number(tx.amount),
//         cash, bank, upi,
//         amount          : total,
//         totalTransaction: total,
//         source          : "mongo"
//       };
//     });

//     /* 6. fetch override edits */
//     let overrideRows = [];
//     try {
//       const res  = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions` +
//         `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const json = await res.json();
//       overrideRows = json?.data || [];
//     } catch (err) {
//       console.warn("⚠️ Override fetch failed", err.message);
//     }

//     /* 7. build editedMap keyed by unified invoiceNo */
//     const editedMap = new Map();
//     overrideRows.forEach(row => {
//       const key  = String(row.invoiceNo || row.invoice).trim(); // ★ unify
//       const cash = Number(row.cash || 0);
//       const bank = Number(row.bank || 0);
//       const upi  = Number(row.upi  || 0);
//       const total = cash + bank + upi;

//       editedMap.set(key, {
//         ...row,
//         invoiceNo       : key,
//         Category        : row.type,
//         SubCategory     : row.category,
//         billValue       : Number(row.amount),
//         cash, bank, upi,
//         amount          : total,
//         totalTransaction: total,
//         source          : "edited"
//       });
//     });

//     /* 8. keep each raw TWS row only if no edited copy exists */
//     const untouchedTws = [
//       ...bookingList, ...rentoutList, ...returnList, ...deleteList
//     ].filter(t => !editedMap.has(String(t.invoiceNo).trim()));

//     /* 9. final merge order: edited → untouched TWS → native Mongo */
//     const allTransactions = [
//       ...editedMap.values(),
//       ...untouchedTws,
//       ...mongoList
//     ];

//     /* 10. push into React state */
//     setMergedTransactions(allTransactions);
//     setMongoTransactions(mongoList);  // still needed for inline edits
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };


// abhiram

// const handleFetch = async () => {
//   // 0. Reset opening balance
//   setPreOpen([]);

//   // 1. Get previous day (for opening balance)
//   const prev = new Date(new Date(fromDate));
//   prev.setDate(prev.getDate() - 1);
//   const prevDayStr = prev.toISOString().split("T")[0];

//   // 2. Sync RMS → Mongo
//   try {
//     await fetch(
//       `http://localhost:7000/api/tws/sync-tws` +
//       `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//     );
//     console.log("✅ RMS sync done");
//   } catch (err) {
//     console.error("❌ RMS sync failed:", err.message);
//   }

//   // 3. Prepare all URLs
//   const twsBase = "https://rentalapi.rootments.live/api/GetBooking";
//   const bookingU = `${twsBase}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const rentoutU = `${twsBase}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const returnU = `${twsBase}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const deleteU = `${twsBase}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const mongoU = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
//   const openingU = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${prevDayStr}`;

//   setApiUrl(bookingU);
//   setApiUrl1(rentoutU);
//   setApiUrl2(returnU);
//   setApiUrl3(mongoU);
//   setApiUrl4(deleteU);
//   setApiUrl5(openingU);

//   GetCreateCashBank(openingU);

//   try {
//     const [
//       bookingRes, rentoutRes, returnRes, deleteRes, mongoRes
//     ] = await Promise.all([
//       fetch(bookingU), fetch(rentoutU), fetch(returnU),
//       fetch(deleteU), fetch(mongoU)
//     ]);

//     const [
//       bookingData, rentoutData, returnData, deleteData, mongoData
//     ] = await Promise.all([
//       bookingRes.json(), rentoutRes.json(), returnRes.json(),
//       deleteRes.json(), mongoRes.json()
//     ]);

//     // ----------------------------
//     // 4. Normalize all TWS Arrays
//     // ----------------------------

//     const bookingList = (bookingData?.dataSet?.data || []).map(item => {
//       const cash = Number(item.bookingCashAmount || 0);
//       const bank = Number(item.bookingBankAmount || 0);
//       const upi  = Number(item.bookingUPIAmount  || 0);
//       const total = cash + bank + upi;

//       return {
//         ...item,
//         date: item.bookingDate?.split("T")[0],
//         invoiceNo: item.invoiceNo,
//         customerName: item.customerName,
//         Category: "Booking",
//         SubCategory: "Advance",
//         billValue: Number(item.invoiceAmount || 0),
//         cash, bank, upi,
//         amount: total,
//         totalTransaction: total,
//         remark: "",
//         source: "booking"
//       };
//     });

//     const rentoutList = (rentoutData?.dataSet?.data || []).map(item => {
//       const cash = Number(item.rentoutCashAmount || 0);
//       const bank = Number(item.rentoutBankAmount || 0);
//       const upi  = Number(item.rentoutUPIAmount  || 0);
//       const total = cash + bank + upi;

//       return {
//         ...item,
//         date: item.rentOutDate?.split("T")[0],
//         invoiceNo: item.invoiceNo,
//         customerName: item.customerName,
//         Category: "RentOut",
//         SubCategory: "Security",
//         billValue: Number(item.invoiceAmount || 0),
//         cash, bank, upi,
//         amount: total,
//         totalTransaction: total,
//         remark: "",
//         source: "rentout"
//       };
//     });

//     const returnList = (returnData?.dataSet?.data || []).map(item => {
//       const cash = -Math.abs(Number(item.returnCashAmount || 0));
//       const bank = -Math.abs(Number(item.returnBankAmount || 0));
//       const upi  = -Math.abs(Number(item.returnUPIAmount  || 0));
//       const total = cash + bank + upi;

//       return {
//         ...item,
//         date: item.returnedDate?.split("T")[0],
//         invoiceNo: item.invoiceNo,
//         customerName: item.customerName,
//         Category: "Return",
//         SubCategory: "Security Refund",
//         billValue: Number(item.invoiceAmount || 0),
//         cash, bank, upi,
//         amount: total,
//         totalTransaction: total,
//         remark: "",
//         source: "return"
//       };
//     });

//     const deleteList = (deleteData?.dataSet?.data || []).map(item => {
//       const cash = -Math.abs(Number(item.deleteCashAmount || 0));
//       const bank = -Math.abs(Number(item.deleteBankAmount || 0));
//       const upi  = -Math.abs(Number(item.deleteUPIAmount  || 0));
//       const total = cash + bank + upi;

//       return {
//         ...item,
//         date: item.cancelDate?.split("T")[0],
//         invoiceNo: item.invoiceNo,
//         customerName: item.customerName,
//         Category: "Cancel",
//         SubCategory: "Cancellation Refund",
//         billValue: Number(item.invoiceAmount || 0),
//         cash, bank, upi,
//         amount: total,
//         totalTransaction: total,
//         remark: "",
//         source: "deleted"
//       };
//     });

//     // ----------------------------
//     // 5. Prepare Mongo Payments
//     // ----------------------------
//     const mongoList = (mongoData?.data || []).map(tx => {
//       const cash = Number(tx.cash || 0);
//       const bank = Number(tx.bank || 0);
//       const upi  = Number(tx.upi || 0);
//       const total = cash + bank + upi;

//       return {
//         ...tx,
//         invoiceNo: tx.invoiceNo || tx.invoice || "",
//         Category: tx.type,
//         SubCategory: tx.category,
//         billValue: Number(tx.amount),
//         cash, bank, upi,
//         amount: total,
//         totalTransaction: total,
//         source: "mongo"
//       };
//     });

//     // ----------------------------
//     // 6. Overrides
//     // ----------------------------
//     let overrideRows = [];
//     try {
//       const res = await fetch(
//         `${baseUrl.baseUrl}api/tws/getEditedTransactions` +
//         `?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
//       );
//       const json = await res.json();
//       overrideRows = json?.data || [];
//     } catch (err) {
//       console.warn("⚠️ Override fetch failed:", err.message);
//     }

//     const editedMap = new Map();
//     overrideRows.forEach(row => {
//       const key = String(row.invoiceNo || row.invoice).trim();
//       const cash = Number(row.cash || 0);
//       const bank = Number(row.bank || 0);
//       const upi  = Number(row.upi || 0);
//       const total = cash + bank + upi;

//       editedMap.set(key, {
//         ...row,
//         invoiceNo: key,
//         Category: row.type,
//         SubCategory: row.category,
//         billValue: Number(row.amount),
//         cash, bank, upi,
//         amount: total,
//         totalTransaction: total,
//         source: "edited"
//       });
//     });

//     // ----------------------------
//     // 7. Merge All Data
//     // ----------------------------
//     const untouchedTws = [
//       ...bookingList, ...rentoutList, ...returnList, ...deleteList
//     ].filter(t => !editedMap.has(String(t.invoiceNo).trim()));

//     const allTransactions = [
//       ...editedMap.values(),
//       ...untouchedTws,
//       ...mongoList
//     ];

//     // 8. Set state
//     setMergedTransactions(allTransactions);
//     setMongoTransactions(mongoList);
//   } catch (err) {
//     console.error("❌ Error fetching transactions", err);
//   }
// };

const handleFetch = async () => {
  setPreOpen([]);

  const prev = new Date(new Date(fromDate));
  prev.setDate(prev.getDate() - 1);
  // const prevDayStr = prev.toISOString().split("T")[0];
  
const prevDayStr = new Date(fromDate) < new Date("2025-01-01")
  ? "2025-01-01"
  : new Date(new Date(fromDate).setDate(new Date(fromDate).getDate() - 1)).toISOString().split("T")[0];

  


  try {
    await fetch(
      `http://localhost:7000/api/tws/sync-tws?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
    );
    console.log("✅ RMS sync done");
  } catch (err) {
    console.error("❌ RMS sync failed:", err.message);
  }

  const twsBase = "https://rentalapi.rootments.live/api/GetBooking";
  const bookingU = `${twsBase}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const rentoutU = `${twsBase}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const returnU = `${twsBase}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const deleteU = `${twsBase}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const mongoU = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const openingU = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${prevDayStr}`;

  setApiUrl(bookingU); setApiUrl1(rentoutU); setApiUrl2(returnU);
  setApiUrl3(mongoU); setApiUrl4(deleteU); setApiUrl5(openingU);
  GetCreateCashBank(openingU);

  try {
    const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
      fetch(bookingU), fetch(rentoutU), fetch(returnU), fetch(deleteU), fetch(mongoU)
    ]);
    const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
      bookingRes.json(), rentoutRes.json(), returnRes.json(), deleteRes.json(), mongoRes.json()
    ]);

    const bookingList = (bookingData?.dataSet?.data || []).map(item => ({
      ...item,
      date: item.bookingDate?.split("T")[0],
      invoiceNo: item.invoiceNo,
      customerName: item.customerName,
      Category: "Booking",
      SubCategory: "Advance",
      billValue: Number(item.invoiceAmount || 0),
      cash: Number(item.bookingCashAmount || 0),
      bank: Number(item.bookingBankAmount || 0),
      upi: Number(item.bookingUPIAmount || 0),
      amount: Number(item.bookingCashAmount || 0) + Number(item.bookingBankAmount || 0) + Number(item.bookingUPIAmount || 0),
      totalTransaction: Number(item.bookingCashAmount || 0) + Number(item.bookingBankAmount || 0) + Number(item.bookingUPIAmount || 0),
      remark: "",
      source: "booking"
    }));

    const rentoutList = (rentoutData?.dataSet?.data || []).map(item => ({
      ...item,
      date: item.rentOutDate?.split("T")[0],
      invoiceNo: item.invoiceNo,
      customerName: item.customerName,
      Category: "RentOut",
      SubCategory: "Security",
      SubCategory1: "Balance Payable",   
      
      billValue: Number(item.invoiceAmount || 0),
      cash: Number(item.rentoutCashAmount || 0),
      bank: Number(item.rentoutBankAmount || 0),
      upi: Number(item.rentoutUPIAmount || 0),
      amount: Number(item.rentoutCashAmount || 0) + Number(item.rentoutBankAmount || 0) + Number(item.rentoutUPIAmount || 0),
      totalTransaction: Number(item.rentoutCashAmount || 0) + Number(item.rentoutBankAmount || 0) + Number(item.rentoutUPIAmount || 0),
      remark: "",
      source: "rentout"
    }));


    // ⬇️  ↩︎ only this block changes


    const returnList = (returnData?.dataSet?.data || []).map(item => ({
      ...item,
    date: (item.returnedDate || item.returnDate || item.createdDate || "").split("T")[0],
    customerName: item.customerName || item.custName || item.customer || "",   // fallback chain
    invoiceNo: item.invoiceNo,
      Category: "Return",
      SubCategory: "Security Refund",
      billValue: Number(item.invoiceAmount || 0),
      cash: -Math.abs(Number(item.returnCashAmount || 0)),
      bank: -Math.abs(Number(item.returnBankAmount || 0)),
      upi: -Math.abs(Number(item.returnUPIAmount || 0)),
      amount: -Math.abs(Number(item.returnCashAmount || 0)) + -Math.abs(Number(item.returnBankAmount || 0)) + -Math.abs(Number(item.returnUPIAmount || 0)),
      totalTransaction: -Math.abs(Number(item.returnCashAmount || 0)) + -Math.abs(Number(item.returnBankAmount || 0)) + -Math.abs(Number(item.returnUPIAmount || 0)),
      remark: "",
      source: "return"
    }));

    const deleteList = (deleteData?.dataSet?.data || []).map(item => ({
      ...item,
      date: item.cancelDate?.split("T")[0],
      invoiceNo: item.invoiceNo,
      customerName: item.customerName,
      Category: "Cancel",
      SubCategory: "Cancellation Refund",
      billValue: Number(item.invoiceAmount || 0),
      cash: -Math.abs(Number(item.deleteCashAmount || 0)),
      bank: -Math.abs(Number(item.deleteBankAmount || 0)),
      upi: -Math.abs(Number(item.deleteUPIAmount || 0)),
      amount: -Math.abs(Number(item.deleteCashAmount || 0)) + -Math.abs(Number(item.deleteBankAmount || 0)) + -Math.abs(Number(item.deleteUPIAmount || 0)),
      totalTransaction: -Math.abs(Number(item.deleteCashAmount || 0)) + -Math.abs(Number(item.deleteBankAmount || 0)) + -Math.abs(Number(item.deleteUPIAmount || 0)),
      remark: "",
      source: "deleted"
    }));

    const mongoList = (mongoData?.data || []).map(tx => {
      const cash = Number(tx.cash || 0);
      const bank = Number(tx.bank || 0);
      const upi = Number(tx.upi || 0);
      const total = cash + bank + upi;
      return {
    //     ...tx,
    //     invoiceNo: tx.invoiceNo || tx.invoice || "",
    //     Category: tx.type,
    //     SubCategory: tx.category,
    //     billValue: Number(tx.amount),
    //     cash, bank, upi,
    //     amount: total,
    //     totalTransaction: total,
    //     source: "mongo"
    //   };
    // });

      ...tx,
  date: tx.date?.split("T")[0] || "",
  invoiceNo: tx.invoiceNo || tx.invoice || "",
  Category: tx.type,
  SubCategory: tx.category,
  SubCategory1: tx.subCategory1 || tx.SubCategory1 || "",
  customerName: tx.customerName || "",   // ✅ include this
  billValue: Number(tx.amount),
  cash: Number(tx.cash),
  bank: Number(tx.bank),
  upi: Number(tx.upi),
  amount: Number(tx.cash) + Number(tx.bank) + Number(tx.upi),
  totalTransaction: Number(tx.cash) + Number(tx.bank) + Number(tx.upi),
  source: "mongo"
};
  });

    // 🔄 FETCH overrides
    let overrideRows = [];
    try {
      const res = await fetch(
        `${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentusers.locCode}`
      );
      const json = await res.json();
      overrideRows = json?.data || [];
    } catch (err) {
      console.warn("⚠️ Override fetch failed:", err.message);
    }

    // 🔄 MAP override data
    const editedMap = new Map();
    overrideRows.forEach(row => {
      const key = String(row.invoiceNo || row.invoice).trim();
      const cash = Number(row.cash || 0);
      const bank = Number(row.bank || 0);
      const upi = Number(row.upi || 0);
      const total = cash + bank + upi;

      editedMap.set(key, {
        ...row,
        invoiceNo: key,
        Category: row.type,
        SubCategory: row.category,
SubCategory1: row.subCategory1 || row.SubCategory1 || "Balance Payable",  // ✅ Add here also

        billValue: Number(row.amount),
        cash, bank, upi,
        amount: total,
        totalTransaction: total,
        source: "edited"
      });
    });

    // 🧠 FINAL MERGE
    const allTws = [...bookingList, ...rentoutList, ...returnList, ...deleteList];
   const finalTws = allTws.map(t => {
  const key = String(t.invoiceNo).trim();
  const override = editedMap.get(key);
  // return override ? { ...t, ...override } : t;
  return override
    ? {
        ...t,                       // 🟢 keep all fields from original TWS
        ...override, 
         SubCategory1: t.SubCategory1 || t.subCategory1 || "",               // 🟡 override cash/bank/upi etc.
        customerName: t.customerName || "",   // ✅ preserve customer name
        date: t.date || "",                   // ✅ preserve date
      }
    : t;
});



    const allTransactions = [...finalTws, ...mongoList];
// const deduped = Array.from(
//   new Map(
//     allTransactions.map((tx) => {
//       const dateKey = new Date(tx.date).toISOString().split("T")[0]; // only yyyy-mm-dd
//       const key = `${tx.invoiceNo || tx._id || tx.locCode}-${dateKey}`;
//       return [key, tx];
//     })
//   ).values()
// );
const deduped = Array.from(
  new Map(
    allTransactions.map((tx) => {
      const dateKey = new Date(tx.date).toISOString().split("T")[0]; // only yyyy-mm-dd
      const key = `${tx.invoiceNo || tx._id || tx.locCode}-${dateKey}-${tx.Category || ""}`; // ✅ Include Category to prevent overwriting
      return [key, tx];
    })
  ).values()
);


   
        setMergedTransactions(deduped); 
    setMongoTransactions(mongoList);
  } catch (err) {
    console.error("❌ Error fetching transactions", err);
  }
};











  const GetCreateCashBank = async (api) => {
    try {
      const response = await fetch(api, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // alert(apiUrl5)

      if (!response.ok) {
        throw new Error('Error saving data');
      }

      const data = await response.json();
      console.log("Data saved successfully:", data);
      setPreOpen(data?.data)
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };
  useEffect(() => {
  }, [])
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    console.log(originalContent);


    document.body.innerHTML = `<html><head><title>Dummy Report</title>
            <style>
                @page { size: tabloid; margin: 10mm; }
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; white-space: nowrap; }
                tr { break-inside: avoid; }
            </style>
        </head><body>${printContent}</body></html>`;

    window.print();
    window.location.reload(); // Reload to restore content
  };

  // Memoizing fetch options
  const fetchOptions = useMemo(() => ({}), []);

  const { data } = useFetch(apiUrl, fetchOptions);//booking
  const { data: data1 } = useFetch(apiUrl1, fetchOptions);//rentout
  const { data: data2 } = useFetch(apiUrl2, fetchOptions);//return
const [mongoTransactions, setMongoTransactions] = useState([]);
const [mergedTransactions, setMergedTransactions] = useState([]);




useEffect(() => {
  if (apiUrl3) {
    fetch(apiUrl3)
      .then(res => res.json())
      .then(res => setMongoTransactions(res.data || []));
  }
}, [apiUrl3]);

  const { data: data4 } = useFetch(apiUrl4, fetchOptions);//all
  // alert(data3);
  // console.log(data2);

  const bookingTransactions = (data?.dataSet?.data || []).map(transaction => {
    const bookingCashAmount = parseInt(transaction?.bookingCashAmount || 0, 10);
    const bookingBankAmount = parseInt(transaction?.bookingBankAmount || 0, 10);
    const bookingUPIAmount = parseInt(transaction?.bookingUPIAmount || 0, 10);
    const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);

    const totalAmount = bookingCashAmount + bookingBankAmount + bookingUPIAmount;

    return {
      ...transaction,
      date: transaction?.bookingDate || null,
      bookingCashAmount,
      bookingBankAmount,
      billValue: transaction.invoiceAmount,

      invoiceAmount,
      bookingBank1: bookingBankAmount,
      TotaltransactionBooking: totalAmount,
      Category: "Booking",
      SubCategory: "Advance",
      totalTransaction: totalAmount,
      cash: bookingCashAmount,
      bank: bookingBankAmount,
      upi: bookingUPIAmount,
      amount: totalAmount,
    };
  });

  const rentOutTransactions = (data1?.dataSet?.data || []).map(transaction => {
    const rentoutCashAmount = parseInt(transaction?.rentoutCashAmount ?? 0, 10);
    const rentoutBankAmount = parseInt(transaction?.rentoutBankAmount ?? 0, 10);
    const invoiceAmount = parseInt(transaction?.invoiceAmount ?? 0, 10);

    const advanceAmount = parseInt(transaction?.advanceAmount ?? 0, 10);
    const rentoutUPIAmount = parseInt(transaction?.rentoutUPIAmount ?? 0, 10);
    const securityAmount = parseInt(transaction?.securityAmount ?? 0, 10);

    return {
      ...transaction,
      date: transaction?.rentOutDate ?? "",
      rentoutCashAmount,
      rentoutBankAmount,
      invoiceAmount,
      billValue: transaction.invoiceAmount,

      securityAmount,
      advanceAmount,
      Balance: invoiceAmount - advanceAmount,
      rentoutUPIAmount,
      Category: "RentOut",
      SubCategory: "Security",
      SubCategory1: "Balance Payable",
      totalTransaction: rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount,
      cash: rentoutCashAmount,
      bank: rentoutBankAmount,
      upi: rentoutUPIAmount,
      amount: rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount,
    };
  });

  const returnOutTransactions = (data2?.dataSet?.data || []).map(transaction => {
    const returnBankAmount = -(parseInt(transaction?.returnBankAmount || 0, 10));
    const returnCashAmount = -(parseInt(transaction?.returnCashAmount || 0, 10));
    const returnUPIAmount = -(parseInt(transaction?.returnUPIAmount || 0, 10));
    const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
    const advanceAmount = parseInt(transaction?.advanceAmount || 0, 10);
    const RsecurityAmount = -(parseInt(transaction?.securityAmount || 0, 10));

    const totalAmount = returnBankAmount + returnCashAmount + returnUPIAmount;

    return {
      ...transaction,
      date: transaction?.returnedDate || null,
      returnBankAmount,
      returnCashAmount,
      returnUPIAmount,
      invoiceAmount,
      advanceAmount,
      billValue: invoiceAmount,
      amount: totalAmount,
      totalTransaction: totalAmount,
      RsecurityAmount,
      Category: "Return",
      SubCategory: "Security Refund",
      cash: returnCashAmount,
      bank: returnBankAmount,
      upi: returnUPIAmount,
    };
  });


  const Transactionsall = (mongoTransactions || []).map(transaction  => ({
  ...transaction,
  locCode: currentusers.locCode,
  date: transaction.date.split("T")[0],
  Category: transaction.type,
  SubCategory: transaction.category,
  billValue: Number(transaction.amount),
  amount: Number(transaction.cash || 0) + Number(transaction.bank || 0) + Number(transaction.upi || 0),
  totalTransaction: Number(transaction.cash || 0) + Number(transaction.bank || 0) + Number(transaction.upi || 0),
  cash: Number(transaction.cash),
  bank: Number(transaction.bank),
  upi: Number(transaction.upi),
  cash1: Number(transaction.cash),
  bank1: Number(transaction.bank),
  Tupi: Number(transaction.upi),
}));


// const Transactionsall = (mongoTransactions || []).map(transaction  => ({
//     ...transaction,
//     locCode: currentusers.locCode,
//     date: transaction.date.split("T")[0],// Correctly extract only the date
//     Category: transaction.type,
//     cash1: transaction.cash,
//     bank1: transaction.bank,
//     // subCategory: transaction.category,
//     SubCategory: transaction.category,
//     billValue: transaction.amount,
//     Tupi: transaction.upi




//   }));




  // alert(Transactionsall);


  const canCelTransactions = (data4?.dataSet?.data || []).map(transaction => ({
    ...transaction,
    date: transaction.cancelDate,
    Category: "Cancel",
    SubCategory: "cancellation Refund",
    billValue: transaction.invoiceAmount,
    amount: parseInt(transaction.deleteUPIAmount) + parseInt(transaction.deleteCashAmount) + parseInt(transaction.deleteBankAmount),
    totalTransaction: parseInt(transaction.deleteUPIAmount) + parseInt(transaction.deleteCashAmount) + parseInt(transaction.deleteBankAmount),
    cash: parseInt(transaction.deleteCashAmount),
    bank: parseInt(transaction.deleteBankAmount),
    upi: parseInt(transaction.deleteUPIAmount),

  }));
  // alert(apiUrl4)
  // console.log("Hi" + data4);
  // alert(canCelTransactions)
  const allTransactions = [...bookingTransactions, ...rentOutTransactions, ...returnOutTransactions, ...canCelTransactions, ...Transactionsall];
  console.log(data4);

  // console.log(allTransactions);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategories[0]);






  // Filter transactions based on category & subcategory
  const selectedCategoryValue = selectedCategory?.value?.toLowerCase() || "all";
  const selectedSubCategoryValue = selectedSubCategory?.value?.toLowerCase() || "all";

  const filteredTransactions = allTransactions.filter((t) =>
    (selectedCategoryValue === "all" || (t.category?.toLowerCase() === selectedCategoryValue || t.Category?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue)) &&
    (selectedSubCategoryValue === "all" || (t.subCategory?.toLowerCase() === selectedSubCategoryValue || t.SubCategory?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.subCategory1?.toLowerCase() === selectedSubCategoryValue || t.SubCategory1?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue))
  );


  const totalBankAmount =
    (filteredTransactions?.reduce((sum, item) =>
      sum +
      (parseInt(item.bookingBank1, 10) || 0) +
      (parseInt(item.bank1, 10) || 0) +
      (parseInt(item.rentoutBankAmount, 10) || 0) +
      (parseInt(item.deleteBankAmount, 10) || 0) * -1 +
      (parseInt(item.returnBankAmount, 10) || 0),
      0
    ) || 0);

  // {parseInt(transaction.rentoutBankAmount) || transaction.bookingBank || parseInt(transaction.returnBankAmount) || parseInt(transaction.bank) || -(parseInt(transaction.deleteBankAmount) + parseInt(transaction.deleteUPIAmount)) || 0}


  const totalCash = (
    filteredTransactions?.reduce((sum, item) =>
      sum +
      (parseInt(item.bookingCashAmount, 10) || 0) +
      (parseInt(item.rentoutCashAmount, 10) || 0) +
      (parseInt(item.cash1, 10) || 0) +
      ((parseInt(item.deleteCashAmount, 10) || 0) * -1) + // Ensure deletion is properly subtracted
      (parseInt(item.returnCashAmount, 10) || 0),
      0
    ) + (parseInt(preOpen?.cash, 10) || 0)


  );


  const totalBankAmount1 =
    (filteredTransactions?.reduce((sum, item) =>
      sum +
      (parseInt(item.rentoutUPIAmount, 10) || 0) +
      (parseInt(item.returnUPIAmount, 10) || 0) +
      (parseInt(item.Tupi, 10) || 0) +
      (parseInt(item.bookingUPIAmount, 10) || 0) +
      (parseInt(item.deleteUPIAmount, 10) || 0) * -1, // Ensure negative value is applied correctly
      0
    ) || 0);


  // const totalBankAmountupi =
  //     (filteredTransactions?.reduce((sum, item) =>
  //         sum +
  //         (parseInt(item.rentoutUPIAmount, 10) || 0) +
  //         (parseInt(item.bookingUPIAmount, 10) || 0) +
  //         (parseInt(item.returnUPIAmount, 10) || 0) +
  //         (parseInt(item.deleteUPIAmount, 10) || 0) * -1,
  //         0
  //     ) || 0);
  // alert(preOpen.bank)

  // Helper function to safely parse amounts
  const parseAmount = (val) => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // CSV Export Mapping
  const exportData = [
    {
      date: "OPENING BALANCE",
      invoiceNo: "",
      customerName: "",
      Category: "",
      SubCategory: "",
      SubCategory1: "",
      amount: parseInt(preOpen?.cash || 0),
      totalTransaction: parseInt(preOpen?.cash || 0),
      securityAmount: "",
      Balance: "",
      remark: "",
      billValue: "",
      cash: parseInt(preOpen?.cash || 0),
      bank: 0,
      upi: 0,
    },
    ...filteredTransactions.map((transaction) => {
      const isReturn = transaction.Category === "Return";
      const isCancel = transaction.Category === "Cancel";

      const cash = isReturn || isCancel
        ? -Math.abs(
          parseAmount(transaction.returnCashAmount) ||
          parseAmount(transaction.deleteCashAmount)
        )
        : parseAmount(transaction.rentoutCashAmount) ||
        parseAmount(transaction.bookingCashAmount) ||
        parseAmount(transaction.cash);

      const bank = isReturn || isCancel
        ? -Math.abs(
          parseAmount(transaction.returnBankAmount) ||
          parseAmount(transaction.deleteBankAmount)
        )
        : parseAmount(transaction.rentoutBankAmount) ||
        parseAmount(transaction.bookingBank1) ||
        parseAmount(transaction.bank);

      const upi = isReturn || isCancel
        ? -Math.abs(
          parseAmount(transaction.returnUPIAmount) ||
          parseAmount(transaction.deleteUPIAmount)
        )
        : parseAmount(transaction.rentoutUPIAmount) ||
        parseAmount(transaction.bookingUPIAmount) ||
        parseAmount(transaction.upi);

      const amount = cash + bank + upi;

      return {
        date: transaction.date,
        invoiceNo: transaction.invoiceNo || transaction.locCode,
        customerName: transaction.customerName || "",
        Category: transaction.Category || transaction.type || "",
        SubCategory: transaction.SubCategory || transaction.category || "",
        SubCategory1: transaction.SubCategory1 || "",
        amount,
        totalTransaction: transaction.totalTransaction || amount,
        securityAmount: transaction.securityAmount || "",
        Balance: transaction.Balance || "",
        remark: transaction.remark || "",
        billValue: Number(transaction.invoiceAmount) || Number(transaction.amount) || 0,
        cash,
        bank,
        upi,
      };
    })
  ];
  //     ...filteredTransactions.map((transaction) => {
  //         const isReturn = transaction.Category === "Return";
  //         const isCancel = transaction.Category === "Cancel";

  //         const cash = isReturn || isCancel
  //             ? -Math.abs(parseInt(transaction.returnCashAmount || transaction.deleteCashAmount || transaction.cash || 0))
  //             : parseInt(transaction.rentoutCashAmount || transaction.bookingCashAmount || transaction.cash || 0);

  //         const bank = isReturn || isCancel
  //             ? -Math.abs(parseInt(transaction.returnBankAmount || transaction.deleteBankAmount || transaction.bank || 0))
  //             : parseInt(transaction.rentoutBankAmount || transaction.bookingBank1 || transaction.bank || 0);

  //         const upi = isReturn || isCancel
  //             ? -Math.abs(parseInt(transaction.returnUPIAmount || transaction.deleteUPIAmount || transaction.upi || 0))
  //             : parseInt(transaction.rentoutUPIAmount || transaction.bookingUPIAmount || transaction.upi || 0);

  //         const amount = cash + bank + upi;

  //         return {
  //             date: transaction.date,
  //             invoiceNo: transaction.invoiceNo || transaction.locCode,
  //             customerName: transaction.customerName || "",
  //             Category: transaction.Category || transaction.type || "",
  //             SubCategory: transaction.SubCategory || transaction.category || "",
  //             SubCategory1: transaction.SubCategory1 || "",
  //             amount,
  //             totalTransaction: transaction.totalTransaction || amount,
  //             securityAmount: transaction.securityAmount || "",
  //             Balance: transaction.Balance || "",
  //             remark: transaction.remark || "",
  //             billValue: transaction.invoiceAmount || transaction.amount || 0,
  //             cash,
  //             bank,
  //             upi,
  //         };
  //     })
  // ];








  const [editingIndex, setEditingIndex] = useState(null);
const [editedTransaction, setEditedTransaction] = useState({});
const [isSyncing, setIsSyncing] = useState(false);


// Called when clicking "Edit"
const handleEditClick = async (transaction, index) => {
  setIsSyncing(true); // Start syncing indicator

  // If no MongoDB ID, sync it first
  if (!transaction._id) {
   const patchedTransaction = {
  ...transaction,
  customerName: transaction.customerName || "",

  locCode: transaction.locCode || currentusers.locCode,
  type: transaction.Category || transaction.type || 'income',
  category: transaction.SubCategory || transaction.category || 'General',
  invoiceNo: transaction.invoiceNo ?? "", 
  paymentMethod: 'cash', // or 'bank', or 'upi'
 // or derive from context if needed
  date: transaction.date || new Date().toISOString().split('T')[0],
  cash: transaction.cash || 0,
  bank: transaction.bank || 0,
  upi: transaction.upi || 0,
};


    try {
      const response = await fetch(`${baseUrl.baseUrl}user/syncTransaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchedTransaction),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Sync failed:", result);
        alert("❌ Failed to sync transaction.\n" + (result?.error || 'Unknown error'));
        setIsSyncing(false);
        return;
      }

      // Add _id to transaction
      transaction._id = result.data._id;
      filteredTransactions[index]._id = result.data._id;
    } catch (err) {
      alert("❌ Sync error: " + err.message);
      setIsSyncing(false);
      return;
    }
  }

  // Done syncing – now enable editing
setEditedTransaction({
  _id: transaction._id,
  cash: transaction.cash || 0,
  bank: transaction.bank || 0,
  upi: transaction.upi || 0,
  date: transaction.date || "",
  customerName: transaction.customerName || "",
  invoiceNo: transaction.invoiceNo || transaction.locCode || "",
  Category: transaction.Category || transaction.type || "",
  SubCategory: transaction.SubCategory || transaction.category || "",
  remark: transaction.remark || "",
  billValue: transaction.billValue || 0,
  totalTransaction: transaction.totalTransaction || 0,
  amount: transaction.amount || 0
});


  setEditingIndex(index);
  setIsSyncing(false);
};





// Called on input change in editable row
const handleInputChange = (field, value) => {
  const numericValue = Number(value) || 0;

  setEditedTransaction(prev => {
    const cash = field === 'cash' ? numericValue : Number(prev.cash) || 0;
    const bank = field === 'bank' ? numericValue : Number(prev.bank) || 0;
    const upi = field === 'upi' ? numericValue : Number(prev.upi) || 0;
    const total = cash + bank + upi;

    return {
      ...prev,
      [field]: numericValue,
      amount: total,
      totalTransaction: total,
    };
  });
};




// Called when clicking "Save"
// const handleSave = async () => {
//   const { _id, cash, bank, upi, date } = editedTransaction;

//   if (!_id) {
//     alert("❌ Cannot update: missing transaction ID.");
//     return;
//   }

//   try {
//     const response = await fetch(`${baseUrl.baseUrl}user/editTransaction/${_id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ cash, bank, upi, date }),
//     });

//     const result = await response.json();

//     if (!response.ok) {
//       console.error("❌ Backend update error:", result); // SHOWS REAL CAUSE
//       alert("❌ Update failed: " + (result?.message || "Failed to update transaction."));
//       return;
//     }

//     alert("✅ Transaction updated successfully.");
//     await handleFetch(); 

    
//     setEditingIndex(null);
//     // After setEditingIndex(null);

//   } catch (error) {
//     console.error("❌ Network error during update:", error);
//     alert("❌ Update failed: " + error.message);
//   }
// };

// const handleSave = async () => {
//   const { _id, cash, bank, upi, date } = editedTransaction;

//   if (!_id) {
//     alert("❌ Cannot update: missing transaction ID.");
//     return;
//   }

//   try {
//     const response = await fetch(`${baseUrl.baseUrl}user/editTransaction/${_id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ cash, bank, upi, date }),
//     });

//     const result = await response.json();

//     if (!response.ok) {
//       alert("❌ Update failed: " + (result?.message || "Unknown error"));
//       return;
//     }

//     alert("✅ Transaction updated.");

//     // 🧠 Ensure numeric values
//     const numericCash = Number(cash) || 0;
//     const numericBank = Number(bank) || 0;
//     const numericUPI = Number(upi) || 0;
//     const total = numericCash + numericBank + numericUPI;

//     // ✅ Update local state without refetching
//     setMongoTransactions((prev) =>
//       prev.map((tx) =>
//         tx._id === _id
//           ? { ...tx, cash: numericCash, bank: numericBank, upi: numericUPI, date, amount: total, totalTransaction: total }
//           : tx
//       )
//     );

//     setEditingIndex(null);
//   } catch (error) {
//     console.error("Update error:", error);
//     alert("❌ Update failed: " + error.message);
//   }
// };


// ------------------------------------------------------------------
// handleSave – writes to backend AND updates both state arrays
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// handleSave – patch state immediately, then re-run handleFetch
// ------------------------------------------------------------------
// const handleSave = async () => {
//   const {
//     _id,
//     cash,
//     bank,
//     upi,
//     date,
//     invoiceNo = "",
//     invoice   = ""
//   } = editedTransaction;

//   if (!_id) {
//     alert("❌ Cannot update: missing transaction ID.");
//     return;
//   }

//   try {
//     const res = await fetch(
//       `${baseUrl.baseUrl}user/editTransaction/${_id}`,
//       {
//         method : "PUT",
//         headers: { "Content-Type": "application/json" },
//         body   : JSON.stringify({ cash, bank, upi, date })
//       }
//     );
//     const json = await res.json();

//     if (!res.ok) {
//       alert("❌ Update failed: " + (json?.message || "Unknown error"));
//       return;
//     }

//     alert("✅ Transaction updated.");

//     /* ----- build updated row ----- */
//     const numericCash = Number(cash) || 0;
//     const numericBank = Number(bank) || 0;
//     const numericUPI  = Number(upi)  || 0;
//     const total       = numericCash + numericBank + numericUPI;

//     const updatedRow = {
//       ...editedTransaction,
//       invoiceNo       : invoiceNo || invoice,
//       cash            : numericCash,
//       bank            : numericBank,
//       upi             : numericUPI,
//       amount          : total,
//       totalTransaction: total,
//       date
//     };

//     /* ----- patch mongoTransactions ----- */
//     setMongoTransactions(prev =>
//       prev.map(tx => (tx._id === _id ? updatedRow : tx))
//     );

//     /* ----- patch mergedTransactions ----- */
//     setMergedTransactions(prev => {
//       const keyStr = String(updatedRow.invoiceNo).trim();
//       const keyNum = Number(updatedRow.invoiceNo);

//     const filtered = prev.filter(t =>
//   String(t.invoiceNo).trim() !== keyStr
// );

     

//       const newArr = [updatedRow, ...filtered];

//       // Debug (optional): inspect what remains
//       console.table(
//         newArr.filter(r =>
//           String(r.invoiceNo).includes(updatedRow.invoiceNo)
//         )
//       );

//       return newArr;          // ← make sure this matches the const above
//     });

//     setEditingIndex(null);

//     /* optional: re-run full fetch to be 100 % in sync */
//     // await handleFetch();

//   } catch (err) {
//     console.error("Update error:", err);
//     alert("❌ Update failed: " + err.message);
//   }
// };



const handleSave = async () => {
  const {
    _id,
    cash,
    bank,
    upi,
    date,
    invoiceNo = "",
    invoice = "",
    
  } = editedTransaction;

  if (!_id) {
    alert("❌ Cannot update: missing transaction ID.");
    return;
  }

  try {
    const res = await fetch(
      `${baseUrl.baseUrl}user/editTransaction/${_id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
       cash, bank, upi, date,
       invoiceNo: invoiceNo || invoice  , 
        customerName: editedTransaction.customerName || ""         // ⭐️ send it!
   })
        
      }
    );
    const json = await res.json();

    if (!res.ok) {
      alert("❌ Update failed: " + (json?.message || "Unknown error"));
      return;
    }

    alert("✅ Transaction updated.");

    // Prepare updated row
    const numericCash = Number(cash) || 0;
    const numericBank = Number(bank) || 0;
    const numericUPI = Number(upi) || 0;
    const total = numericCash + numericBank + numericUPI;

    const updatedRow = {
      ...editedTransaction,
      invoiceNo: invoiceNo || invoice,
      cash: numericCash,
      bank: numericBank,
      upi: numericUPI,
      amount: total,
      totalTransaction: total,
      date
    };

    // Patch Mongo transactions
    setMongoTransactions(prev =>
      prev.map(tx =>
        tx._id === _id ? updatedRow : tx
      )
    );

    // Patch merged transactions (prevent duplicate, update in place)
    setMergedTransactions(prev =>
      prev.map(t =>
        String(t.invoiceNo).trim() === String(updatedRow.invoiceNo).trim()
          ? updatedRow
          : t
      )
    );

    setEditingIndex(null);
  } catch (err) {
    console.error("Update error:", err);
    alert("❌ Update failed: " + err.message);
  }
};







  return (



    <>

      {/* ✅ Page title in browser tab */}
      <Helmet>
        <title> Financial Summary | RootFin</title>
      </Helmet>

      <div>
        <Headers title={"Financial Summary Report"} />
        <div className='ml-[240px]'>
          <div className="p-6 bg-gray-100 min-h-screen">
            {/* Dropdowns */}
            <div className="flex gap-4 mb-6 w-[800px]">
              <div className='w-full flex flex-col '>
                <label htmlFor="">From *</label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-300 py-2 px-3"
                />
              </div>
              <div className='w-full flex flex-col '>
                <label htmlFor="">To *</label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-300 py-2 px-3"
                />
              </div>
              <button
                onClick={handleFetch}
                className="bg-blue-500 h-[40px] mt-6 rounded-md text-white px-10 cursor-pointer"
              >
                Fetch
              </button>

              <div className='w-full'>
                <label htmlFor="">Category</label>
                <Select
                  options={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
              <div className='w-full'>
                <label htmlFor="">Sub Category</label>
                <Select
                  options={subCategories}
                  value={selectedSubCategory}
                  onChange={setSelectedSubCategory}
                />
              </div>
            </div>

            <div ref={printRef}>
              {/* Table */}
              <div className="bg-white p-4 shadow-md rounded-lg">
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table className="w-full border-collapse border rounded-md border-gray-300">


                    <thead style={{ position: "sticky", top: 0, background: "#7C7C7C", color: "white", zIndex: 2 }}>
                      <tr>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Invoice No.</th>
                        <th className="border p-2">Customer Name</th>
                        <th className="border p-2">Category</th>
                        <th className="border p-2">Sub Category</th>
                        <th className="border p-2">Remarks</th>
                        <th className="border p-2">Amount</th>
                        <th className="border p-2">Total Transaction</th>
                        <th className="border p-2">Bill Value</th>
                        <th className="border p-2">Cash</th>
                        <th className="border p-2">Bank</th>
                        <th className="border p-2">UPI</th>
                        <th className='border p-2'>Action</th>
                      </tr>
                    </thead>

                   <tbody>
  {/* Sticky Opening Balance */}
  <tr className="bg-gray-100 font-bold" style={{ position: "sticky", top: "44px", background: "#f3f4f6", zIndex: 1 }}>
    <td colSpan="9" className="border p-2">OPENING BALANCE</td>
    <td className="border p-2">{preOpen.Closecash}</td>
    <td className="border p-2">0</td>
    <td className="border p-2">0</td>
    <td className="border p-2"></td>
  </tr>

  {/* Transactions */}
  {mergedTransactions
    .filter((t) =>
      (selectedCategoryValue === "all" ||
        (t.category?.toLowerCase() === selectedCategoryValue ||
         t.Category?.toLowerCase() === selectedCategoryValue ||
         t.type?.toLowerCase() === selectedCategoryValue)) &&
      (selectedSubCategoryValue === "all" ||
        (t.subCategory?.toLowerCase() === selectedSubCategoryValue ||
         t.SubCategory?.toLowerCase() === selectedSubCategoryValue ||
         t.type?.toLowerCase() === selectedSubCategoryValue ||
         t.subCategory1?.toLowerCase() === selectedSubCategoryValue ||
         t.category?.toLowerCase() === selectedSubCategoryValue))
    )
    .map((transaction, index) => {


      const isEditing = editingIndex === index;
      const t = isEditing ? editedTransaction : transaction;

      return (
        //  <tr key={`${t.invoiceNo || t._id || t.locCode}-${t.date}-${index}`}>

        <tr key={`${t.invoiceNo || t._id || t.locCode}-${new Date(t.date).toISOString().split("T")[0]}-${index}`}>




          {/* DATE */}
          <td className="border p-2">{t.date}</td>

          {/* INVOICE / LOC */}
          <td className="border p-2">{t.invoiceNo || t.locCode}</td>

          {/* CUSTOMER */}
 <td className="border p-2">{t.customerName || t.customer || t.name || "-"}</td>


          {/* CATEGORY */}
          <td className="border p-2">{t.Category || t.type}</td>

          {/* SUB-CATEGORY */}
<td className="border p-2">
  {[t.SubCategory, t.SubCategory1, t.subCategory1].filter(Boolean).join(" + ") || "-"}
</td>



          {/* REMARK */}
          <td className="border p-2">{t.remark}</td>

          {/* AMOUNT */}
          <td className="border p-2">{t.amount}</td>

          {/* TOTAL TXN */}
          <td className="border p-2">{t.totalTransaction}</td>

          {/* BILL VALUE */}
          <td className="border p-2">{t.billValue}</td>

          {/* CASH */}
          <td className="border p-2">
            {isEditing && editedTransaction._id ? (
              <input
                type="number"
                value={editedTransaction.cash}
                onChange={(e) => handleInputChange('cash', e.target.value)}
                className="w-full"
              />
            ) : (
              t.cash
            )}
          </td>

          {/* BANK */}
          <td className="border p-2">
            {isEditing && editedTransaction._id && t.SubCategory !== "Cash to Bank" ? (
              <input
                type="number"
                value={editedTransaction.bank}
                onChange={(e) => handleInputChange('bank', e.target.value)}
                className="w-full"
              />
            ) : (
              t.bank
            )}
          </td>

          {/* UPI */}
          <td className="border p-2">
            {isEditing && editedTransaction._id && t.SubCategory !== "Cash to Bank" ? (
              <input
                type="number"
                value={editedTransaction.upi}
                onChange={(e) => handleInputChange('upi', e.target.value)}
                className="w-full"
              />
            ) : (
              t.upi
            )}
          </td>

          {/* ACTION */}
          <td className="border p-2">
            {isSyncing && editingIndex === index ? (
              <span className="text-gray-400">Syncing...</span>
            ) : isEditing ? (
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => handleEditClick(transaction, index)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
            )}
          </td>
        </tr>
      );
    })
  }

  {/* No transactions fallback */}
  {mergedTransactions.length === 0 && (
    <tr>
      <td colSpan="12" className="text-center border p-4">
        No transactions found
      </td>
    </tr>
  )}
</tbody>


                    {/* Sticky Total Row */}
                    <tfoot>
                      <tr className="bg-white text-center font-semibold" style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 2 }}>
                        <td colSpan="9" className="border px-4 py-2 text-left">Total:</td>
                        <td className="border px-4 py-2">{totalCash}</td>
                        <td className="border px-4 py-2">{totalBankAmount}</td>
                        <td className="border px-4 py-2">{totalBankAmount1}</td>
                        <td className="border px-4 py-2"></td>

                      </tr>
                    </tfoot>

                  </table>
                </div>
              </div>
            </div>

            <button onClick={handlePrint} className="mt-6 w-[200px] float-right cursor-pointer bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
              <span>📥 Take pdf</span>
            </button>

            <CSVLink data={exportData} headers={headers} filename={`${fromDate} to ${toDate} report.csv`}>
              <button className="mt-6 w-[200px] float-right cursor-pointer bg-blue-600 text-white py-2 rounded-lg mr-[30px] flex items-center justify-center gap-2">Export CSV</button>
            </CSVLink>
          </div>
        </div>
      </div>
    </>

  )
}

export default Datewisedaybook  













