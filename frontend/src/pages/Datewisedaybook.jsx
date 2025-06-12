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

  const handleFetch = () => {
    setPreOpen([])

    const fromDates = new Date(fromDate); // or use new Date() for current date

    // Subtract 1 day (24 hours)
    const previousDay = new Date(fromDates);
    previousDay.setDate(previousDay.getDate() - 1);
    const formattedDate = previousDay.toISOString().split('T')[0];

    const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
    const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
    const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
    const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
    const updatedApiUrl3 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
    const updatedApiUrl4 = `${baseUrl1}/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`
    const updatedApiUrl5 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`

    setApiUrl(updatedApiUrl);
    setApiUrl1(updatedApiUrl1);
    setApiUrl2(updatedApiUrl2);
    // alert(updatedApiUrl3)
    setApiUrl3(updatedApiUrl3)
    setApiUrl4(updatedApiUrl4)
    setApiUrl5(updatedApiUrl5)
    GetCreateCashBank(updatedApiUrl5)

    // console.log("API URLs Updated:", updatedApiUrl2);
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
    date: transaction.date.split("T")[0],// Correctly extract only the date
    Category: transaction.type,
    cash1: transaction.cash,
    bank1: transaction.bank,
    // subCategory: transaction.category,
    SubCategory: transaction.category,
    billValue: transaction.amount,
    Tupi: transaction.upi




  }));




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
        billValue: transaction.invoiceAmount || transaction.amount || 0,
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
  locCode: transaction.locCode || currentusers.locCode,
  type: transaction.Category || transaction.type || 'income',
  category: transaction.SubCategory || transaction.category || 'General',
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
  });

  setEditingIndex(index);
  setIsSyncing(false);
};





// Called on input change in editable row
const handleInputChange = (field, value) => {
  const numericValue = parseFloat(value) || 0;

  setEditedTransaction(prev => {
    return {
      ...prev,
      [field]: numericValue,
      amount:
        (field === "cash" ? numericValue : parseFloat(prev.cash) || 0) +
        (field === "bank" ? numericValue : parseFloat(prev.bank) || 0) +
        (field === "upi" ? numericValue : parseFloat(prev.upi) || 0),
      totalTransaction:
        (field === "cash" ? numericValue : parseFloat(prev.cash) || 0) +
        (field === "bank" ? numericValue : parseFloat(prev.bank) || 0) +
        (field === "upi" ? numericValue : parseFloat(prev.upi) || 0),
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

    

const handleSave = async () => {
  const { _id, cash, bank, upi, date } = editedTransaction;

  if (!_id) {
    alert("❌ Cannot update: missing transaction ID.");
    return;
  }

  try {
    const response = await fetch(`${baseUrl.baseUrl}user/editTransaction/${_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cash, bank, upi, date }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert("❌ Update failed: " + (result?.message || "Unknown error"));
      return;
    }

    alert("✅ Transaction updated.");
    setEditingIndex(null);

    // 🔄 REFRESH THE DATA TO RECOMPUTE filteredTransactions
    await handleFetch();

  } catch (error) {
    console.error("Update error:", error);
    alert("❌ Update failed: " + error.message);
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
                      {/* Transactions */}
                      {filteredTransactions.length ? (
                        filteredTransactions.map((transaction, index) => {
                          /* ── keep your special 2-row RentOut block unchanged ── */
                          if (transaction.Category === 'RentOut') {
                            return;
                          }

                          /* ── single-row branch with edit mode ── */
                          const isEditing = editingIndex === index;
                          const t = isEditing ? editedTransaction : transaction;

                          return (
             <tr key={index}>
  {/* DATE */}
  <td className="border p-2">{t.date}</td>

  {/* INVOICE / LOC */}
  <td className="border p-2">{t.invoiceNo || t.locCode}</td>

  {/* CUSTOMER */}
  <td className="border p-2">{t.customerName}</td>

  {/* CATEGORY */}
  <td className="border p-2">{t.Category || t.type}</td>

  {/* SUB-CATEGORY */}
  <td className="border p-2">{t.SubCategory || t.category}</td>

  {/* REMARK */}
  <td className="border p-2">{t.remark}</td>

  {/* AMOUNT */}
  <td className="border p-2">{t.amount}</td>

  {/* TOTAL TXN */}
  <td className="border p-2">{t.totalTransaction}</td>

  {/* BILL VALUE */}
  <td className="border p-2">{t.billValue}</td>

  {/* CASH (Editable only if editing and from MongoDB) */}
{/* CASH (Editable only if editing and from MongoDB) */}
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
  {isEditing && editedTransaction._id ? (
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
  {isEditing && editedTransaction._id ? (
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
                      ) : (
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