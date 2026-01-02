import { CSVLink } from "react-csv";
import Headers from '../components/Header.jsx';
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import useFetch from '../hooks/useFetch.jsx';
import baseUrl from '../api/api.js';
import { useRef } from "react";
import { FiRefreshCw } from "react-icons/fi";




const headers = [
    { label: "Date", key: "date", },
    { label: "Invoice No", key: "invoiceNo" },
    { label: "Customer Name", key: "customerName" },
    { label: "Category", key: "Category" },
    { label: "Sub Category", key: "SubCategory" },
    { label: "Balance Payable", key: "SubCategory1" },
    { label: "Remarks", key: "remarks" },
    { label: "Amount", key: "amount" },
    { label: "Total Transaction", key: "totalTransaction" },
    { label: "Discount", key: "discountAmount" },
    { label: "Bill Value", key: "billValue" },
    { label: "security", key: "securityAmount" },
    { label: "Balance Payable", key: "Balance" },
    { label: "Remark", key: "remark" },
    { label: "Cash", key: "cash" },
    { label: "RBL", key: "rbl" },
    { label: "Bank", key: "bank" },
    { label: "UPI", key: "upi" },
];

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

const subCategories = [
    { value: "all", label: "All" },
    { value: "advance", label: "Advance" },
    { value: "Balance Payable", label: "Balance Payable" },
    { value: "security", label: "Security" },
    { value: "cancellation Refund", label: "Cancellation Refund" },
    { value: "security Refund", label: "Security Refund" },
    { value: "compensation", label: "Compensation" },
    { value: "petty expenses", label: "Petty Expenses" },
    { value: "shoe sales", label: "Shoe Sales" },
    { value: "shirt sales", label: "Shirt Sales" },
    { value: "bulk amount transfer", label: "Bulk Amount Transfer" }
];



const denominations = [
    { label: "500", value: 500 },
    { label: "200", value: 200 },
    { label: "100", value: 100 },
    { label: "50", value: 50 },
    { label: "20", value: 20 },
    { label: "10", value: 10 },
    { label: "Coins", value: 1 },
];

// const opening = [{ cash: "60000", bank: "54000" }];

