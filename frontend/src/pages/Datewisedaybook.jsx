import Headers from '../components/Header.jsx';
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import useFetch from '../hooks/useFetch.jsx';
import baseUrl from '../api/api.js';
import { CSVLink } from 'react-csv';
import { Helmet } from "react-helmet";
import { FiDownload } from "react-icons/fi";



const categories = [
  { value: "all", label: "All" },
  { value: "booking", label: "Booking" },
  { value: "RentOut", label: "Rent Out" },
  { value: "Refund", label: "Refund" },
  { value: "Return", label: "Return" },
  { value: "Cancel", label: "Cancel" },

  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "money transfer", label: "Cash to Bank" },
];

const headers = [
  { label: "Date", key: "date", },
  { label: "Invoice No", key: "invoiceNo" },
  { label: "Customer Name", key: "customerName" },
  { label: "Quantity", key: "quantity" },
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
  { label: "Attachment", key: "attachment" },
];

const subCategories = [
  { value: "all", label: "All" },
  { value: "advance", label: "Advance" },
  { value: "Balance Payable", label: "Balance Payable" },
  { value: "security", label: "Security" },
  { value: "cancellation Refund", label: "Cancellation Refund" },
  { value: "security Refund", label: "Security Refund" },
  { value: "compensation", label: "Compensation" },
  { value: "petty expenses", label: "Petty Expenses" },
  { value: "shoe sales", label: "Shoe Sales" }

];









