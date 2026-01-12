import { CSVLink } from "react-csv";
import Headers from '../components/Header.jsx';
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import useFetch from '../hooks/useFetch.jsx';
import baseUrl from '../api/api.js';
import { useRef } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useEnterToSave } from "../hooks/useEnterToSave";




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
    
    // Edit functionality states
    const [editingIndex, setEditingIndex] = useState(null);
    const [editedTransaction, setEditedTransaction] = useState({});
    const [isSyncing, setIsSyncing] = useState(false);
    
    // State to store merged transactions (external API + edited overrides)
    const [mergedTransactions, setMergedTransactions] = useState([]);
    
    const currentusers = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object
    const showAction = (currentusers?.power || "").toLowerCase() === "admin";

    const date1 = new Date();
    const previousDate = new Date(date1);
    previousDate.setDate(date1.getDate() - 1);
    const TodayDate = `${String(date1.getDate()).padStart(2, '0')}-${String(date1.getMonth() + 1).padStart(2, '0')}-${date1.getFullYear()}`;
    const previousDate1 = `${String(previousDate.getDate()).padStart(2, '0')}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${previousDate.getFullYear()}`;
    const date = TodayDate;
    // console.log(currentusers);
    const currentDate = new Date().toISOString().split("T")[0];
    // Convert "04-04-2025" to "2025-04-04"
    const formatDate = (inputDate) => {
        const [day, month, year] = inputDate.split("-");
        return `${year}-${month}-${day}`;
    };

    // Example usage:

    const formattedDate = formatDate(previousDate1); // "2025-04-04"
    // console.log(formattedDate); // Removed to prevent continuous logging


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
    // Memoize transaction arrays to prevent infinite loops
    const bookingTransactions = useMemo(() => (data?.dataSet?.data || []).map(transaction => {
        const bookingCashAmount = parseInt(transaction?.bookingCashAmount || 0, 10);
        const bookingBankAmount = parseInt(transaction?.bookingBankAmount || 0, 10);
        const bookingUPIAmount = parseInt(transaction?.bookingUPIAmount || 0, 10);
        const rblAmount = parseInt(transaction?.rblRazorPay || 0, 10);
        const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
        const discountAmount = parseInt(transaction?.discountAmount || 0, 10);

        const totalAmount = bookingCashAmount + bookingBankAmount + bookingUPIAmount + rblAmount;

        return {
            ...transaction,
            date: transaction?.bookingDate?.split("T")[0] || transaction?.bookingDate || null,
            invoiceNo: transaction.invoiceNo || transaction.locCode || "",
            customerName: transaction.customerName || "",
            locCode: transaction.locCode || currentusers.locCode,
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
            remark: transaction.remark || "",
            source: "booking"
        };
    }), [data]);

    const canCelTransactions = useMemo(() => (data3?.dataSet?.data || []).map(transaction => {
        const deleteCashAmount = -Math.abs(parseInt(transaction.deleteCashAmount || 0));
        const deleteRblAmount = -Math.abs(parseInt(transaction.rblRazorPay || 0));
        
        // Only process bank/UPI if no RBL value (check original value, not negative)
        const originalRblAmount = parseInt(transaction.rblRazorPay || 0);
        const deleteBankAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteBankAmount || 0));
        const deleteUPIAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteUPIAmount || 0));

        const totalAmount = deleteCashAmount + deleteRblAmount + deleteBankAmount + deleteUPIAmount;

        return {
            ...transaction,
            date: transaction.cancelDate?.split("T")[0] || transaction.cancelDate,
            invoiceNo: transaction.invoiceNo || transaction.locCode || "",
            customerName: transaction.customerName || "",
            locCode: transaction.locCode || currentusers.locCode,
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
            remark: transaction.remark || "",
            source: "deleted"
        };
    }), [data3]);
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
    const Transactionsall = useMemo(() => {
        return (dayBookData || []).filter(transaction => {
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
    }, [dayBookData, currentusers.locCode]);
    const rentOutTransactions = useMemo(() => (data1?.dataSet?.data || []).map(transaction => {
        const rentoutCashAmount = parseInt(transaction?.rentoutCashAmount || 0, 10);
        const rentoutBankAmount = parseInt(transaction?.rentoutBankAmount || 0, 10);
        const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);

        const advanceAmount = parseInt(transaction?.advanceAmount || 0, 10);
        const rentoutUPIAmount = parseInt(transaction?.rentoutUPIAmount || 0, 10);
        const rblAmount = parseInt(transaction?.rblRazorPay || 0, 10);
        const securityAmount = parseInt(transaction?.securityAmount || 0, 10);

        return {
            ...transaction,
            date: (transaction?.rentOutDate?.split("T")[0]) || transaction?.rentOutDate || "",
            invoiceNo: transaction.invoiceNo || transaction.locCode || "",
            customerName: transaction.customerName || "",
            locCode: transaction.locCode || currentusers.locCode,
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
            remark: transaction.remark || "",
            source: "rentout"
        };
    }), [data1, currentusers.locCode]);



    //return

    const returnOutTransactions = useMemo(() => (data2?.dataSet?.data || []).map(transaction => {
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
            date: (transaction?.returnedDate || transaction?.returnDate || transaction?.createdDate || "").split("T")[0] || transaction?.returnedDate || null,
            invoiceNo: transaction.invoiceNo || transaction.locCode || "",
            customerName: transaction.customerName || transaction.custName || transaction.customer || "",
            locCode: transaction.locCode || currentusers.locCode,
            returnBankAmount,
            returnCashAmount,
            returnRblAmount,
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
            remark: transaction.remark || "",
            source: "return"
        };
    }), [data2, currentusers.locCode]);

    // Fetch edited transactions to override external API data
    const [overrideRows, setOverrideRows] = useState([]);
    
    useEffect(() => {
        const fetchEditedTransactions = async () => {
            try {
                const res = await fetch(
                    `${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${currentDate}&toDate=${currentDate}&locCode=${currentusers.locCode}`
                );
                const json = await res.json();
                setOverrideRows(json?.data || []);
            } catch (err) {
                console.warn("⚠️ Override fetch failed:", err.message);
                setOverrideRows([]);
            }
        };
        
        if (currentDate && currentusers?.locCode) {
            fetchEditedTransactions();
        }
    }, [currentDate, currentusers?.locCode]);

    // Create a map of edited transactions by invoiceNo
    const editedMap = useMemo(() => {
        const map = new Map();
        overrideRows.forEach(row => {
            const key = String(row.invoiceNo || row.invoice || "").trim();
            if (key) {
                const cash = Number(row.cash || 0);
                const rbl = Number(row.rbl || 0);
                const bank = Number(row.bank || 0);
                const upi = Number(row.upi || 0);
                const total = cash + rbl + bank + upi;
                
                map.set(key, {
                    ...row,
                    invoiceNo: key,
                    Category: row.type || row.Category,
                    SubCategory: row.category || row.SubCategory,
                    SubCategory1: row.subCategory1 || row.SubCategory1 || "Balance Payable",
                    billValue: Number(row.billValue ?? row.invoiceAmount ?? 0),
                    cash, rbl, bank, upi,
                    amount: total,
                    totalTransaction: total,
                    source: "edited"
                });
            }
        });
        return map;
    }, [overrideRows]);

    // Merge external API transactions with edited overrides
    // Memoize to prevent infinite loops
    const allTransactionsRaw = useMemo(() => [
        ...bookingTransactions,
        ...rentOutTransactions,
        ...returnOutTransactions,
        ...canCelTransactions,
        ...Transactionsall // Only allowed MongoDB categories
    ], [bookingTransactions, rentOutTransactions, returnOutTransactions, canCelTransactions, Transactionsall]);

    // Apply edited overrides to external API transactions
    const allTransactions = useMemo(() => {
        return allTransactionsRaw.map(t => {
            const key = String(t.invoiceNo || "").trim();
            const override = editedMap.get(key);
            const isRentOut = (t.Category || t.category || '').toLowerCase() === 'rentout';

            return override
                ? {
                    ...t,
                    ...override,
                    Category: override.Category || t.Category || "",
                    SubCategory: override.SubCategory || override.category || t.SubCategory || t.category || "",
                    SubCategory1: override.SubCategory1 || override.subCategory1 || t.SubCategory1 || t.subCategory1 || "",
                    customerName: override.customerName || t.customerName || "",
                    date: override.date || t.date || "",
                    securityAmount: isRentOut
                        ? Number(override.securityAmount ?? t.securityAmount ?? 0)
                        : 0,
                    Balance: isRentOut
                        ? Number(override.Balance ?? t.Balance ?? 0)
                        : 0,
                    cash: Number(override.cash ?? t.cash ?? 0),
                    rbl: Number(override.rbl ?? t.rbl ?? 0),
                    bank: Number(override.bank ?? t.bank ?? 0),
                    upi: Number(override.upi ?? t.upi ?? 0),
                    amount: Number(override.amount ?? t.amount ?? 0),
                    totalTransaction: isRentOut
                        ? Number(override.securityAmount ?? t.securityAmount ?? 0) + Number(override.Balance ?? t.Balance ?? 0)
                        : Number(override.totalTransaction ?? t.totalTransaction ?? (Number(override.cash ?? t.cash ?? 0) + Number(override.rbl ?? t.rbl ?? 0) + Number(override.bank ?? t.bank ?? 0) + Number(override.upi ?? t.upi ?? 0))),
                    _id: override._id || t._id, // Use edited transaction _id if available
                }
                : t;
        });
    }, [allTransactionsRaw, editedMap]);

    // Store merged transactions in state - initialize from allTransactions (same logic as Datewisedaybook.jsx)
    // Datewisedaybook.jsx doesn't have a useEffect that continuously updates mergedTransactions
    // It only sets mergedTransactions in handleFetch, then updates directly in handleSave
    useEffect(() => {
        // Only initialize if mergedTransactions is empty (first load)
        if (mergedTransactions.length === 0 && allTransactions.length > 0) {
            setMergedTransactions(allTransactions);
        }
    }, [allTransactions]);

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

    // Use mergedTransactions instead of allTransactions for filtering
    const filteredTransactions = mergedTransactions.filter((t) =>
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

    // Edit functionality handlers
    const handleEditClick = async (transaction, index) => {
        setIsSyncing(true);

        if (!transaction._id) {
            // Extract proper values from transaction, handling both external API and MongoDB formats
            const invoiceNo = transaction.invoiceNo || transaction.locCode || "";
            const dateValue = transaction.date || new Date().toISOString().split('T')[0];
            const cashValue = transaction.cash !== undefined ? transaction.cash : 
                             transaction.bookingCashAmount || 
                             transaction.rentoutCashAmount || 
                             transaction.returnCashAmount || 
                             transaction.deleteCashAmount || 0;
            const rblValue = transaction.rbl !== undefined ? transaction.rbl :
                            transaction.rblRazorPay || 0;
            const bankValue = transaction.bank !== undefined ? transaction.bank :
                            transaction.bookingBankAmount ||
                            transaction.rentoutBankAmount ||
                            transaction.returnBankAmount ||
                            transaction.deleteBankAmount || 0;
            const upiValue = transaction.upi !== undefined ? transaction.upi :
                            transaction.bookingUPIAmount ||
                            transaction.rentoutUPIAmount ||
                            transaction.returnUPIAmount ||
                            transaction.deleteUPIAmount || 0;

            const patchedTransaction = {
                ...transaction,
                customerName: transaction.customerName || transaction.customer || transaction.custName || "",
                locCode: transaction.locCode || currentusers.locCode,
                invoiceNo: invoiceNo,
                type: transaction.Category || transaction.type || transaction.category || 'income',
                category: transaction.SubCategory || transaction.subCategory || transaction.category || 'General',
                subCategory1: transaction.SubCategory1 || transaction.subCategory1 || "",
                paymentMethod: 'cash',
                date: dateValue,
                cash: Number(cashValue) || 0,
                rbl: Number(rblValue) || 0,
                bank: Number(bankValue) || 0,
                upi: Number(upiValue) || 0,
                billValue: transaction.billValue || transaction.invoiceAmount || transaction.amount || 0,
                amount: transaction.amount || transaction.totalTransaction || 0,
                totalTransaction: transaction.totalTransaction || transaction.amount || 0,
                remark: transaction.remark || transaction.remarks || "",
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

                // Update the transaction object with the new _id
                transaction._id = result.data._id;
                // Update mergedTransactions with the new _id (same logic as Datewisedaybook.jsx)
                setMergedTransactions(prev =>
                    prev.map(t => {
                        // Match by invoiceNo + date + Category to find the transaction
                        const tKey = String(t.invoiceNo || "").trim();
                        const updatedKey = String(transaction.invoiceNo || transaction.locCode || "").trim();
                        const tDate = t.date?.split("T")[0] || t.date;
                        const updatedDate = (transaction.date || "").split("T")[0] || transaction.date;
                        if (tKey === updatedKey && tDate === updatedDate && 
                            (t.Category === transaction.Category || t.category === transaction.Category)) {
                            return { ...t, _id: result.data._id };
                        }
                        return t;
                    })
                );
            } catch (err) {
                alert("❌ Sync error: " + err.message);
                setIsSyncing(false);
                return;
            }
        }

        setEditedTransaction({
            _id: transaction._id,
            cash: transaction.cash || 0,
            rbl: transaction.rbl || 0,
            bank: transaction.bank || 0,
            upi: transaction.upi || 0,
            securityAmount: transaction.securityAmount || 0,
            Balance: transaction.Balance || 0,
            date: transaction.date || "",
            customerName: transaction.customerName || "",
            invoiceNo: transaction.invoiceNo || transaction.locCode || "",
            Category: transaction.Category || transaction.type || transaction.category || "",
            SubCategory: transaction.SubCategory || transaction.subCategory || transaction.category || "",
            SubCategory1: transaction.SubCategory1 || transaction.subCategory1 || "",
            remark: transaction.remark || transaction.remarks || "",
            billValue: transaction.billValue || transaction.invoiceAmount || 0,
            discountAmount: transaction.discountAmount || 0,
            quantity: transaction.quantity || 1,
            totalTransaction:
                (transaction.Category === "RentOut")
                    ? (Number(transaction.securityAmount || 0) +
                        Number(transaction.Balance || 0))
                    : (Number(transaction.totalTransaction) ||
                        Number(transaction.amount) ||
                        (Number(transaction.cash || 0) +
                            Number(transaction.rbl || 0) +
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
        if (raw === '' || raw === '-') {
            setEditedTransaction(prev => ({ ...prev, [field]: raw }));
            return;
        }

        const numericValue = Number(raw);
        if (isNaN(numericValue)) return;

        setEditedTransaction(prev => {
            const cash = field === 'cash' ? numericValue : Number(prev.cash) || 0;
            const rbl = field === 'rbl' ? numericValue : Number(prev.rbl) || 0;
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
            const payTotal = cash + rbl + bank + upi;

            return {
                ...prev,
                [field]: numericValue,
                cash, rbl, bank, upi,
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
            cash, rbl, bank, upi,
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
            let adjRbl = Number(rbl) || 0;
            let adjBank = Number(bank) || 0;
            let adjUpi = Number(upi) || 0;

            const negRow = ["return", "cancel"].includes(
                (editedTransaction.Category || "").toLowerCase()
            );
            if (negRow) {
                adjCash = -Math.abs(adjCash);
                adjRbl = -Math.abs(adjRbl);
                adjBank = -Math.abs(adjBank);
                adjUpi = -Math.abs(adjUpi);
            }

            const isRentOut = editedTransaction.Category === "RentOut";
            const originalBillValue = editedTransaction.billValue;
            const computedTotal = isRentOut
                ? numSec + numBal
                : adjCash + adjRbl + adjBank + adjUpi;

            const paySum = adjCash + adjRbl + adjBank + adjUpi;
            if (!isRentOut && paySum !== computedTotal) {
                if (adjCash !== 0) { adjCash = computedTotal; adjRbl = adjBank = adjUpi = 0; }
                else if (adjRbl !== 0) { adjRbl = computedTotal; adjCash = adjBank = adjUpi = 0; }
                else if (adjBank !== 0) { adjBank = computedTotal; adjCash = adjRbl = adjUpi = 0; }
                else { adjUpi = computedTotal; adjCash = adjRbl = adjBank = 0; }
            }

            const payload = {
                cash: adjCash,
                rbl: adjRbl,
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

            // Create updatedRow (exact same structure as Datewisedaybook.jsx)
            const updatedRow = {
                ...editedTransaction,
                cash: adjCash,
                rbl: adjRbl,
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

            // Update mergedTransactions directly (exact same logic as Datewisedaybook.jsx)
            setMergedTransactions(prev =>
                prev.map(t => (t._id === _id ? updatedRow : t))
            );
            setEditingIndex(null);
        } catch (err) {
            console.error("Update error:", err);
            alert("❌ Update failed: " + err.message);
        }
    };

    // Enter key to save transaction (only when editing)
    useEnterToSave(() => {
        if (editingIndex !== null) {
            handleSave();
        }
    }, editingIndex === null);

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
                                                {showAction && <th className="border p-2 text-center whitespace-nowrap">Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody>                                            {/* Opening Balance Row */}
                                            <tr className="bg-gray-100 font-bold">
                                                <td colSpan="10" className="border p-2 text-left">OPENING BALANCE</td>
                                                <td className="border p-2 text-right">{preOpen?.Closecash || 0}</td>
                                                <td className="border p-2 text-right">{preOpen?.rbl ?? 0}</td>
                                                <td className="border p-2 text-right">0</td>
                                                <td className="border p-2 text-right">0</td>
                                                {showAction && <td className="border p-2"></td>}
                                            </tr>

                                            {/* Transaction Rows */}
                                            {filteredTransactions.length > 0 ? (
                                                filteredTransactions.map((transaction, index) => {
                                                    const isEditing = editingIndex === index;
                                                    const t = isEditing ? editedTransaction : transaction;

                                                    if (t.Category === 'RentOut') {
                                                        return (
                                                            <React.Fragment key={`${index}-rentout`}>
                                                                <tr>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.date}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.invoiceNo}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.customerName || "-"}</td>
                                                                    <td rowSpan="2" className="border p-2 text-left whitespace-nowrap">{t.Category}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.SubCategory}</td>
                                                                    <td className="border p-2 text-left"></td>
                                                                    <td className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editedTransaction.securityAmount}
                                                                                onChange={(e) => handleInputChange("securityAmount", e.target.value)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            t.securityAmount || 0
                                                                        )}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {t.totalTransaction || (t.securityAmount || 0) + (t.Balance || 0)}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{t.discountAmount || 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{t.billValue || t.invoiceAmount}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                step="any"
                                                                                value={editedTransaction.cash}
                                                                                onChange={(e) => handleInputChange("cash", e.target.value)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            t.rentoutCashAmount || t.cash || 0
                                                                        )}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editedTransaction.rbl}
                                                                                onChange={(e) => handleInputChange("rbl", e.target.value)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            t.rbl ?? 0
                                                                        )}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                step="any"
                                                                                value={editedTransaction.bank}
                                                                                onChange={(e) => handleInputChange("bank", e.target.value)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            parseInt(t.rentoutBankAmount) || t.bank || 0
                                                                        )}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                step="any"
                                                                                value={editedTransaction.upi}
                                                                                onChange={(e) => handleInputChange("upi", e.target.value)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            parseInt(t.rentoutUPIAmount) || t.upi || 0
                                                                        )}
                                                                    </td>
                                                                    {showAction && (
                                                                        <td rowSpan="2" className="border p-2 text-center">
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
                                                                <tr>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.rentOutDate || t.date || t.bookingDate}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.invoiceNo}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.customerName || "-"}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.SubCategory1}</td>
                                                                    <td className="border p-2 text-left"></td>
                                                                    <td className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editedTransaction.Balance}
                                                                                onChange={(e) => handleInputChange("Balance", e.target.value)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            t.Balance || 0
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </React.Fragment>
                                                        );
                                                    }

                                                    return (
                                                        <tr key={index}>
                                                                <td className="border p-2 text-left whitespace-nowrap">{t.date}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{t.invoiceNo || t.locCode}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{t.customerName || "-"}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{t.category || t.Category || t.type}</td>
                                                                <td className="border p-2 text-left whitespace-nowrap">{t.subCategory || t.SubCategory}</td>
                                                                <td className="border p-2 text-left">{t.remark || t.remarks || ""}</td>
                                                                <td className="border p-2 text-right">
                                                                    {isEditing && editedTransaction._id ? (
                                                                        <span>{t.amount || 0}</span>
                                                                    ) : (
                                                                        t.Category === 'Return' && t.returnCashAmount !== undefined ?
                                                                            (parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) + parseInt(t.returnUPIAmount || 0)) :
                                                                            t.Category === 'Return' ?
                                                                            (parseInt(t.amount || 0) || parseInt(t.totalTransaction || 0) || 
                                                                             (parseInt(t.cash || 0) + parseInt(t.bank || 0) + parseInt(t.upi || 0) + parseInt(t.rbl || 0))) :
                                                                            parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) ||
                                                                            parseInt(t.rentoutCashAmount || 0) + parseInt(t.rentoutBankAmount || 0) ||
                                                                            parseInt(t.bookingCashAmount || 0) + parseInt(t.bookingBankAmount || 0) + parseInt(t.bookingUPIAmount || 0) ||
                                                                            parseInt(t.amount || -(parseInt(t.advanceAmount || 0)) || 0)
                                                                    )}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {isEditing && editedTransaction._id ? (
                                                                        <span>{t.totalTransaction || 0}</span>
                                                                    ) : (
                                                                        t.Category === 'Return' && t.returnCashAmount !== undefined ?
                                                                            (parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) + parseInt(t.returnUPIAmount || 0) + parseInt(t.rblRazorPay || 0)) :
                                                                            t.Category === 'Return' ?
                                                                            (parseInt(t.totalTransaction || 0) || parseInt(t.amount || 0) || 
                                                                             (parseInt(t.cash || 0) + parseInt(t.bank || 0) + parseInt(t.upi || 0) + parseInt(t.rbl || 0))) :
                                                                            parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) ||
                                                                            parseInt(t.rentoutCashAmount || 0) + parseInt(t.rentoutBankAmount || 0) ||
                                                                            t.TotaltransactionBooking ||
                                                                            parseInt(t.totalTransaction || 0) ||
                                                                            parseInt(t.amount || -(parseInt(t.deleteBankAmount || 0) + parseInt(t.deleteCashAmount || 0)) || 0)
                                                                    )}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {t.discountAmount || 0}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {parseInt(t.billValue) || parseInt(t.invoiceAmount) || parseInt(t.amount) || 0}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {isEditing && editedTransaction._id ? (
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            value={editedTransaction.cash}
                                                                            onChange={(e) => handleInputChange("cash", e.target.value)}
                                                                            className="w-full"
                                                                        />
                                                                    ) : (
                                                                        t.Category === 'Cancel' ? 
                                                                            (parseInt(t.cash) || 0) :
                                                                            t.Category === 'Return' && t.returnCashAmount !== undefined ?
                                                                            (parseInt(t.returnCashAmount) || 0) :
                                                                            t.Category === 'Return' ?
                                                                            (parseInt(t.cash) || parseInt(t.cash1) || 0) :
                                                                            -(parseInt(t.deleteCashAmount)) ||
                                                                         parseInt(t.rentoutCashAmount) ||
                                                                         parseInt(t.bookingCashAmount) ||
                                                                         parseInt(t.returnCashAmount) ||
                                                                         parseInt(t.cash) ||
                                                                         parseInt(t.cash1) || 0
                                                                    )}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {isEditing && editedTransaction._id && t.SubCategory !== "Cash to Bank" ? (
                                                                        <input
                                                                            type="number"
                                                                            value={editedTransaction.rbl}
                                                                            onChange={(e) => handleInputChange("rbl", e.target.value)}
                                                                            className="w-full"
                                                                        />
                                                                    ) : (
                                                                        t.Category === 'Return' && t.returnRblAmount !== undefined ?
                                                                            (parseInt(t.returnRblAmount) || 0) :
                                                                            (t.rbl ?? t.rblRazorPay ?? 0)
                                                                    )}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {isEditing && editedTransaction._id ? (
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            value={editedTransaction.bank}
                                                                            onChange={(e) => handleInputChange("bank", e.target.value)}
                                                                            className="w-full"
                                                                        />
                                                                    ) : (
                                                                        t.Category === 'Return' && t.returnBankAmount !== undefined ? 
                                                                            (parseInt(t.returnBankAmount) || 0) :
                                                                            t.Category === 'Return' ?
                                                                            (parseInt(t.bank) || parseInt(t.bank1) || 0) :
                                                                            t.Category === 'Cancel' ?
                                                                            (parseInt(t.bank) || 0) :
                                                                            t.Category === 'RentOut' ?
                                                                            (parseInt(t.rentoutBankAmount) || 0) :
                                                                            t.Category === 'Booking' ?
                                                                            (parseInt(t.bookingBank1) || 0) :
                                                                            (parseInt(t.bank) || parseInt(t.bank1) || 0)
                                                                    )}
                                                                </td>
                                                                <td className="border p-2 text-right">
                                                                    {isEditing && editedTransaction._id ? (
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            value={editedTransaction.upi}
                                                                            onChange={(e) => handleInputChange("upi", e.target.value)}
                                                                            className="w-full"
                                                                        />
                                                                    ) : (
                                                                        t.Category === 'Return' && t.returnUPIAmount !== undefined ? 
                                                                            (parseInt(t.returnUPIAmount) || 0) :
                                                                            t.Category === 'Return' ?
                                                                            (parseInt(t.upi) || parseInt(t.Tupi) || 0) :
                                                                            t.Category === 'Cancel' ?
                                                                            (parseInt(t.upi) || 0) :
                                                                            t.Category === 'RentOut' ?
                                                                            (parseInt(t.rentoutUPIAmount) || 0) :
                                                                            t.Category === 'Booking' ?
                                                                            (parseInt(t.bookingUPIAmount) || 0) :
                                                                            (parseInt(t.upi) || parseInt(t.Tupi) || 0)
                                                                    )}
                                                                </td>
                                                                {showAction && (
                                                                    <td className="border p-2 text-center">
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
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={showAction ? 15 : 14} className="text-center border p-4">No transactions found</td>
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