const DayBookInc = () => {

    const [preOpen, setPreOpen] = useState([])
    const [preOpen1, setPreOpen1] = useState([])
    const [loading, setLoading] = useState(false)


    const date1 = new Date();
    const previousDate = new Date(date1);
    previousDate.setDate(date1.getDate() - 1);
    const TodayDate = `${String(date1.getDate()).padStart(2, '0')}-${String(date1.getMonth() + 1).padStart(2, '0')}-${date1.getFullYear()}`;
    const previousDate1 = `${String(previousDate.getDate()).padStart(2, '0')}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${previousDate.getFullYear()}`;
    const date = TodayDate;

    // alert(TodayDate);
    const currentusers = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object
    // console.log(currentusers);
    const currentDate = new Date().toISOString().split("T")[0];
    // Convert "04-04-2025" to "2025-04-04"
    const formatDate = (inputDate) => {
        const [day, month, year] = inputDate.split("-");
        return `${year}-${month}-${day}`;
    };

    // Example usage:

    const formattedDate = formatDate(previousDate1); // "2025-04-04"
    console.log(formattedDate);


    const apiUrl = `https://rentalapi.rootments.live/api/GetBooking/GetBookingList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
    const apiurl1 = `https://rentalapi.rootments.live/api/GetBooking/GetRentoutList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
    const apiUrl2 = `https://rentalapi.rootments.live/api/GetBooking/GetReturnList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`
    const apiUrl3 = `https://rentalapi.rootments.live/api/GetBooking/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`
    // Use the new Day Book API that includes invoice transactions
    const apiUrl4 = `${baseUrl.baseUrl}api/daybook?locCode=${currentusers.locCode}&date=${currentDate}`;
    const apiUrl4_fallback = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
    const apiUrl5 = `${baseUrl.baseUrl}user/saveCashBank`
    const apiUrl6 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`
    const apiUrl7 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${currentDate}`

    // alert(apiurl1)

    const locCode = currentusers?.locCode
    const email = currentusers?.email

    // alert(apiurl1)

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


    // alert(previousDate1)


    const fetchOptions = useMemo(() => ({}), []);

    const { data } = useFetch(apiUrl, fetchOptions);
    const { data: data1 } = useFetch(apiurl1, fetchOptions);
    const { data: data2 } = useFetch(apiUrl2, fetchOptions);
    // alert(apiUrl2)
    const { data: data3 } = useFetch(apiUrl3, fetchOptions);

    // Use the new Day Book API that includes invoice transactions
    const [dayBookData, setDayBookData] = useState(null);
    
    useEffect(() => {
        const fetchDayBookData = async () => {
            try {
                const response = await fetch(apiUrl4);
                const result = await response.json();
                if (result.success) {
                    setDayBookData(result.data.transactions);
                } else {
                    // Fallback to old API
                    const fallbackResponse = await fetch(apiUrl4_fallback);
                    const fallbackResult = await fallbackResponse.json();
                    setDayBookData(fallbackResult.data || []);
                }
            } catch (error) {
                console.error('Error fetching day book data:', error);
                // Fallback to old API
                try {
                    const fallbackResponse = await fetch(apiUrl4_fallback);
                    const fallbackResult = await fallbackResponse.json();
                    setDayBookData(fallbackResult.data || []);
                } catch (fallbackError) {
                    console.error('Fallback API also failed:', fallbackError);
                    setDayBookData([]);
                }
            }
        };
        
        if (apiUrl4) {
            fetchDayBookData();
        }
    }, [apiUrl4, apiUrl4_fallback]);

    // console.log(data1);
    const bookingTransactions = (data?.dataSet?.data || []).map(transaction => {
        const bookingCashAmount = parseInt(transaction?.bookingCashAmount || 0, 10);
        const bookingBankAmount = parseInt(transaction?.bookingBankAmount || 0, 10);
        const bookingUPIAmount = parseInt(transaction?.bookingUPIAmount || 0, 10);
        const rblAmount = parseInt(transaction?.rblRazorPay || 0, 10);
        const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
        const discountAmount = parseInt(transaction?.discountAmount || 0, 10);

        const totalAmount = bookingCashAmount + bookingBankAmount + bookingUPIAmount + rblAmount;

        return {
            ...transaction,
            date: transaction?.bookingDate || null,
            bookingCashAmount,
            bookingBankAmount,
            billValue: transaction.invoiceAmount,
            discountAmount: discountAmount,

            invoiceAmount,
            bookingBank1: bookingBankAmount,
            TotaltransactionBooking: totalAmount,
            Category: "Booking",
            SubCategory: "Advance",
            totalTransaction: totalAmount,
            cash: bookingCashAmount,
            rbl: rblAmount,
            bank: bookingBankAmount,
            upi: bookingUPIAmount,
            amount: totalAmount,
        };
    });

    const canCelTransactions = (data3?.dataSet?.data || []).map(transaction => {
        const deleteCashAmount = -Math.abs(parseInt(transaction.deleteCashAmount || 0));
        const deleteRblAmount = -Math.abs(parseInt(transaction.rblRazorPay || 0));
        
        // Only process bank/UPI if no RBL value (check original value, not negative)
        const originalRblAmount = parseInt(transaction.rblRazorPay || 0);
        const deleteBankAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteBankAmount || 0));
        const deleteUPIAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteUPIAmount || 0));

        const totalAmount = deleteCashAmount + deleteRblAmount + deleteBankAmount + deleteUPIAmount;

        // Debug logging for Cancel transactions
        if (originalRblAmount !== 0) {
            console.log('Cancel transaction RBL debug:', {
                invoiceNo: transaction.invoiceNo,
                rblRazorPay: transaction.rblRazorPay,
                originalRblAmount,
                deleteRblAmount,
                deleteBankAmount,
                deleteUPIAmount
            });
        }

        return {
            ...transaction,
            date: transaction.cancelDate,
            Category: "Cancel",
            SubCategory: "cancellation Refund",
            discountAmount: parseInt(transaction.discountAmount || 0),
            billValue: transaction.invoiceAmount,
            amount: totalAmount,
            totalTransaction: totalAmount,
            cash: deleteCashAmount,
            rbl: deleteRblAmount,
            bank: deleteBankAmount,
            upi: deleteUPIAmount,
        };
    });
    // Only include MongoDB transactions with allowed categories (case-insensitive)
    const allowedMongoCategories = [
        "petty expenses",
        "staff reimbursement",
        "maintenance expenses",
        "telephone internet",
        "utility bill",
        "salary",
        "rent",
        "courier charges",
        "asset purchase",
        "promotion_services",
        "spot incentive",
        "bulk amount transfer",
        "other expenses",
        "shoe sales return",
        "shirt sales return",
        "cash to bank",
        "bank to cash",
        "compensation",
        "shoe sales",
        "shirt sales",  
        "write off",
        // ✅ Added invoice transaction categories
        "booking",
        "receivable",
        "sales",
        "income",
        "expense",
        "money transfer",
        // ✅ Added Return/Refund/Cancel categories for invoice returns
        "return",
        "refund",
        "cancel",
        "rentout",
        "rent out"
    ];


    // Use Day Book data that includes invoice transactions
    const Transactionsall = (dayBookData || []).filter(transaction => {
        const cat = (transaction.category || transaction.Category || "").toLowerCase();
        return allowedMongoCategories.includes(cat);
    }).map(transaction => ({
        ...transaction,
        locCode: currentusers.locCode,
        date: transaction.date ? transaction.date.split("T")[0] : transaction.date, // Handle both formats
        Category: transaction.category || transaction.Category || transaction.type,
        SubCategory: transaction.subCategory || transaction.SubCategory,
        // Ensure invoiceNo is properly mapped (handle both invoiceNumber and invoiceNo)
        invoiceNo: transaction.invoiceNo || transaction.invoiceNumber || transaction.invoiceId || transaction.locCode,
        // Ensure customerName is properly mapped (handle both customer and customerName)
        customerName: transaction.customerName || transaction.customer || transaction.custName || "",
        cash1: transaction.cash,
        bank1: transaction.bank,
        discountAmount: parseInt(transaction.discountAmount || 0),
        billValue: transaction.billValue || transaction.invoiceAmount || transaction.amount || 0,
        Tupi: transaction.upi,
        rbl: transaction.rbl || transaction.rblRazorPay || 0,
        // Map cash, bank, upi for return invoices
        cash: transaction.cash !== undefined ? transaction.cash : transaction.cash1,
        bank: transaction.bank !== undefined ? transaction.bank : transaction.bank1,
        upi: transaction.upi !== undefined ? transaction.upi : transaction.Tupi,
        amount: transaction.amount || 0,
        totalTransaction: transaction.totalTransaction || (parseInt(transaction.cash || 0) + parseInt(transaction.bank || 0) + parseInt(transaction.upi || 0) + parseInt(transaction.rbl || transaction.rblRazorPay || 0)),
        remark: transaction.remark || transaction.remarks || ""
    }));
    const rentOutTransactions = (data1?.dataSet?.data || []).map(transaction => {
        const rentoutCashAmount = parseInt(transaction?.rentoutCashAmount ?? 0, 10);
        const rentoutBankAmount = parseInt(transaction?.rentoutBankAmount ?? 0, 10);
        const invoiceAmount = parseInt(transaction?.invoiceAmount ?? 0, 10);

        const advanceAmount = parseInt(transaction?.advanceAmount ?? 0, 10);
        const rentoutUPIAmount = parseInt(transaction?.rentoutUPIAmount ?? 0, 10);
        const rblAmount = parseInt(transaction?.rblRazorPay ?? 0, 10);
        const securityAmount = parseInt(transaction?.securityAmount ?? 0, 10);

        return {
            ...transaction,
            date: transaction?.rentOutDate ?? "",
            rentoutCashAmount,
            rentoutBankAmount,
            invoiceAmount,
            discountAmount: parseInt(transaction.discountAmount || 0),
            billValue: transaction.invoiceAmount,

            securityAmount,
            advanceAmount,
            Balance: invoiceAmount - advanceAmount,
            rentoutUPIAmount,
            Category: "RentOut",
            SubCategory: "Security",
            SubCategory1: "Balance Payable",
            totalTransaction: rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount + rblAmount,
            cash: rentoutCashAmount,
            rbl: rblAmount,
            bank: rentoutBankAmount,
            upi: rentoutUPIAmount,
            amount: rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount + rblAmount,
        };
    });



    //return

    const returnOutTransactions = (data2?.dataSet?.data || []).map(transaction => {
        const returnCashAmount = -(parseInt(transaction?.returnCashAmount || 0, 10));
        const returnRblAmount = -(parseInt(transaction?.rblRazorPay || 0, 10));
        
        // Only process bank/UPI if no RBL value
        const returnBankAmount = returnRblAmount !== 0 ? 0 : -(parseInt(transaction?.returnBankAmount || 0, 10));
        const returnUPIAmount = returnRblAmount !== 0 ? 0 : -(parseInt(transaction?.returnUPIAmount || 0, 10));
        
        const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
        const advanceAmount = parseInt(transaction?.advanceAmount || 0, 10);
        const RsecurityAmount = -(parseInt(transaction?.securityAmount || 0, 10));

        const totalAmount = returnCashAmount + returnRblAmount + returnBankAmount + returnUPIAmount;

        return {
            ...transaction,
            date: transaction?.returnedDate || null,
            returnBankAmount,
            returnCashAmount,
            returnUPIAmount,
            invoiceAmount,
            advanceAmount,
            discountAmount: parseInt(transaction.discountAmount || 0),
            billValue: invoiceAmount,
            amount: totalAmount,
            totalTransaction: totalAmount,
            RsecurityAmount,
            Category: "Return",
            SubCategory: "Security Refund",
            cash: returnCashAmount,
            rbl: returnRblAmount,
            bank: returnBankAmount,
            upi: returnUPIAmount,
        };
    });



    const allTransactions = [
        ...bookingTransactions,
        ...rentOutTransactions,
        ...returnOutTransactions,
        ...canCelTransactions,
        ...Transactionsall // Only allowed MongoDB categories
    ];

    // console.log(allTransactions);


    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [selectedSubCategory, setSelectedSubCategory] = useState(subCategories[0]);
    const [quantities, setQuantities] = useState(Array(denominations.length).fill(""));

    const handleChange = (index, value) => {
        const newQuantities = [...quantities];
        newQuantities[index] = value === "" ? "" : parseInt(value, 10);
        setQuantities(newQuantities);
    };

    const totalAmount = denominations.reduce(
        (sum, denom, index) => sum + (quantities[index] || 0) * denom.value,
        0
    );



    // const closingCash = 200000;
    // const physicalCash = 190000;
    // const differences = physicalCash - closingCash;
    const selectedCategoryValue = selectedCategory?.value?.toLowerCase() || "all";
    const selectedSubCategoryValue = selectedSubCategory?.value?.toLowerCase() || "all";

    const filteredTransactions = allTransactions.filter((t) =>
        (selectedCategoryValue === "all" || (t.category?.toLowerCase() === selectedCategoryValue || t.Category?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue)) &&
        (selectedSubCategoryValue === "all" || (t.subCategory?.toLowerCase() === selectedSubCategoryValue || t.SubCategory?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.subCategory1?.toLowerCase() === selectedSubCategoryValue || t.SubCategory1?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue))
    );




    // console.log(allTransactions);
    const totalBankAmount =
        (filteredTransactions?.reduce((sum, item) =>
            sum +
            (parseInt(item.bookingBankAmount, 10) || 0) +
            (parseInt(item.rentoutBankAmount, 10) || 0) +
            (parseInt(item.rentoutUPIAmount, 10) || 0) +
            (parseInt(item.bookingUPIAmount, 10) || 0) +
            (parseInt(item.deleteBankAmount, 10) || 0) * -1 +
            (parseInt(item.deleteUPIAmount, 10) || 0) * -1 + // Ensure negative value is applied correctly
            (parseInt(item.returnBankAmount, 10) || 0),
            0
        ) || 0);

    const totalBankAmount1 = (
        filteredTransactions?.reduce((sum, item) =>
            sum +
            (parseInt(item.bank, 10) || 0),
            0
        ) || 0
    );


    const totalBankAmountupi = (
        filteredTransactions?.reduce((sum, item) =>
            sum +
            (parseInt(item.upi, 10) || 0),
            0
        ) || 0
    );

    const totalRblAmount = (
        filteredTransactions?.reduce((sum, item) =>
            sum +
            (parseInt(item.rbl, 10) || 0),
            0
        ) || 0
    );


    const totalCash = (
        filteredTransactions?.reduce((sum, item) =>
            sum +
            (parseInt(item.cash, 10) || 0),
            0
        ) + (parseInt(preOpen?.Closecash, 10) || 0)
    );
    const savedData = {
        date,
        locCode,
        email,
        totalCash,
        totalAmount,
        totalBankAmount

    }
    // console.log(savedData);

    const CreateCashBank = async () => {



        // alert(savedData.totalAmount)
        if (savedData.totalAmount === 0) {
            return alert('You have entered 0 as cash. If cash is missing, please inform the Rootments office.')
        }
        setLoading(true)
        try {
            const response = await fetch(apiUrl5, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(savedData),
            });

            if (response.status === 401) {
                setLoading(false)
                return alert("Error: Data already saved for today.");
            } else if (!response.ok) {
                setLoading(false)
                return alert(JSON.stringify(response), null, 2);
            }

            const data = await response.json();
            console.log("Data saved successfully:", data);

            alert("Data saved successfully");
            setLoading(false)
            window.location.reload();

        } catch (error) {
            console.error("Error saving data:", error);
            alert("An unexpected error occurred.");
            setLoading(false)

        }
    };


    const GetCreateCashBank = async () => {
        try {
            const response = await fetch(apiUrl6, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // alert(apiUrl6)

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

    // const takeCreateCashBank = async () => {
    //     try {
    //         const response = await fetch(apiUrl7, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //         });
    //         // alert(apiUrl6)

    //         if (!response.ok) {
    //             throw new Error('Error saving data');
    //         }

    //         const data = await response.json();
    //         console.log("Data saved successfully:", data);
    //         setPreOpen1(data?.data)
    //     } catch (error) {
    //         console.error("Error saving data:", error);
    //     }
    // };

    const takeCreateCashBank = async () => {
        try {
            const response = await fetch(apiUrl7, { method: 'GET' });
            if (response.status === 404) {
                console.log("No closing data yet for today.");
                return;    // silently ignore and continue
            }
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API ${response.status}: ${text}`);
            }
            const json = await response.json();
            setPreOpen1(json.data);
        } catch (err) {
            console.error("Error fetching closing data:", err);
        }
    };

    useEffect(() => {
        GetCreateCashBank()
        takeCreateCashBank()
    }, [])

    // Prepare CSV data to match table logic
    const csvData = filteredTransactions.map(transaction => ({
      ...transaction,
      cash:
        -(parseInt(transaction.deleteCashAmount)) ||
        parseInt(transaction.rentoutCashAmount) ||
        parseInt(transaction.bookingCashAmount) ||
        parseInt(transaction.returnCashAmount) ||
        parseInt(transaction.cash1) || 0,
      rbl: parseInt(transaction.rbl) || 0,
      bank:
        parseInt(transaction.rentoutBankAmount) ||
        parseInt(transaction.bookingBank1) ||
        parseInt(transaction.returnBankAmount) ||
        parseInt(transaction.deleteBankAmount) * -1 ||
        parseInt(transaction.bank1) || 0,
      upi:
        parseInt(transaction.rentoutUPIAmount) ||
        parseInt(transaction.bookingUPIAmount) ||
        parseInt(transaction.returnUPIAmount) ||
        parseInt(transaction.deleteUPIAmount) * -1 ||
        parseInt(transaction.Tupi) || 0,
    }));

    return (
        <>
            <div>
                <Headers title={"Day Book"} />
                <div className='ml-[240px]'>
                    <div className="p-6 bg-gray-100 min-h-screen">
                        {/* Dropdowns */}
                        <div className="flex flex-wrap gap-4 mb-6 max-w-4xl">
                            <div className='w-full sm:w-[300px]'>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <Select
                                    options={categories}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    className="w-full"
                                />
                            </div>
                            <div className='w-full sm:w-[300px]'>
                                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                                <Select
                                    options={subCategories}
                                    value={selectedSubCategory}
                                    onChange={setSelectedSubCategory}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div ref={printRef} >




                            {/* Table */}
                            <div className="bg-white p-4 shadow-md rounded-lg overflow-x-auto">
                                <table className="w-full border-collapse border rounded-md border-gray-300 min-w-full">
                                        <thead>
                                            <tr className="bg-[#7C7C7C] text-white">
                                                <th className="border p-2 text-left whitespace-nowrap">Date</th>
                                                <th className="border p-2 text-left whitespace-nowrap">Invoice No.</th>
                                                <th className="border p-2 text-left whitespace-nowrap">Customer Name</th>
                                                <th className="border p-2 text-left whitespace-nowrap">Category</th>
                                                <th className="border p-2 text-left whitespace-nowrap">Sub Category</th>
                                                <th className="border p-2 text-left whitespace-nowrap">Remarks</th>
                                                <th className="border p-2 text-right whitespace-nowrap">Amount</th>
                                                <th className="border p-2 text-right whitespace-nowrap">Total Transaction</th>
                                                <th className="border p-2 text-right whitespace-nowrap">Discount</th>
                                                <th className="border p-2 text-right whitespace-nowrap">Bill Value</th>
                                                <th className="border p-2 text-right whitespace-nowrap">Cash</th>
                                                <th className="border p-2 text-right whitespace-nowrap">RBL</th>
                                                <th className="border p-2 text-right whitespace-nowrap">Bank</th>
                                                <th className="border p-2 text-right whitespace-nowrap">UPI</th>
                                            </tr>
                                        </thead>
                                        <tbody>{/* Opening Balance Row */}
                                            <tr className="bg-gray-100 font-bold">
                                                <td colSpan="10" className="border p-2 text-left">OPENING BALANCE</td>
                                                <td className="border p-2 text-right">{preOpen?.Closecash || 0}</td>
                                                <td className="border p-2 text-right">{preOpen?.rbl ?? 0}</td>
                                                <td className="border p-2 text-right">0</td>
                                                <td className="border p-2 text-right">0</td>
                                            </tr>

                                            {/* Transaction Rows */}
                                            {filteredTransactions.length > 0 ? (
                                                filteredTransactions.map((transaction, index) => (
                                                    <>
                                                        {transaction.Category === 'RentOut' ? (
                                                            <>
                                                                <tr key={`${index}-1`}>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.date}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.invoiceNo}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.customerName}</td>
                                                                    <td rowSpan="2" className="border p-2 text-left whitespace-nowrap">{transaction.Category}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.SubCategory}</td>
                                                                    <td className="border p-2 text-left"></td>
                                                                    <td className="border p-2 text-right">{transaction.securityAmount || 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {transaction.securityAmount + transaction.Balance}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{transaction.discountAmount || 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{transaction.invoiceAmount}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{transaction.rentoutCashAmount || 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{transaction.rbl ?? 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{parseInt(transaction.rentoutBankAmount) || 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{parseInt(transaction.rentoutUPIAmount) || 0}</td>
                                                                </tr>
                                                                <tr key={`${index}-2`}>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.rentOutDate || transaction.bookingDate}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.invoiceNo}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.customerName}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{transaction.SubCategory1}</td>
                                                                    <td className="border p-2 text-left"></td>
                                                                    <td className="border p-2 text-right">{transaction.Balance}</td>
                                                                </tr>
                                                            </>
                                                        ) : (
                                                            <tr key={index}>
                                                                <td className="border p-2 text-left whitespace-nowrap">{transaction.date}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{transaction.invoiceNo || transaction.locCode}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{transaction.customerName}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{transaction.category || transaction.Category || transaction.type}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{transaction.subCategory || transaction.SubCategory}</td>
                                                                <td className="border p-2 text-left">{transaction.remark}</td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.Category === 'Return' && transaction.returnCashAmount !== undefined ?
                                                                        (parseInt(transaction.returnCashAmount || 0) + parseInt(transaction.returnBankAmount || 0) + parseInt(transaction.returnUPIAmount || 0)) :
                                                                        transaction.Category === 'Return' ?
                                                                        (parseInt(transaction.amount || 0) || parseInt(transaction.totalTransaction || 0) || 
                                                                         (parseInt(transaction.cash || 0) + parseInt(transaction.bank || 0) + parseInt(transaction.upi || 0) + parseInt(transaction.rbl || 0))) :
                                                                        parseInt(transaction.returnCashAmount || 0) + parseInt(transaction.returnBankAmount || 0) ||
                                                                        parseInt(transaction.rentoutCashAmount || 0) + parseInt(transaction.rentoutBankAmount || 0) ||
                                                                        parseInt(transaction.bookingCashAmount || 0) + parseInt(transaction.bookingBankAmount || 0) + parseInt(transaction.bookingUPIAmount || 0) ||
                                                                        parseInt(transaction.amount || -(parseInt(transaction.advanceAmount || 0)) || 0)}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.Category === 'Return' && transaction.returnCashAmount !== undefined ?
                                                                        (parseInt(transaction.returnCashAmount || 0) + parseInt(transaction.returnBankAmount || 0) + parseInt(transaction.returnUPIAmount || 0) + parseInt(transaction.rblRazorPay || 0)) :
                                                                        transaction.Category === 'Return' ?
                                                                        (parseInt(transaction.totalTransaction || 0) || parseInt(transaction.amount || 0) || 
                                                                         (parseInt(transaction.cash || 0) + parseInt(transaction.bank || 0) + parseInt(transaction.upi || 0) + parseInt(transaction.rbl || 0))) :
                                                                        parseInt(transaction.returnCashAmount || 0) + parseInt(transaction.returnBankAmount || 0) ||
                                                                        parseInt(transaction.rentoutCashAmount || 0) + parseInt(transaction.rentoutBankAmount || 0) ||
                                                                        transaction.TotaltransactionBooking ||
                                                                        parseInt(transaction.totalTransaction || 0) ||
                                                                        parseInt(transaction.amount || -(parseInt(transaction.deleteBankAmount || 0) + parseInt(transaction.deleteCashAmount || 0)) || 0)}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.discountAmount || 0}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {parseInt(transaction.billValue) || parseInt(transaction.invoiceAmount) || parseInt(transaction.amount) || 0}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.Category === 'Cancel' ? 
                                                                        (parseInt(transaction.cash) || 0) :
                                                                        transaction.Category === 'Return' && transaction.returnCashAmount !== undefined ?
                                                                        (parseInt(transaction.returnCashAmount) || 0) :
                                                                        transaction.Category === 'Return' ?
                                                                        (parseInt(transaction.cash) || parseInt(transaction.cash1) || 0) :
                                                                        -(parseInt(transaction.deleteCashAmount)) ||
                                                                     parseInt(transaction.rentoutCashAmount) ||
                                                                     parseInt(transaction.bookingCashAmount) ||
                                                                     parseInt(transaction.returnCashAmount) ||
                                                                     parseInt(transaction.cash) ||
                                                                     parseInt(transaction.cash1) || 0}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.Category === 'Return' && transaction.returnRblAmount !== undefined ?
                                                                        (parseInt(transaction.returnRblAmount) || 0) :
                                                                        (transaction.rbl ?? transaction.rblRazorPay ?? 0)}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.Category === 'Return' && transaction.returnBankAmount !== undefined ? 
                                                                        (parseInt(transaction.returnBankAmount) || 0) :
                                                                        transaction.Category === 'Return' ?
                                                                        (parseInt(transaction.bank) || parseInt(transaction.bank1) || 0) :
                                                                        transaction.Category === 'Cancel' ?
                                                                        (parseInt(transaction.bank) || 0) :
                                                                        transaction.Category === 'RentOut' ?
                                                                        (parseInt(transaction.rentoutBankAmount) || 0) :
                                                                        transaction.Category === 'Booking' ?
                                                                        (parseInt(transaction.bookingBank1) || 0) :
                                                                        (parseInt(transaction.bank) || parseInt(transaction.bank1) || 0)
                                                                    }
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {transaction.Category === 'Return' && transaction.returnUPIAmount !== undefined ? 
                                                                        (parseInt(transaction.returnUPIAmount) || 0) :
                                                                        transaction.Category === 'Return' ?
                                                                        (parseInt(transaction.upi) || parseInt(transaction.Tupi) || 0) :
                                                                        transaction.Category === 'Cancel' ?
                                                                        (parseInt(transaction.upi) || 0) :
                                                                        transaction.Category === 'RentOut' ?
                                                                        (parseInt(transaction.rentoutUPIAmount) || 0) :
                                                                        transaction.Category === 'Booking' ?
                                                                        (parseInt(transaction.bookingUPIAmount) || 0) :
                                                                        (parseInt(transaction.upi) || parseInt(transaction.Tupi) || 0)
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="14" className="text-center border p-4">No transactions found</td>
                                                </tr>
                                            )}
                                        </tbody>

                                        <tfoot>
                                            <tr className="bg-gray-50 font-semibold">
                                                <td colSpan="10" className="border border-gray-300 px-4 py-2 text-left">Total:</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">{totalCash}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">{totalRblAmount}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">{totalBankAmount1}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">{totalBankAmountupi}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                            </div>



                            <div className="mt-8">
                                <div className="p-6 bg-white relative shadow-md rounded-lg">
                                    <div className='absolute top-4 right-4'>
                                        <button
                                            className='flex items-center gap-2 h-[40px] bg-blue-500 px-4 text-white rounded-md hover:bg-blue-800 cursor-pointer transition-colors'
                                            onClick={() => window.location.reload()}
                                        >
                                            <FiRefreshCw size={18} />
                                            Refresh Page
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                        {/* Denomination Section */}
                                        <div className='w-full'>
                                            <h3 className="text-lg font-semibold mb-4">Physical Cash Count</h3>
                                            <div className="grid grid-cols-3 gap-3 border-b pb-4 mb-4">
                                                <div className="font-bold text-sm">Denomination</div>
                                                <div className="font-bold text-sm">Quantity</div>
                                                <div className="font-bold text-sm">Amount</div>
                                                {denominations.map((denom, index) => (
                                                    <React.Fragment key={index}>
                                                        <div className="p-2 bg-gray-100 rounded text-sm">{denom.label}</div>
                                                        <input
                                                            type="number"
                                                            value={quantities[index]}
                                                            onChange={(e) => handleChange(index, e.target.value)}
                                                            className="p-2 border rounded text-center text-sm"
                                                            min="0"
                                                        />
                                                        <div className="p-2 bg-gray-100 rounded text-sm text-right">
                                                            {quantities[index] ? (quantities[index] * denom.value).toLocaleString() : "-"}
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>

                                            <div className="flex justify-between mt-4 text-lg font-semibold border-t pt-4">
                                                <span>TOTAL</span>
                                                <span>{preOpen1?.cash || totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Closing Cash Section */}
                                        <div className='w-full'>
                                            <h3 className="text-lg font-semibold mb-4">Cash Summary</h3>
                                            <div className="border p-4 rounded-md space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-700">Closing Cash</span>
                                                    <span className="font-bold text-lg">{totalCash.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-700">Physical Cash</span>
                                                    <span className="font-bold text-lg">{preOpen1?.Closecash ? preOpen1?.cash?.toLocaleString() : totalAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t">
                                                    <span className="text-red-600 font-semibold">Differences</span>
                                                    <span className="font-bold text-lg text-red-600">
                                                        {preOpen1?.cash ? ((totalCash - preOpen1?.cash) * -1).toLocaleString() : ((totalCash - totalAmount) * -1).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className='flex flex-wrap gap-2 mt-4'>
                                                {loading ? (
                                                    !preOpen1?.cash && (
                                                        <button className="w-full sm:w-auto flex-1 cursor-pointer bg-yellow-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors">
                                                            <span>🔃 Loading...!</span>
                                                        </button>
                                                    )
                                                ) : (
                                                    !preOpen1?.cash && (
                                                        <button 
                                                            onClick={CreateCashBank} 
                                                            className="w-full sm:w-auto flex-1 cursor-pointer bg-yellow-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors"
                                                        >
                                                            <span>💾 Save</span>
                                                        </button>
                                                    )
                                                )}
                                                {!loading && preOpen1?.cash && (
                                                    <button 
                                                        onClick={handlePrint} 
                                                        className="w-full sm:w-auto flex-1 cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                                                    >
                                                        <span>📥 Take PDF</span>
                                                    </button>
                                                )}
                                                <CSVLink 
                                                    data={csvData} 
                                                    headers={headers} 
                                                    filename={`${currentDate} DayBook report.csv`}
                                                    className="w-full sm:w-auto"
                                                >
                                                    <button className="w-full bg-blue-500 text-white h-10 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                                                        Export CSV
                                                    </button>
                                                </CSVLink>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>



                    </div>

                </div>


            </div>

        </>
    );
};

export default DayBookInc;