// const opening = [{ cash: "60000", bank: "54000" }];
const Datewisedaybook = () => {

  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [apiUrl, setApiUrl] = useState("");
  const [apiUrl1, setApiUrl1] = useState("");
  const [apiUrl2, setApiUrl2] = useState("");
  const [preOpen, setPreOpen] = useState([])

  const [apiUrl3, setApiUrl3] = useState("");
  const [apiUrl4, setApiUrl4] = useState("");
  const [apiUrl5, setApiUrl5] = useState("");
  console.log(apiUrl5);

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object


  // ✅ “admin” (and *only* admin) is allowed to edit
  const showAction = (currentusers.power || "").toLowerCase() === "admin";


  const handleFetch = async () => {
    setPreOpen([]);

    const prev = new Date(new Date(fromDate));
    prev.setDate(prev.getDate() - 1);
    // const prevDayStr = prev.toISOString().split("T")[0];

    const prevDayStr = new Date(fromDate) < new Date("2025-01-01")
      ? "2025-01-01"
      : new Date(new Date(fromDate).setDate(new Date(fromDate).getDate() - 1)).toISOString().split("T")[0];

    // Fetch previous day's data for comparison
    await fetchPreviousDayData(prevDayStr);






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
      console.log('[handleFetch] Fetching URLs:', { bookingU, rentoutU, returnU, deleteU, mongoU, openingU });
      const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
        fetch(bookingU), fetch(rentoutU), fetch(returnU), fetch(deleteU), fetch(mongoU)
      ]);
      console.log('[handleFetch] bookingRes:', bookingRes);
      console.log('[handleFetch] rentoutRes:', rentoutRes);
      console.log('[handleFetch] returnRes:', returnRes);
      console.log('[handleFetch] deleteRes:', deleteRes);
      console.log('[handleFetch] mongoRes:', mongoRes);
      if (!mongoRes.ok) {
        const errorText = await mongoRes.text();
        console.error('[handleFetch] mongoRes not ok:', mongoRes.status, errorText);
        throw new Error(`mongoRes failed: ${mongoRes.status} ${errorText}`);
      }
      const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
        bookingRes.json(), rentoutRes.json(), returnRes.json(), deleteRes.json(), mongoRes.json()
      ]);
      console.log('[handleFetch] mongoData:', mongoData);

      const bookingList = (bookingData?.dataSet?.data || []).map(item => ({
        ...item,
        date: item.bookingDate?.split("T")[0],
        invoiceNo: item.invoiceNo,
        customerName: item.customerName,
        quantity: item.quantity || 1,
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



      // ⬇️  ↩︎ only this block changes
      const rentoutList = (rentoutData?.dataSet?.data || []).map(item => {
        /* split the invoice amount correctly */
        const advance = Number(item.advanceAmount || 0);   // NEW – paid at booking stage
        const security = Number(item.securityAmount || 0);   // “Security” line
        const balancePayable =
          Number(item.invoiceAmount || 0) - advance; // “Balance Payable” line
        const totalSplit = security + balancePayable;             // row-span total (12 000 in your example)
        // row-span total

        return {
          ...item,
          date: (item.rentOutDate || "").split("T")[0],
          invoiceNo: item.invoiceNo,
          customerName: item.customerName,
          quantity: item.quantity || 1,

          /* labels for the two lines */
          Category: "RentOut",
          SubCategory: "Security",          // line-1 label
          SubCategory1: "Balance Payable",   // line-2 label

          /* amounts shown in the table */
          securityAmount: security,
          Balance: balancePayable,

          billValue: Number(item.invoiceAmount || 0),

          /* keep your original payment-method values */
          cash: Number(item.rentoutCashAmount || 0),
          bank: Number(item.rentoutBankAmount || 0),
          upi: Number(item.rentoutUPIAmount || 0),

          /* row-span total used in the first line */
          totalTransaction: totalSplit,

          /* leave the old field ‘amount’ untouched (if another part of the code still relies on it) */
          amount: totalSplit,

          remark: "",
          source: "rentout"
        };
      });


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
            // eslint-disable-next-line no-unused-vars
        const total = cash + bank + upi;
        return {


          ...tx,
          date: tx.date?.split("T")[0] || "",
          // invoiceNo: tx.invoiceNo || tx.invoice || "",
          Category: tx.type,
          SubCategory: tx.category,
          SubCategory1: tx.subCategory1 || tx.SubCategory1 || "",
          customerName: tx.customerName || "",   // ✅ include this
          billValue: Number(tx.billValue ?? tx.invoiceAmount ?? tx.amount),
          cash: Number(tx.cash),
          bank: Number(tx.bank),
          upi: Number(tx.upi),
          amount: Number(tx.cash) + Number(tx.bank) + Number(tx.upi),
          totalTransaction: Number(tx.cash) + Number(tx.bank) + Number(tx.upi),
          source: "mongo"
        };
      });

      // 🔄 FETCH overrides
/* ------- inside handleFetch, replacing your current mongoList map ------- */



      
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

          billValue: Number(row.billValue ?? row.invoiceAmount ?? 0),
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
        const isRentOut =
          (t.Category || t.category || '').toLowerCase() === 'rentout';

        // return override ? { ...t, ...override } : t;
        return override
          ? {
            ...t,                       // 🟢 keep all fields from original TWS
            ...override,
            Category: override.Category || t.Category || "",
            SubCategory: override.SubCategory || override.category || t.SubCategory || t.category || "",
            SubCategory1: override.SubCategory1 || override.subCategory1 || t.SubCategory1 || t.subCategory1 || "",           // 🟡 override cash/bank/upi etc.
            customerName: override.customerName || t.customerName || "",
            date: override.date || t.date || "",


            securityAmount: isRentOut
              ? Number(override.securityAmount ?? t.securityAmount ?? 0)
              : 0,

            Balance: isRentOut
              ? Number(override.Balance ?? t.Balance ?? 0)
              : 0,

            // Recalculate amount + totalTransaction accordingly
            amount: Number(override.amount ?? t.amount),




            totalTransaction: isRentOut
              ? Number(override.securityAmount ?? t.securityAmount ?? 0) + Number(override.Balance ?? t.Balance ?? 0)
              : Number(override.totalTransaction ?? t.totalTransaction ?? override.cash + override.bank + override.upi)
            // ✅ preserve date
          }
          : t;
      });



            const allTransactions = [...finalTws, ...mongoList];
     
      // Improved deduplication logic that preserves multiple transactions per invoice
      const transactionMap = new Map();
      
      allTransactions.forEach((tx) => {
        const dateKey = new Date(tx.date).toISOString().split("T")[0]; // only yyyy-mm-dd
        const invoiceKey = tx.invoiceNo || tx._id || tx.locCode;
        const category = tx.Category || tx.type || "";
        
        // Create a unique key that includes category to allow multiple transactions per invoice
        const key = `${invoiceKey}-${dateKey}-${category}`;
        
        // If we already have a transaction with this exact key, prioritize the one with _id (edited ones)
        if (transactionMap.has(key)) {
          const existing = transactionMap.get(key);
          // If current transaction has _id and existing doesn't, or if current is from mongoList, replace
          if ((tx._id && !existing._id) || tx.source === "mongo" || tx.source === "edited") {
            transactionMap.set(key, tx);
          }
        } else {
          transactionMap.set(key, tx);
        }
      });
      
      const deduped = Array.from(transactionMap.values());



      console.log('🔍 Debug - RentOut transactions:', rentoutList.filter(t => t.Category === 'RentOut'));
      console.log('🔍 Debug - All transactions:', deduped.length);
      console.log('🔍 Debug - RentOut in deduped:', deduped.filter(t => t.Category === 'RentOut'));
      
      setMergedTransactions(deduped);
      setMongoTransactions(mongoList);
    } catch (err) {
      console.error("❌ Error fetching transactions", err);
      console.error('[handleFetch] Error details:', err && err.stack ? err.stack : err);
    }
  };











  const fetchPreviousDayData = async (prevDayStr) => {
    try {
      const twsBase = "https://rentalapi.rootments.live/api/GetBooking";
      const bookingU = `${twsBase}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${prevDayStr}&DateTo=${prevDayStr}`;
      const rentoutU = `${twsBase}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${prevDayStr}&DateTo=${prevDayStr}`;
      const returnU = `${twsBase}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${prevDayStr}&DateTo=${prevDayStr}`;
      const deleteU = `${twsBase}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${prevDayStr}&DateTo=${prevDayStr}`;
      const mongoU = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${prevDayStr}&DateTo=${prevDayStr}`;

      const [bookingRes, rentoutRes, returnRes, deleteRes, mongoRes] = await Promise.all([
        fetch(bookingU), fetch(rentoutU), fetch(returnU), fetch(deleteU), fetch(mongoU)
      ]);

      const [bookingData, rentoutData, returnData, deleteData, mongoData] = await Promise.all([
        bookingRes.json(), rentoutRes.json(), returnRes.json(), deleteRes.json(), mongoRes.json()
      ]);

      // Process previous day's data similar to current day
      const prevBookingList = (bookingData?.dataSet?.data || []).map(item => ({
        cash: Number(item.bookingCashAmount || 0),
        bank: Number(item.bookingBankAmount || 0),
        upi: Number(item.bookingUPIAmount || 0),
      }));

      const prevRentoutList = (rentoutData?.dataSet?.data || []).map(item => ({
        cash: Number(item.rentoutCashAmount || 0),
        bank: Number(item.rentoutBankAmount || 0),
        upi: Number(item.rentoutUPIAmount || 0),
      }));

      const prevReturnList = (returnData?.dataSet?.data || []).map(item => ({
        cash: -Math.abs(Number(item.returnCashAmount || 0)),
        bank: -Math.abs(Number(item.returnBankAmount || 0)),
        upi: -Math.abs(Number(item.returnUPIAmount || 0)),
      }));

      const prevDeleteList = (deleteData?.dataSet?.data || []).map(item => ({
        cash: -Math.abs(Number(item.deleteCashAmount || 0)),
        bank: -Math.abs(Number(item.deleteBankAmount || 0)),
        upi: -Math.abs(Number(item.deleteUPIAmount || 0)),
      }));

      const prevMongoList = (mongoData?.data || []).map(tx => ({
        cash: Number(tx.cash || 0),
        bank: Number(tx.bank || 0),
        upi: Number(tx.upi || 0),
      }));

      const allPrevTransactions = [...prevBookingList, ...prevRentoutList, ...prevReturnList, ...prevDeleteList, ...prevMongoList];

      const prevTotals = allPrevTransactions.reduce((acc, tx) => ({
        transactions: acc.transactions + 1,
        cash: acc.cash + tx.cash,
        bank: acc.bank + tx.bank,
        upi: acc.upi + tx.upi,
      }), { transactions: 0, cash: 0, bank: 0, upi: 0 });

      setPreviousDayData(prevTotals);
    } catch (error) {
      console.error("Error fetching previous day data:", error);
      setPreviousDayData({ transactions: 0, cash: 0, bank: 0, upi: 0 });
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
    // Auto-load data when component mounts with default date range
    if (fromDate && toDate) {
      handleFetch();
    }
  }, [fromDate, toDate])
  const printRef = useRef(null);




  /* ▼ ADD THIS – right after printRef */
  useEffect(() => {
    // If Chrome inserts a “chrome://print” history entry,
    // jump forward again as soon as the preview closes.
    const skipBack = () => setTimeout(() => window.history.forward(), 0);
    window.addEventListener("afterprint", skipBack);
    return () => window.removeEventListener("afterprint", skipBack);
  }, []);

  
  const handlePrint = () => {
    if (!printRef.current) return;

    const tableHtml = printRef.current.innerHTML;

    // 1 ▸ open a throw-away window
    const w = window.open("", "_blank", "width=900,height=600");

    // 2 ▸ write the printable markup
    w.document.write(`
    <html>
      <head>
        <title>Financial Summary</title>
        <style>
          @page { margin: 10mm; }
          body  { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th,td { border: 1px solid #000; padding: 4px; white-space: nowrap; }
          tr    { break-inside: avoid; }
        </style>
      </head>
      <body>${tableHtml}</body>
    </html>
  `);
    w.document.close();

    // 3 ▸ print and close
    w.focus();
    w.print();
    w.close();
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
      console.log('[useEffect] Fetching apiUrl3:', apiUrl3);
      fetch(apiUrl3)
        .then(res => {
          if (!res.ok) {
            console.error('[useEffect] apiUrl3 fetch failed:', res.status, res.statusText);
          }
          return res.json();
        })
        .then(res => {
          console.log('[useEffect] apiUrl3 response:', res);
          setMongoTransactions(res.data || []);
        })
        .catch(err => {
          console.error('[useEffect] apiUrl3 fetch error:', err);
        });
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


  const Transactionsall = (mongoTransactions || []).map(transaction => ({
    ...transaction,
    locCode: currentusers.locCode,
    date: transaction.date.split("T")[0],
    Category: transaction.type,
    SubCategory: transaction.category,
    billValue: Number(                                   // ← new
      transaction.billValue ??
      transaction.invoiceAmount ??
      transaction.amount
    ),
    amount: Number(transaction.cash || 0) + Number(transaction.bank || 0) + Number(transaction.upi || 0),
    totalTransaction: Number(transaction.cash || 0) + Number(transaction.bank || 0) + Number(transaction.upi || 0),
    cash: Number(transaction.cash),
    bank: Number(transaction.bank),
    upi: Number(transaction.upi),
    cash1: Number(transaction.cash),
    bank1: Number(transaction.bank),
    Tupi: Number(transaction.upi),
  }));




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
  const [searchTerm, setSearchTerm] = useState("");
  const [previousDayData, setPreviousDayData] = useState({
    transactions: 0,
    cash: 0,
    bank: 0,
    upi: 0
  });






  // Filter transactions based on category & subcategory
  const selectedCategoryValue = selectedCategory?.value?.toLowerCase() || "all";
  const selectedSubCategoryValue = selectedSubCategory?.value?.toLowerCase() || "all";

  // const filteredTransactions = allTransactions.filter((t) =>
  //   (selectedCategoryValue === "all" || (t.category?.toLowerCase() === selectedCategoryValue || t.Category?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue)) &&
  //   (selectedSubCategoryValue === "all" || (t.subCategory?.toLowerCase() === selectedSubCategoryValue || t.SubCategory?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.subCategory1?.toLowerCase() === selectedSubCategoryValue || t.SubCategory1?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue))
  // );
  const filteredTransactions = allTransactions.filter((t) =>
    (selectedCategoryValue === "all" ||
      t.category?.toLowerCase() === selectedCategoryValue ||
      t.Category?.toLowerCase() === selectedCategoryValue ||
      t.type?.toLowerCase() === selectedCategoryValue) &&
    (selectedSubCategoryValue === "all" ||
      t.subCategory?.toLowerCase() === selectedSubCategoryValue ||
      t.SubCategory?.toLowerCase() === selectedSubCategoryValue ||
      t.type?.toLowerCase() === selectedSubCategoryValue ||
      t.category?.toLowerCase() === selectedSubCategoryValue ||
      // ✅ Only check subCategory1 if RentOut
      (
        (t.Category?.toLowerCase() === "rentout" || t.category?.toLowerCase() === "rentout") &&
        (t.subCategory1?.toLowerCase() === selectedSubCategoryValue ||
          t.SubCategory1?.toLowerCase() === selectedSubCategoryValue)
      )
    )
  );






  /* ─── helpers ───────────────────────────────────────────── */
  /* ─── helper used only for the footer totals ───────────── */
  const toNumber = (v) => (isNaN(+v) ? 0 : +v);

  


  const displayedRows = mergedTransactions.filter((t) => {
    const category = (t.Category ?? t.type ?? "").toLowerCase();
    const subCategory = (t.SubCategory ?? "").toLowerCase();
    const subCategory1 = (t.SubCategory1 ?? "").toLowerCase();
    const isRentOut = category === "rentout";

    const matchesCategory =
      selectedCategoryValue === "all" || category === selectedCategoryValue;

    const matchesSubCategory =
      selectedSubCategoryValue === "all" ||
      subCategory === selectedSubCategoryValue ||
      (isRentOut && subCategory1 === selectedSubCategoryValue); // ✅ only include if RentOut

    // Search term filtering
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      (t.customerName || "").toLowerCase().includes(searchLower) ||
      (t.customer || "").toLowerCase().includes(searchLower) ||
      (t.name || "").toLowerCase().includes(searchLower) ||
      (t.invoiceNo || "").toLowerCase().includes(searchLower) ||
      (t.Category || "").toLowerCase().includes(searchLower) ||
      (t.category || "").toLowerCase().includes(searchLower) ||
      (t.type || "").toLowerCase().includes(searchLower) ||
      (t.SubCategory || "").toLowerCase().includes(searchLower) ||
      (t.subCategory || "").toLowerCase().includes(searchLower);

    return matchesCategory && matchesSubCategory && matchesSearch;
  });


  /* helper just above the reducer */
  const openingCash = toNumber(
    preOpen?.Closecash ??   // ← use Closecash first
    preOpen?.cash     ??    // fall back to cash if you rename later
    0
  );

  const totals = displayedRows.reduce(
    (acc, r) => ({
      cash: acc.cash + toNumber(r.cash),
      bank: acc.bank + toNumber(r.bank),
      upi : acc.upi  + toNumber(r.upi),
    }),
    { cash: openingCash, bank: 0, upi: 0 }   // ✅ opening included
  );

  const totalCash = totals.cash;   // use these in <tfoot>
  const totalBankAmount = totals.bank;
  const totalUpiAmount = totals.upi;

  // Helper functions for growth calculations
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '→';
  };







  // Helper function to safely parse amounts
  // const parseAmount = (val) => {
  //   const parsed = parseInt(val);
  //   return isNaN(parsed) ? 0 : parsed;
  // };

  /* ─── helper used by the CSV export ──────────────────────
     strips commas, currency symbols, spaces, etc.            */
  const num = (v) => {
    if (v === null || v === undefined) return 0;
    const cleaned = String(v).replace(/[^0-9.-]/g, ""); // keep only 0-9 . -
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  /* ---------- opening balance ---------- */
  const exportData = [
    {
      date: "OPENING BALANCE",
      invoiceNo: "",
      customerName: "",
      quantity: "",
      Category: "",
      SubCategory: "",
      SubCategory1: "",
      amount: openingCash,
      totalTransaction: openingCash,
      securityAmount: "",
      Balance: "",
      remark: "",
      billValue: "",
      cash: openingCash,
      bank: 0,
      upi: 0,
      attachment: "",
    },

    /* ---------- transactions -------------- */
    ...(mergedTransactions.length ? mergedTransactions : filteredTransactions)
      .filter(
        (t) =>
          (selectedCategoryValue === "all" ||
            (t.Category ?? t.type ?? "").toLowerCase() === selectedCategoryValue) &&
          (selectedSubCategoryValue === "all" ||
            (t.SubCategory ?? "").toLowerCase() === selectedSubCategoryValue ||
            (t.SubCategory1 ?? "").toLowerCase() === selectedSubCategoryValue)
      )
      .map((t) => {
        const isReturn = t.Category === "Return";
        const isCancel = t.Category === "Cancel";
        const isRent = t.Category === "RentOut";

        /* values exactly as shown on the table -------------------------- */
        let cash = num(t.cash);
        let bank = num(t.bank);
        let upi = num(t.upi);

        /* flip sign for refunds / cancellations ------------------------ */
        if (isReturn || isCancel) {
          cash = -Math.abs(cash);
          bank = -Math.abs(bank);
          upi = -Math.abs(upi);
        }

        /* Rent-out rows use Security + Balance as amount ---------------- */
        const securityAmount = num(t.securityAmount);
        const balance = num(t.Balance);
        const amount = isRent ? securityAmount + balance
          : cash + bank + upi;

        return {
          date: t.date,
          invoiceNo: t.invoiceNo || t.locCode || "",
          customerName: t.customerName || "",
          quantity: t.quantity || 1,
          Category: t.Category || t.type || "",
          SubCategory: t.SubCategory || t.category || "",
          SubCategory1: t.SubCategory1 || t.subCategory1 || "",
          amount,
          totalTransaction: t.totalTransaction ?? amount,
          securityAmount: isRent ? securityAmount : "",
          Balance: isRent ? balance : "",
          remark: t.remark || "",
          billValue: num(t.billValue || t.invoiceAmount || t.amount || amount),
          cash,
          bank,
          upi,
          attachment: t.attachment ? "Yes" : "No",
        };
      }),
  ];


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
        // invoiceNo: transaction.invoiceNo ?? "",
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



    setEditedTransaction({
      /* ---------------- editable fields ---------------- */
      _id: transaction._id,
      cash: transaction.cash || 0,
      bank: transaction.bank || 0,
      upi: transaction.upi || 0,

      /* ---------------- split amounts (Rent-out only) -- */
      securityAmount: transaction.securityAmount || 0,
      Balance: transaction.Balance || 0,

      /* ---------------- metadata you already keep ------ */
      date: transaction.date || "",
      customerName: transaction.customerName || "",
      invoiceNo: transaction.invoiceNo || transaction.locCode || "",
      Category: transaction.Category || transaction.type || "",
      SubCategory: transaction.SubCategory || transaction.category || "",
      SubCategory1: transaction.SubCategory1 || transaction.subCategory1 || "",
      remark: transaction.remark || "",
      billValue: transaction.billValue || 0,

      /* ---------------- totals (preserve originals, but
           recompute for Rent-out so the row-span cell shows
           Security + Balance) ---------------------------- */
      totalTransaction:
        (transaction.Category === "RentOut")
          ? (Number(transaction.securityAmount || 0) +
            Number(transaction.Balance || 0))
          : (Number(transaction.totalTransaction) ||
            Number(transaction.amount) ||
            (Number(transaction.cash || 0) +
              Number(transaction.bank || 0) +
              Number(transaction.upi || 0))),

      amount:
        (transaction.Category === "RentOut")
          ? (Number(transaction.securityAmount || 0) +
            Number(transaction.Balance || 0))
          : (transaction.amount || 0)
    });






    setEditingIndex(index);
    setIsSyncing(false);
  };




  const handleInputChange = (field, raw) => {
    /* 1 ▸ keep user-typing comfort */
    if (raw === '' || raw === '-') {
      setEditedTransaction(prev => ({ ...prev, [field]: raw }));
      return;                       // don’t recalc yet
    }

    /* 2 ▸ parse the keystroke */
    const numericValue = Number(raw);
    if (isNaN(numericValue)) return;

    setEditedTransaction(prev => {
      /* ── your original recompute logic ───────────────── */
      const cash = field === 'cash' ? numericValue : Number(prev.cash) || 0;
      const bank = field === 'bank' ? numericValue : Number(prev.bank) || 0;
      const upi = field === 'upi' ? numericValue : Number(prev.upi) || 0;

      const security = field === 'securityAmount'
        ? numericValue
        : Number(prev.securityAmount) || 0;

      const balance = field === 'Balance'
        ? numericValue
        : Number(prev.Balance) || 0;

      const isRentOut = (prev.Category || '').toLowerCase() === 'rentout';
      const splitTotal = security + balance;
      const payTotal = cash + bank + upi;

      return {
        ...prev,
        [field]: numericValue,
        cash, bank, upi,
        securityAmount: security,
        Balance: balance,
        amount: isRentOut ? splitTotal : payTotal,
        totalTransaction: isRentOut ? splitTotal : payTotal,
      };
    });
  };




  const handleSave = async () => {
    const {
      _id,
      cash, bank, upi,
      date,
      invoiceNo = "",
      invoice = "",
      customerName,
      securityAmount,
      Balance,
      paymentMethod,
    } = editedTransaction;

    if (!_id) {
      alert("❌ Cannot update: missing transaction ID.");
      return;
    }

    try {
      const numSec = Number(securityAmount) || 0;
      const numBal = Number(Balance) || 0;

      let adjCash = Number(cash) || 0;
      let adjBank = Number(bank) || 0;
      let adjUpi = Number(upi) || 0;

      /* 🔸 Keep negatives for Return / Cancel rows */
      const negRow = ["return", "cancel"].includes(
        (editedTransaction.Category || "").toLowerCase()
      );
      if (negRow) {
        adjCash = -Math.abs(adjCash);
        adjBank = -Math.abs(adjBank);
        adjUpi = -Math.abs(adjUpi);
      }

      const isRentOut = editedTransaction.Category === "RentOut";
      const originalBillValue = editedTransaction.billValue;
      const computedTotal = isRentOut
        ? numSec + numBal
        : adjCash + adjBank + adjUpi;

      /* Balance one payment column (your original rule) */
      const paySum = adjCash + adjBank + adjUpi;
      if (!isRentOut && paySum !== computedTotal) {
        if (adjCash !== 0) { adjCash = computedTotal; adjBank = adjUpi = 0; }
        else if (adjBank !== 0) { adjBank = computedTotal; adjCash = adjUpi = 0; }
        else { adjUpi = computedTotal; adjCash = adjBank = 0; }
      }

      const payload = {
        cash: adjCash,
        bank: adjBank,
        upi: adjUpi,
        date,
        invoiceNo: invoiceNo || invoice,
        customerName: customerName || "",
        paymentMethod,
        securityAmount: numSec,
        Balance: numBal,
        billValue: originalBillValue,
        amount: computedTotal,
        totalTransaction: computedTotal,
        type: editedTransaction.Category || "RentOut",
        category: editedTransaction.SubCategory || "Security",
        subCategory1: editedTransaction.SubCategory1 || "Balance Payable",
      };

      const res = await fetch(`${baseUrl.baseUrl}user/editTransaction/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ Update failed: " + (json?.message || "Unknown error"));
        return;
      }
      alert("✅ Transaction updated.");

      /* Patch local arrays */
      const updatedRow = {
        ...editedTransaction,
        cash: adjCash,
        bank: adjBank,
        upi: adjUpi,
        securityAmount: numSec,
        Balance: numBal,
        amount: computedTotal,
        totalTransaction: computedTotal,
        billValue: originalBillValue,
        date,
        invoiceNo: invoiceNo || invoice,
        source: "edited", // Mark as edited for proper deduplication
      };

      setMongoTransactions(prev =>
        prev.map(tx => (tx._id === _id ? updatedRow : tx))
      );
      setMergedTransactions(prev =>
        prev.map(t => (t._id === _id ? updatedRow : t))
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
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-800">Financial Summary Report</h1>
              <p className="text-gray-600 mt-1">View and manage your financial transactions</p>
            </div>

            {/* Dashboard Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Total Transactions Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                        <p className="text-2xl font-semibold text-gray-900">{displayedRows.length}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getGrowthColor(calculateGrowth(displayedRows.length, previousDayData.transactions))}`}>
                        {getGrowthIcon(calculateGrowth(displayedRows.length, previousDayData.transactions))} {Math.abs(calculateGrowth(displayedRows.length, previousDayData.transactions)).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">vs yesterday</div>
                    </div>
                  </div>
                </div>

                {/* Total Cash Flow Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Cash Flow</p>
                        <p className="text-2xl font-semibold text-green-600">₹{Math.round(totalCash)?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getGrowthColor(calculateGrowth(totalCash, previousDayData.cash))}`}>
                        {getGrowthIcon(calculateGrowth(totalCash, previousDayData.cash))} {Math.abs(calculateGrowth(totalCash, previousDayData.cash)).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">vs yesterday</div>
                    </div>
                  </div>
                </div>

                {/* Total Bank Flow Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Bank Flow</p>
                        <p className="text-2xl font-semibold text-blue-600">₹{Math.round(totalBankAmount)?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getGrowthColor(calculateGrowth(totalBankAmount, previousDayData.bank))}`}>
                        {getGrowthIcon(calculateGrowth(totalBankAmount, previousDayData.bank))} {Math.abs(calculateGrowth(totalBankAmount, previousDayData.bank)).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">vs yesterday</div>
                    </div>
                  </div>
                </div>

                {/* Total UPI Flow Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total UPI Flow</p>
                        <p className="text-2xl font-semibold text-purple-600">₹{Math.round(totalUpiAmount)?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getGrowthColor(calculateGrowth(totalUpiAmount, previousDayData.upi))}`}>
                        {getGrowthIcon(calculateGrowth(totalUpiAmount, previousDayData.upi))} {Math.abs(calculateGrowth(totalUpiAmount, previousDayData.upi)).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">vs yesterday</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Top Categories Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
                  <div className="space-y-3">
                    {(() => {
                      const categoryCounts = {};
                      displayedRows.forEach(row => {
                        const category = row.Category || row.type || 'Other';
                        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                      });
                      return Object.entries(categoryCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([category, count]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{category}</span>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Payment Method Distribution Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Cash</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(totalCash) > 0 ? Math.round((totalCash / (totalCash + totalBankAmount + totalUpiAmount)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Bank</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(totalBankAmount) > 0 ? Math.round((totalBankAmount / (totalCash + totalBankAmount + totalUpiAmount)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">UPI</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(totalUpiAmount) > 0 ? Math.round((totalUpiAmount / (totalCash + totalBankAmount + totalUpiAmount)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Range Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">From Date</span>
                      <span className="text-sm font-medium text-gray-900">{fromDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">To Date</span>
                      <span className="text-sm font-medium text-gray-900">{toDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Opening Balance</span>
                      <span className="text-sm font-medium text-blue-600">₹{openingCash?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Net Flow</span>
                      <span className={`text-sm font-medium ${(totalCash + totalBankAmount + totalUpiAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(totalCash + totalBankAmount + totalUpiAmount)?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                {/* Search Bar */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Transactions</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by customer name, invoice number, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date *</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <Select
                      options={categories}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      className="text-sm"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '40px',
                          borderColor: '#d1d5db',
                          '&:hover': { borderColor: '#9ca3af' }
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                          color: state.isSelected ? 'white' : '#374151'
                        })
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                    <Select
                      options={subCategories}
                      value={selectedSubCategory}
                      onChange={setSelectedSubCategory}
                      className="text-sm"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '40px',
                          borderColor: '#d1d5db',
                          '&:hover': { borderColor: '#9ca3af' }
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                          color: state.isSelected ? 'white' : '#374151'
                        })
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleFetch}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      Fetch Data
                    </button>
                  </div>
                </div>
              </div>

            {/* Table Section */}
            <div ref={printRef} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Financial Transactions</h2>
              </div>
              <div className="overflow-x-auto" style={{ maxHeight: "600px" }}>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPI</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment</th>
                        {showAction && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
                      </tr>
                    </thead>

                    {/* ───────────────────────────── tbody ───────────────────────────── */}
                    <tbody>
                      {/* opening balance row */}
                      <tr className="bg-blue-50 border-b border-blue-200">
                        <td colSpan="10" className="px-4 py-3 text-sm font-semibold text-blue-800">
                          OPENING BALANCE
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-800">₹{preOpen.Closecash || 0}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-800">₹0</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-800">₹0</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                        {showAction && <td className="px-4 py-3"></td>}
                      </tr>

                      {/* transactions */}
                      {(() => {
                        const filtered = mergedTransactions.filter(
                          (t) => {
                            // Category and subcategory filtering
                            const matchesCategory = selectedCategoryValue === "all" ||
                              t.category?.toLowerCase() === selectedCategoryValue ||
                              t.Category?.toLowerCase() === selectedCategoryValue ||
                              t.type?.toLowerCase() === selectedCategoryValue;
                            
                            const matchesSubCategory = selectedSubCategoryValue === "all" ||
                              t.subCategory?.toLowerCase() === selectedSubCategoryValue ||
                              t.SubCategory?.toLowerCase() === selectedSubCategoryValue ||
                              t.type?.toLowerCase() === selectedSubCategoryValue ||
                              t.subCategory1?.toLowerCase() === selectedSubCategoryValue ||
                              t.SubCategory1?.toLowerCase() === selectedSubCategoryValue ||
                              t.category?.toLowerCase() === selectedSubCategoryValue;
                            
                            // Search term filtering
                            const searchLower = searchTerm.toLowerCase();
                            const matchesSearch = searchTerm === "" || 
                              (t.customerName || "").toLowerCase().includes(searchLower) ||
                              (t.customer || "").toLowerCase().includes(searchLower) ||
                              (t.name || "").toLowerCase().includes(searchLower) ||
                              (t.invoiceNo || "").toLowerCase().includes(searchLower) ||
                              (t.Category || "").toLowerCase().includes(searchLower) ||
                              (t.category || "").toLowerCase().includes(searchLower) ||
                              (t.type || "").toLowerCase().includes(searchLower) ||
                              (t.SubCategory || "").toLowerCase().includes(searchLower) ||
                              (t.subCategory || "").toLowerCase().includes(searchLower);
                            
                            return matchesCategory && matchesSubCategory && matchesSearch;
                          }
                        );
                        
                        console.log('🔍 Debug - Filtered transactions:', filtered.length);
                        console.log('🔍 Debug - RentOut in filtered:', filtered.filter(t => t.Category === 'RentOut'));
                        console.log('🔍 Debug - Selected category:', selectedCategoryValue);
                        console.log('🔍 Debug - Selected subcategory:', selectedSubCategoryValue);
                        
                        return filtered;
                      })()
                        .map((transaction, index) => {
                          const isEditing = editingIndex === index;
                          const t = isEditing ? editedTransaction : transaction;

                          /* ───────────── RentOut (two stacked rows) ───────────── */
                          if (t.Category === "RentOut") {
                            return (
                              <>
                                {/* security line */}
                                <tr key={`${index}-sec`} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{t.date}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{t.invoiceNo || t.locCode}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {t.customerName || t.customer || t.name || "-"}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm text-gray-900">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        value={editedTransaction.quantity}
                                        onChange={(e) =>
                                          handleInputChange("quantity", e.target.value)
                                        }
                                        className="w-full"
                                      />
                                    ) : (
                                      t.quantity
                                    )}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm text-gray-900">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {t.Category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {t.SubCategory}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{t.remark}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        value={editedTransaction.securityAmount}
                                        onChange={(e) =>
                                          handleInputChange("securityAmount", e.target.value)
                                        }
                                        className="w-full"
                                      />
                                    ) : (
                                      t.securityAmount
                                    )}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm font-medium text-gray-900">
                                    ₹{t.totalTransaction?.toLocaleString() || 0}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm font-medium text-gray-900">
                                    ₹{t.billValue?.toLocaleString() || 0}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm font-medium text-green-600">
                                    {isEditing && editedTransaction._id ? (
                                      <input
                                        type="number"
                                        step="any"
                                        value={editedTransaction.cash}
                                        onChange={(e) =>
                                          handleInputChange("cash", e.target.value)
                                        }
                                        className="w-full"
                                      />
                                    ) : (
                                      t.cash
                                    )}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm font-medium text-blue-600">
                                    {isEditing && editedTransaction._id ? (
                                      <input
                                        type="number"
                                        step="any"
                                        value={editedTransaction.bank}
                                        onChange={(e) =>
                                          handleInputChange("bank", e.target.value)
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      `₹${t.bank?.toLocaleString() || 0}`
                                    )}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm font-medium text-purple-600">
                                    {isEditing && editedTransaction._id ? (
                                      <input
                                        type="number"
                                        step="any"
                                        value={editedTransaction.upi}
                                        onChange={(e) =>
                                          handleInputChange("upi", e.target.value)
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      `₹${t.upi?.toLocaleString() || 0}`
                                    )}
                                  </td>
                                  <td rowSpan="2" className="px-4 py-3 text-sm">
                                    {t.attachment && t._id ? (
                                      <a
                                        href={`${baseUrl.baseUrl}user/transaction/${t._id}/attachment`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        View
                                      </a>
                                    ) : (
                                      "-"
                                    )}
                                  </td>

                                  {/* row-span action cell, only for admins */}
                                  {showAction && (
                                    <td rowSpan="2" className="px-4 py-3">
                                      {isSyncing && editingIndex === index ? (
                                        <span className="text-xs text-gray-400">Syncing…</span>
                                      ) : isEditing ? (
                                        <button
                                          onClick={handleSave}
                                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                          Save
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleEditClick(transaction, index)}
                                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>

                                {/* balance line */}
                                <tr key={`${index}-bal`} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{t.date}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{t.invoiceNo || t.locCode}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {t.customerName || t.customer || t.name || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      {t.SubCategory1}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{t.remark}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        value={editedTransaction.Balance}
                                        onChange={(e) =>
                                          handleInputChange("Balance", e.target.value)
                                        }
                                        className="w-full"
                                      />
                                    ) : (
                                      t.Balance
                                    )}
                                  </td>
                                </tr>
                              </>
                            );
                          }

                          /* ───────────── all other rows (single) ───────────── */
                          const isExpense = (t.Category || t.type || "").toLowerCase() === "expense";
                          return (
                            <tr
                              key={`${t.invoiceNo || t._id || t.locCode}-${new Date(
                                t.date
                              ).toISOString().split("T")[0]}-${index}`}
                              className={`border-b border-gray-100 hover:bg-gray-50 ${
                                isExpense ? 'bg-red-50 hover:bg-red-100' : ''
                              }`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">{t.date}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{t.invoiceNo || t.locCode}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {t.customerName || t.customer || t.name || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.quantity}
                                    onChange={(e) =>
                                      handleInputChange("quantity", e.target.value)
                                    }
                                    className="w-full"
                                  />
                                ) : (
                                  t.quantity
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isExpense 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {t.Category || t.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {[t.SubCategory]
                                    .concat(
                                      t.Category === "RentOut" ? [t.SubCategory1 || t.subCategory1] : []
                                    )
                                    .filter(Boolean)
                                    .join(" + ") || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{t.remark}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{t.amount?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{t.totalTransaction?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{t.billValue?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-sm font-medium text-green-600">
                                {isEditing && editedTransaction._id ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.cash}
                                    onChange={(e) => handleInputChange("cash", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  `₹${t.cash?.toLocaleString() || 0}`
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                {isEditing &&
                                  editedTransaction._id &&
                                  t.SubCategory !== "Cash to Bank" ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.bank}
                                    onChange={(e) => handleInputChange("bank", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  `₹${t.bank?.toLocaleString() || 0}`
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-purple-600">
                                {isEditing &&
                                  editedTransaction._id &&
                                  t.SubCategory !== "Cash to Bank" ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.upi}
                                    onChange={(e) => handleInputChange("upi", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  `₹${t.upi?.toLocaleString() || 0}`
                                )}
                              </td>
                            <td className="px-4 py-3 text-sm">
                              {t.attachment && t._id ? (
                                <a
                                  href={`${baseUrl.baseUrl}user/transaction/${t._id}/attachment`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  <FiDownload size={14} />
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>

                              {/* action cell – admins only */}
                              {showAction && (
                                <td className="px-4 py-3">
                                  {isSyncing && editingIndex === index ? (
                                    <span className="text-xs text-gray-400">Syncing…</span>
                                  ) : isEditing ? (
                                    <button
                                      onClick={handleSave}
                                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                      Save
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleEditClick(transaction, index)}
                                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}

                      {/* fallback row */}
                      {mergedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={showAction ? 15 : 14} className="text-center px-4 py-8">
                            <div className="text-gray-500">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="mt-2 text-sm font-medium">No transactions found</p>
                              <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or date range</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* ───────────────────────────── tfoot ───────────────────────────── */}
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200 sticky bottom-0 z-10">
                        <td colSpan="10" className="px-4 py-4 text-left">
                          <span className="text-sm font-semibold text-gray-700">Total:</span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-green-600">₹{Math.round(totalCash)?.toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-blue-600">₹{Math.round(totalBankAmount)?.toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-purple-600">₹{Math.round(totalUpiAmount)?.toLocaleString()}</td>
                        <td className="px-4 py-4"></td>
                        {showAction && <td className="px-4 py-4"></td>}
                      </tr>
                    </tfoot>
                  </table>

                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 flex justify-end space-x-4">
              <CSVLink data={exportData} headers={headers} filename={`${fromDate} to ${toDate} report.csv`}>
                <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
                  Export CSV
                </button>
              </CSVLink>
              
              <button 
                type='button' 
                onClick={handlePrint} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
              >
                Take PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>

  )
}


export default Datewisedaybook









