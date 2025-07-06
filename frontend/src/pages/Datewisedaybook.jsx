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

  { value: "income", label: "Income" },
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
  { value: "petty expenses", label: "Petty Expenses" },
  { value: "shoe sales", label: "Shoe Sales" }

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
        const total = cash + bank + upi;
        return {


          ...tx,
          date: tx.date?.split("T")[0] || "",
          invoiceNo: tx.invoiceNo || tx.invoice || "",
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




  /* ▼ ADD THIS – right after printRef */
  useEffect(() => {
    // If Chrome inserts a “chrome://print” history entry,
    // jump forward again as soon as the preview closes.
    const skipBack = () => setTimeout(() => window.history.forward(), 0);
    window.addEventListener("afterprint", skipBack);
    return () => window.removeEventListener("afterprint", skipBack);
  }, []);

  // const handlePrint = () => {
  //   const printContent = printRef.current.innerHTML;
  //   const originalContent = document.body.innerHTML;
  //   console.log(originalContent);


  //   document.body.innerHTML = `<html><head><title>Dummy Report</title>
  //           <style>
  //               @page { size: tabloid; margin: 10mm; }
  //               body { font-family: Arial, sans-serif; }
  //               table { width: 100%; border-collapse: collapse; }
  //               th, td { border: 1px solid black; padding: 8px; text-align: left; white-space: nowrap; }
  //               tr { break-inside: avoid; }
  //           </style>
  //       </head><body>${printContent}</body></html>`;

  //   window.print();
  //   window.location.reload(); // Reload to restore content
  // };


  // ⬇︎ put this inside your component (replace the old handlePrint)
  // ⬇︎ drop this inside the component
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

  /* rows currently visible in the table */
  // const displayedRows = mergedTransactions.filter(
  //   (t) =>
  //     (selectedCategoryValue === "all" ||
  //       (t.Category ?? t.type ?? "").toLowerCase() === selectedCategoryValue) &&
  //     (selectedSubCategoryValue === "all" ||
  //       (t.SubCategory ?? "").toLowerCase() === selectedSubCategoryValue ||
  //       (t.SubCategory1 ?? "").toLowerCase() === selectedSubCategoryValue)
  // );


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

    return matchesCategory && matchesSubCategory;
  });


  /* include yesterday’s closing cash once */
  const totals = displayedRows.reduce(
    (acc, r) => ({
      cash: acc.cash + toNumber(r.cash),
      bank: acc.bank + toNumber(r.bank),
      upi: acc.upi + toNumber(r.upi),
    }),
    { cash: toNumber(preOpen?.cash), bank: 0, upi: 0 }
  );

  const totalCash = totals.cash;   // use these in <tfoot>
  const totalBankAmount = totals.bank;
  const totalUpiAmount = totals.upi;







  // Helper function to safely parse amounts
  const parseAmount = (val) => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  /* ─── helper used by the CSV export ──────────────────────
     strips commas, currency symbols, spaces, etc.            */
  const num = (v) => {
    if (v === null || v === undefined) return 0;
    const cleaned = String(v).replace(/[^0-9.-]/g, ""); // keep only 0-9 . -
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  /* ---------- opening balance ---------- */
  const openingCash = num(preOpen?.Closecash ?? preOpen?.cash ?? 0);

  const exportData = [
    {
      date: "OPENING BALANCE",
      invoiceNo: "",
      customerName: "",
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


  // const handleInputChange = (field, value) => {
  //   const numericValue = Number(value) || 0;

  //   setEditedTransaction(prev => {
  //     /* ───────── unchanged logic for cash / bank / upi ───────── */
  //     const cash = field === "cash" ? numericValue : Number(prev.cash) || 0;
  //     const bank = field === "bank" ? numericValue : Number(prev.bank) || 0;
  //     const upi = field === "upi" ? numericValue : Number(prev.upi) || 0;

  //     /* ───────── NEW: keep split amounts for Rent-out ───────── */
  //     const security = field === "securityAmount"
  //       ? numericValue
  //       : Number(prev.securityAmount) || 0;

  //     const balance = field === "Balance"
  //       ? numericValue
  //       : Number(prev.Balance) || 0;

  //     /* Decide which total this row should use */
  //     const isRentOut = prev.Category === "RentOut";
  //     const splitTotal = security + balance;      // for Rent-out rows
  //     const paymentTotal = cash + bank + upi;       // everything else

  //     return {
  //       ...prev,
  //       [field]: numericValue,  // update edited field
  //       cash, bank, upi,                     // keep other payment values
  //       securityAmount: security,        // keep split fields
  //       Balance: balance,
  //       amount: isRentOut ? splitTotal : paymentTotal,
  //       totalTransaction: isRentOut ? splitTotal : paymentTotal,
  //     };
  //   });
  // };


  // const handleSave = async () => {
  //   const {
  //     _id,
  //     cash,
  //     bank,
  //     upi,
  //     date,
  //     invoiceNo = "",
  //     invoice = "",
  //     customerName,
  //     securityAmount,   // ✅ include
  //     Balance,          // ✅ include
  //     paymentMethod
  //   } = editedTransaction;

  //   if (!_id) {
  //     alert("❌ Cannot update: missing transaction ID.");
  //     return;
  //   }

  //   try {
  //     const res = await fetch(
  //       `${baseUrl.baseUrl}user/editTransaction/${_id}`,
  //       {
  //         method: "PUT",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           cash,
  //           bank,
  //           upi,
  //           date,
  //           invoiceNo: invoiceNo || invoice,
  //           customerName: customerName || "",
  //           paymentMethod,
  //           securityAmount,    // ✅ include in payload
  //           Balance ,
  //            type: editedTransaction.Category || "RentOut",
  //   category: editedTransaction.SubCategory || "Security",
  //   subCategory1: editedTransaction.SubCategory1 || "Balance Payable"
  //         })
  //       }
  //     );

  //     const json = await res.json();

  //     if (!res.ok) {
  //       alert("❌ Update failed: " + (json?.message || "Unknown error"));
  //       return;
  //     }

  //     alert("✅ Transaction updated.");

  //     // Prepare updated row with proper total logic
  //     const numericCash = Number(cash) || 0;
  //     const numericBank = Number(bank) || 0;
  //     const numericUPI = Number(upi) || 0;
  //     const numericSecurity = Number(securityAmount) || 0;
  //     const numericBalance = Number(Balance) || 0;

  //     const isRentOut = editedTransaction.Category === "RentOut";
  //     const computedTotal = isRentOut
  //       ? numericSecurity + numericBalance
  //       : numericCash + numericBank + numericUPI;

  //     const updatedRow = {
  //       ...editedTransaction,
  //       invoiceNo: invoiceNo || invoice,
  //       cash: numericCash,
  //       bank: numericBank,
  //       upi: numericUPI,
  //       securityAmount: numericSecurity,
  //       Balance: numericBalance,
  //       amount: computedTotal,
  //       totalTransaction: computedTotal,
  //       date
  //     };

  //     // Patch Mongo transactions
  //     setMongoTransactions(prev =>
  //       prev.map(tx =>
  //         tx._id === _id ? updatedRow : tx
  //       )
  //     );

  //     // Patch merged transactions
  //     setMergedTransactions(prev =>
  //       prev.map(t =>
  //         t._id === _id ? updatedRow : t
  //       )
  //     );

  //     setEditingIndex(null);
  //   } catch (err) {
  //     console.error("Update error:", err);
  //     alert("❌ Update failed: " + err.message);
  //   }
  // };

  // const handleInputChange = (field, value) => {
  //   // convert to number – keep NaN fallback
  //   let numericValue = Number(value);
  //   if (isNaN(numericValue)) numericValue = 0;

  //   /* 🔸 If this row is a Return or Cancel, force the value negative */
  //   const negRow = ["return", "cancel"].includes(
  //     (editedTransaction.Category || "").toLowerCase()
  //   );
  //   if (negRow) numericValue = -Math.abs(numericValue);

  //   setEditedTransaction(prev => {
  //     const cash = field === "cash" ? numericValue : Number(prev.cash) || 0;
  //     const bank = field === "bank" ? numericValue : Number(prev.bank) || 0;
  //     const upi  = field === "upi"  ? numericValue : Number(prev.upi)  || 0;

  //     const security = field === "securityAmount"
  //       ? numericValue
  //       : Number(prev.securityAmount) || 0;

  //     const balance  = field === "Balance"
  //       ? numericValue
  //       : Number(prev.Balance) || 0;

  //     const isRentOut   = prev.Category === "RentOut";
  //     const splitTotal  = security + balance;
  //     const paymentTotal = cash + bank + upi;

  //     return {
  //       ...prev,
  //       [field]: numericValue,
  //       cash, bank, upi,
  //       securityAmount: security,
  //       Balance: balance,
  //       amount: isRentOut ? splitTotal : paymentTotal,
  //       totalTransaction: isRentOut ? splitTotal : paymentTotal,
  //     };
  //   });
  // };




  // const handleInputChange = (field, raw) => {
  //   /* 0A ▸ allow empty or lone minus while the user is typing  */
  //   if (raw === '' || raw === '-') {
  //     setEditedTransaction(prev => ({ ...prev, [field]: raw }));
  //     return;              // stop here – don’t recompute totals yet
  //   }


  //   /* 0B ▸ now parse; if still NaN just bail out */
  //   let numericValue = Number(raw);
  //   if (isNaN(numericValue)) return;

  //   /* keep negatives exactly as entered – no category check now */
  //   setEditedTransaction(prev => {
  //     const cash = field === 'cash' ? numericValue : Number(prev.cash) || 0;
  //     const bank = field === 'bank' ? numericValue : Number(prev.bank) || 0;
  //     const upi  = field === 'upi'  ? numericValue : Number(prev.upi)  || 0;

  //     const security = field === 'securityAmount'
  //       ? numericValue
  //       : Number(prev.securityAmount) || 0;

  //     const balance  = field === 'Balance'
  //       ? numericValue
  //       : Number(prev.Balance) || 0;

  //     const isRentOut   = (prev.Category || '').toLowerCase() === 'rentout';
  //     const splitTotal  = security + balance;
  //     const paymentTotal = cash + bank + upi;

  //     return {
  //       ...prev,
  //       [field]: numericValue,
  //       cash, bank, upi,
  //       securityAmount: security,
  //       Balance: balance,
  //       amount: isRentOut ? splitTotal : paymentTotal,
  //       totalTransaction: isRentOut ? splitTotal : paymentTotal,
  //     };
  //   });
  // };


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



  /* ─────────────────────────────────────────────────────────────
     FULL handleSave — keeps totals & payment columns in sync
     ──────────────────────────────────────────────────────────── */
  // const handleSave = async () => {
  //   const {
  //     _id,
  //     cash,
  //     bank,
  //     upi,
  //     date,
  //     invoiceNo = "",
  //     invoice = "",
  //     customerName,
  //     securityAmount,
  //     Balance,
  //     paymentMethod,
  //   } = editedTransaction;

  //   if (!_id) {
  //     alert("❌ Cannot update: missing transaction ID.");
  //     return;
  //   }

  //   try {
  //     /* ── normalise numbers ───────────────────────────── */
  //     const numSec = Number(securityAmount) || 0;
  //     const numBal = Number(Balance) || 0;

  //     let adjCash = Number(cash) || 0;
  //     let adjBank = Number(bank) || 0;
  //     let adjUpi = Number(upi) || 0;

  //     const isRentOut = editedTransaction.Category === "RentOut";
  //     const computedTotal = isRentOut
  //       ? numSec + numBal                         // Security + Balance
  //       : adjCash + adjBank + adjUpi;             // Cash + Bank + UPI

  //     /* ── ensure one payment column equals the bill value ────────── */
  //     const paySum = adjCash + adjBank + adjUpi;
  //     if (paySum !== computedTotal) {
  //       if (adjCash > 0) { adjCash = computedTotal; adjBank = 0; adjUpi = 0; }
  //       else if (adjBank > 0) { adjBank = computedTotal; adjCash = 0; adjUpi = 0; }
  //       else if (adjUpi > 0) { adjUpi = computedTotal; adjCash = 0; adjBank = 0; }
  //       else { adjCash = computedTotal; adjBank = 0; adjUpi = 0; }
  //     }

  //     /* ── push to backend ─────────────────────────────── */
  //     const payload = {
  //       cash: adjCash,
  //       bank: adjBank,
  //       upi: adjUpi,
  //       date,
  //       invoiceNo: invoiceNo || invoice,
  //       customerName: customerName || "",
  //       paymentMethod,
  //       securityAmount: numSec,
  //       Balance: numBal,
  //       billValue: computedTotal,
  //       amount: computedTotal,
  //       totalTransaction: computedTotal,
  //       type: editedTransaction.Category || "RentOut",
  //       category: editedTransaction.SubCategory || "Security",
  //       subCategory1: editedTransaction.SubCategory1 || "Balance Payable",
  //     };

  //     const res = await fetch(`${baseUrl.baseUrl}user/editTransaction/${_id}`, {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });
  //     const json = await res.json();

  //     if (!res.ok) {
  //       alert("❌ Update failed: " + (json?.message || "Unknown error"));
  //       return;
  //     }
  //     alert("✅ Transaction updated.");

  //     /* ── update rows locally (no refetch needed) ─────── */
  //     const updatedRow = {
  //       ...editedTransaction,
  //       cash: adjCash,
  //       bank: adjBank,
  //       upi: adjUpi,
  //       securityAmount: numSec,
  //       Balance: numBal,
  //       amount: computedTotal,
  //       totalTransaction: computedTotal,
  //       billValue: computedTotal,
  //       date,
  //       invoiceNo: invoiceNo || invoice,
  //     };

  //     setMongoTransactions(prev =>
  //       prev.map(tx => (tx._id === _id ? updatedRow : tx))
  //     );
  //     setMergedTransactions(prev =>
  //       prev.map(t => (t._id === _id ? updatedRow : t))
  //     );
  //     setEditingIndex(null);
  //   } catch (err) {
  //     console.error("Update error:", err);
  //     alert("❌ Update failed: " + err.message);
  //   }
  // };


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
                  max="2099-12-31"
                  min="2000-01-01"
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
                  max="2099-12-31"
                  min="2000-01-01"
                  className="border border-gray-300 py-2 px-3"
                />
              </div>
              <button
                onClick={handleFetch}
                className="bg-blue-500 hover:bg-blue-600 hover:shadow-lg transition duration-300 h-[40px] mt-6 rounded-md text-white px-10 cursor-pointer"
              >
                Fetch
              </button>


              <div className='w-full'>
                <label htmlFor="">Category</label>
                <Select
                  options={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    menu: base => ({ ...base, zIndex: 9999 }),
                  }}
                />

              </div>
              <div className='w-full'>
                <label htmlFor="">Sub Category</label>
                <Select
                  options={subCategories}
                  value={selectedSubCategory}
                  onChange={setSelectedSubCategory}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    menu: base => ({ ...base, zIndex: 9999 }),
                  }}
                />

              </div>
            </div>

            <div ref={printRef}>
              {/* Table */}
              <div className="bg-white p-4 shadow-md rounded-lg">
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table className="w-full border-collapse border rounded-md border-gray-300">
                    {/* ───────────────────────────── thead ───────────────────────────── */}
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "#7C7C7C",
                        color: "white",
                        zIndex: 2,
                      }}
                    >
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
                        {showAction && <th className="border p-2">Action</th>}
                      </tr>
                    </thead>

                    {/* ───────────────────────────── tbody ───────────────────────────── */}
                    <tbody>
                      {/* opening balance row */}
                      <tr className="font-bold bg-gray-100">
                        <td colSpan="9" className="border p-2">
                          OPENING BALANCE
                        </td>
                        <td className="border p-2">{preOpen.Closecash}</td>
                        <td className="border p-2">0</td>
                        <td className="border p-2">0</td>
                        {showAction && <td className="border p-2"></td>}
                      </tr>

                      {/* transactions */}
                      {mergedTransactions
                        /* your existing filters (unchanged) */
                        .filter(
                          (t) =>
                            (selectedCategoryValue === "all" ||
                              t.category?.toLowerCase() === selectedCategoryValue ||
                              t.Category?.toLowerCase() === selectedCategoryValue ||
                              t.type?.toLowerCase() === selectedCategoryValue) &&
                            (selectedSubCategoryValue === "all" ||
                              t.subCategory?.toLowerCase() === selectedSubCategoryValue ||
                              t.SubCategory?.toLowerCase() === selectedSubCategoryValue ||
                              t.type?.toLowerCase() === selectedSubCategoryValue ||
                              t.subCategory1?.toLowerCase() === selectedSubCategoryValue ||
                              t.SubCategory1?.toLowerCase() === selectedSubCategoryValue ||
                              t.category?.toLowerCase() === selectedSubCategoryValue)
                        )
                        .map((transaction, index) => {
                          const isEditing = editingIndex === index;
                          const t = isEditing ? editedTransaction : transaction;

                          /* ───────────── RentOut (two stacked rows) ───────────── */
                          if (t.Category === "RentOut") {
                            return (
                              <>
                                {/* security line */}
                                <tr key={`${index}-sec`}>
                                  <td className="border p-2">{t.date}</td>
                                  <td className="border p-2">{t.invoiceNo || t.locCode}</td>
                                  <td className="border p-2">
                                    {t.customerName || t.customer || t.name || "-"}
                                  </td>
                                  <td rowSpan="2" className="border p-2">
                                    {t.Category}
                                  </td>
                                  <td className="border p-2">{t.SubCategory}</td>
                                  <td className="border p-2">{t.remark}</td>
                                  <td className="border p-2">
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
                                  <td rowSpan="2" className="border p-2">
                                    {t.totalTransaction}
                                  </td>
                                  <td rowSpan="2" className="border p-2">
                                    {t.billValue}
                                  </td>
                                  <td rowSpan="2" className="border p-2">
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
                                  <td rowSpan="2" className="border p-2">
                                    {isEditing && editedTransaction._id ? (
                                      <input
                                        type="number"
                                        step="any"
                                        value={editedTransaction.bank}
                                        onChange={(e) =>
                                          handleInputChange("bank", e.target.value)
                                        }
                                        className="w-full"
                                      />
                                    ) : (
                                      t.bank
                                    )}
                                  </td>
                                  <td rowSpan="2" className="border p-2">
                                    {isEditing && editedTransaction._id ? (
                                      <input
                                        type="number"
                                        step="any"
                                        value={editedTransaction.upi}
                                        onChange={(e) =>
                                          handleInputChange("upi", e.target.value)
                                        }
                                        className="w-full"
                                      />
                                    ) : (
                                      t.upi
                                    )}
                                  </td>

                                  {/* row-span action cell, only for admins */}
                                  {showAction && (
                                    <td rowSpan="2" className="border p-2">
                                      {isSyncing && editingIndex === index ? (
                                        <span className="text-gray-400">Syncing…</span>
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
                                  )}
                                </tr>

                                {/* balance line */}
                                <tr key={`${index}-bal`}>
                                  <td className="border p-2">{t.date}</td>
                                  <td className="border p-2">{t.invoiceNo || t.locCode}</td>
                                  <td className="border p-2">
                                    {t.customerName || t.customer || t.name || "-"}
                                  </td>
                                  <td className="border p-2">{t.SubCategory1}</td>
                                  <td className="border p-2">{t.remark}</td>
                                  <td className="border p-2">
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
                          return (
                            <tr
                              key={`${t.invoiceNo || t._id || t.locCode}-${new Date(
                                t.date
                              ).toISOString().split("T")[0]}-${index}`}
                            >
                              <td className="border p-2">{t.date}</td>
                              <td className="border p-2">{t.invoiceNo || t.locCode}</td>
                              <td className="border p-2">
                                {t.customerName || t.customer || t.name || "-"}
                              </td>
                              <td className="border p-2">{t.Category || t.type}</td>
                              <td className="border p-2">
                                {[t.SubCategory]
                                  .concat(
                                    t.Category === "RentOut" ? [t.SubCategory1 || t.subCategory1] : []
                                  )
                                  .filter(Boolean)
                                  .join(" + ") || "-"}
                              </td>
                              <td className="border p-2">{t.remark}</td>
                              <td className="border p-2">{t.amount}</td>
                              <td className="border p-2">{t.totalTransaction}</td>
                              <td className="border p-2">{t.billValue}</td>
                              <td className="border p-2">
                                {isEditing && editedTransaction._id ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.cash}
                                    onChange={(e) => handleInputChange("cash", e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  t.cash
                                )}
                              </td>
                              <td className="border p-2">
                                {isEditing &&
                                  editedTransaction._id &&
                                  t.SubCategory !== "Cash to Bank" ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.bank}
                                    onChange={(e) => handleInputChange("bank", e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  t.bank
                                )}
                              </td>
                              <td className="border p-2">
                                {isEditing &&
                                  editedTransaction._id &&
                                  t.SubCategory !== "Cash to Bank" ? (
                                  <input
                                    type="number"
                                    value={editedTransaction.upi}
                                    onChange={(e) => handleInputChange("upi", e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  t.upi
                                )}
                              </td>

                              {/* action cell – admins only */}
                              {showAction && (
                                <td className="border p-2">
                                  {isSyncing && editingIndex === index ? (
                                    <span className="text-gray-400">Syncing…</span>
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
                              )}
                            </tr>
                          );
                        })}

                      {/* fallback row */}
                      {mergedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={showAction ? 13 : 12} className="text-center border p-4">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* ───────────────────────────── tfoot ───────────────────────────── */}
                    <tfoot>
                      <tr
                        className="bg-white text-center font-semibold"
                        style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 2 }}
                      >
                        <td colSpan="9" className="border px-4 py-2 text-left">
                          Total:
                        </td>
                        <td className="border px-4 py-2">{Math.round(totalCash)}</td>
                        <td className="border px-4 py-2">{Math.round(totalBankAmount)}</td>
                        <td className="border px-4 py-2">{Math.round(totalUpiAmount)}</td>
                        {showAction && <td className="border px-4 py-2"></td>}
                      </tr>
                    </tfoot>
                  </table>

                </div>
              </div>
            </div>

            <button type='button' onClick={handlePrint} className="mt-6 w-[200px] float-right cursor-pointer bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
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










