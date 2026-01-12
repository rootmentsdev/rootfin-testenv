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
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingId, setEditingId] = useState(null); // Use unique ID instead of index
    const [editedTransaction, setEditedTransaction] = useState({});
    const [isSyncing, setIsSyncing] = useState(false);
    const [allTransactionsState, setAllTransactionsState] = useState([]);


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
    const showAction = (currentusers.power || "").toLowerCase() === "admin";
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
    const [editedTransactions, setEditedTransactions] = useState([]);
    
    useEffect(() => {
        const fetchDayBookData = async () => {
            try {
                // Fetch edited transactions first
                let overrideRows = [];
                try {
                    const editedRes = await fetch(
                        `${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${currentDate}&toDate=${currentDate}&locCode=${currentusers.locCode}`
                    );
                    const editedJson = await editedRes.json();
                    overrideRows = editedJson?.data || [];
                    setEditedTransactions(overrideRows);
                } catch (err) {
                    console.warn("⚠️ Override fetch failed:", err.message);
                }

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
    }, [apiUrl4, apiUrl4_fallback, currentDate, currentusers.locCode]);

    // Create edited transactions map
    const editedMap = new Map();
    editedTransactions.forEach(row => {
        const key = String(row.invoiceNo || row.invoice).trim();
        const cash = Number(row.cash || 0);
        const rbl = Number(row.rbl || 0);
        const bank = Number(row.bank || 0);
        const upi = Number(row.upi || 0);
        const total = cash + rbl + bank + upi;
        editedMap.set(key, {
            ...row,
            invoiceNo: key,
            Category: row.type,
            SubCategory: row.category,
            SubCategory1: row.subCategory1 || row.SubCategory1 || "Balance Payable",
            billValue: Number(row.billValue ?? row.invoiceAmount ?? 0),
            cash, rbl, bank, upi,
            amount: total,
            totalTransaction: total,
            source: "edited"
        });
    });

    // console.log(data1);
    const bookingTransactions = (data?.dataSet?.data || []).map(transaction => {
        const key = String(transaction.invoiceNo).trim();
        const override = editedMap.get(key);
        
        const bookingCashAmount = parseInt(transaction?.bookingCashAmount || 0, 10);
        const bookingBankAmount = parseInt(transaction?.bookingBankAmount || 0, 10);
        const bookingUPIAmount = parseInt(transaction?.bookingUPIAmount || 0, 10);
        const rblAmount = parseInt(transaction?.rblRazorPay || 0, 10);
        const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
        const discountAmount = parseInt(transaction?.discountAmount || 0, 10);

        const totalAmount = bookingCashAmount + bookingBankAmount + bookingUPIAmount + rblAmount;

        const baseTransaction = {
            ...transaction,
            date: transaction?.bookingDate || null,
            bookingCashAmount: override ? override.cash : bookingCashAmount,
            bookingBankAmount: override ? override.bank : bookingBankAmount,
            billValue: transaction.invoiceAmount,
            discountAmount: discountAmount,
            invoiceAmount,
            bookingBank1: override ? override.bank : bookingBankAmount,
            TotaltransactionBooking: override ? override.totalTransaction : totalAmount,
            Category: override ? (override.Category || "Booking") : "Booking",
            SubCategory: override ? (override.SubCategory || "Advance") : "Advance",
            totalTransaction: override ? override.totalTransaction : totalAmount,
            cash: override ? override.cash : bookingCashAmount,
            rbl: override ? override.rbl : rblAmount,
            bank: override ? override.bank : bookingBankAmount,
            upi: override ? override.upi : bookingUPIAmount,
            amount: override ? override.amount : totalAmount,
        };

        return override ? { ...baseTransaction, ...override } : baseTransaction;
    });

    const canCelTransactions = (data3?.dataSet?.data || []).map(transaction => {
        const key = String(transaction.invoiceNo).trim();
        const override = editedMap.get(key);
        
        const deleteCashAmount = -Math.abs(parseInt(transaction.deleteCashAmount || 0));
        const deleteRblAmount = -Math.abs(parseInt(transaction.rblRazorPay || 0));
        
        // Only process bank/UPI if no RBL value (check original value, not negative)
        const originalRblAmount = parseInt(transaction.rblRazorPay || 0);
        const deleteBankAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteBankAmount || 0));
        const deleteUPIAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteUPIAmount || 0));

        const totalAmount = deleteCashAmount + deleteRblAmount + deleteBankAmount + deleteUPIAmount;

        const baseTransaction = {
            ...transaction,
            date: transaction.cancelDate,
            Category: override ? (override.Category || "Cancel") : "Cancel",
            SubCategory: override ? (override.SubCategory || "cancellation Refund") : "cancellation Refund",
            discountAmount: parseInt(transaction.discountAmount || 0),
            billValue: transaction.invoiceAmount,
            amount: override ? override.amount : totalAmount,
            totalTransaction: override ? override.totalTransaction : totalAmount,
            cash: override ? override.cash : deleteCashAmount,
            rbl: override ? override.rbl : deleteRblAmount,
            bank: override ? override.bank : deleteBankAmount,
            upi: override ? override.upi : deleteUPIAmount,
        };

        return override ? { ...baseTransaction, ...override } : baseTransaction;
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
        const key = String(transaction.invoiceNo).trim();
        const override = editedMap.get(key);
        
        const rentoutCashAmount = parseInt(transaction?.rentoutCashAmount ?? 0, 10);
        const rentoutBankAmount = parseInt(transaction?.rentoutBankAmount ?? 0, 10);
        const invoiceAmount = parseInt(transaction?.invoiceAmount ?? 0, 10);

        const advanceAmount = parseInt(transaction?.advanceAmount ?? 0, 10);
        const rentoutUPIAmount = parseInt(transaction?.rentoutUPIAmount ?? 0, 10);
        const rblAmount = parseInt(transaction?.rblRazorPay ?? 0, 10);
        const securityAmount = parseInt(transaction?.securityAmount ?? 0, 10);

        const baseTransaction = {
            ...transaction,
            date: transaction?.rentOutDate ?? "",
            rentoutCashAmount: override ? override.cash : rentoutCashAmount,
            rentoutBankAmount: override ? override.bank : rentoutBankAmount,
            invoiceAmount,
            discountAmount: parseInt(transaction.discountAmount || 0),
            billValue: transaction.invoiceAmount,
            securityAmount: override ? (override.securityAmount ?? securityAmount) : securityAmount,
            advanceAmount,
            Balance: override ? (override.Balance ?? (invoiceAmount - advanceAmount)) : (invoiceAmount - advanceAmount),
            rentoutUPIAmount: override ? override.upi : rentoutUPIAmount,
            Category: override ? (override.Category || "RentOut") : "RentOut",
            SubCategory: override ? (override.SubCategory || "Security") : "Security",
            SubCategory1: override ? (override.SubCategory1 || "Balance Payable") : "Balance Payable",
            totalTransaction: override ? override.totalTransaction : (rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount + rblAmount),
            cash: override ? override.cash : rentoutCashAmount,
            rbl: override ? override.rbl : rblAmount,
            bank: override ? override.bank : rentoutBankAmount,
            upi: override ? override.upi : rentoutUPIAmount,
            amount: override ? override.amount : (rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount + rblAmount),
        };

        return override ? { ...baseTransaction, ...override } : baseTransaction;
    });



    //return

    const returnOutTransactions = (data2?.dataSet?.data || []).map(transaction => {
        const key = String(transaction.invoiceNo).trim();
        const override = editedMap.get(key);
        
        const returnCashAmount = -(parseInt(transaction?.returnCashAmount || 0, 10));
        const returnRblAmount = -(parseInt(transaction?.rblRazorPay || 0, 10));
        
        // Only process bank/UPI if no RBL value
        const returnBankAmount = returnRblAmount !== 0 ? 0 : -(parseInt(transaction?.returnBankAmount || 0, 10));
        const returnUPIAmount = returnRblAmount !== 0 ? 0 : -(parseInt(transaction?.returnUPIAmount || 0, 10));
        
        const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
        const advanceAmount = parseInt(transaction?.advanceAmount || 0, 10);
        const RsecurityAmount = -(parseInt(transaction?.securityAmount || 0, 10));

        const totalAmount = returnCashAmount + returnRblAmount + returnBankAmount + returnUPIAmount;

        const baseTransaction = {
            ...transaction,
            date: transaction?.returnedDate || null,
            returnBankAmount: override ? override.bank : returnBankAmount,
            returnCashAmount: override ? override.cash : returnCashAmount,
            returnUPIAmount: override ? override.upi : returnUPIAmount,
            invoiceAmount,
            advanceAmount,
            discountAmount: parseInt(transaction.discountAmount || 0),
            billValue: invoiceAmount,
            amount: override ? override.amount : totalAmount,
            totalTransaction: override ? override.totalTransaction : totalAmount,
            RsecurityAmount,
            Category: override ? (override.Category || "Return") : "Return",
            SubCategory: override ? (override.SubCategory || "Security Refund") : "Security Refund",
            cash: override ? override.cash : returnCashAmount,
            rbl: override ? override.rbl : returnRblAmount,
            bank: override ? override.bank : returnBankAmount,
            upi: override ? override.upi : returnUPIAmount,
        };

        return override ? { ...baseTransaction, ...override } : baseTransaction;
    });



    const allTransactions = [
        ...bookingTransactions,
        ...rentOutTransactions,
        ...returnOutTransactions,
        ...canCelTransactions,
        ...Transactionsall // Only allowed MongoDB categories
    ];

    // Initialize state when transactions first load
    useEffect(() => {
        if (allTransactions.length > 0 && allTransactionsState.length === 0) {
            setAllTransactionsState(allTransactions);
        }
    }, [allTransactions.length]);

    // Use state transactions for display (allows updates without reload)
    const transactionsToDisplay = allTransactionsState.length > 0 ? allTransactionsState : allTransactions;

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

    const filteredTransactions = transactionsToDisplay.filter((t) =>
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

    const handleEditClick = async (transaction, index) => {
        setIsSyncing(true);

        // Find the transaction in state to ensure we have the latest version
        // If state is empty or transaction not found, use the transaction from filteredTransactions
        let stateTransaction = transaction;
        if (allTransactionsState.length > 0) {
            const found = allTransactionsState.find(t => 
                (t._id && t._id === transaction._id) ||
                (!t._id && !transaction._id && 
                 String(t.invoiceNo || "").trim() === String(transaction.invoiceNo || "").trim() &&
                 t.date === transaction.date &&
                 (t.Category || t.type) === (transaction.Category || transaction.type))
            );
            if (found) {
                stateTransaction = found;
            }
        }

        if (!stateTransaction._id) {
            // Extract cash, bank, rbl, upi based on transaction type for sync
            let syncCash = transaction.cash || 0;
            let syncRbl = transaction.rbl || transaction.rblRazorPay || 0;
            let syncBank = transaction.bank || 0;
            let syncUpi = transaction.upi || 0;

            // For API transactions, extract from specific fields
            if (transaction.Category === "Booking") {
                syncCash = transaction.bookingCashAmount || transaction.cash || 0;
                syncRbl = transaction.rblRazorPay || transaction.rbl || 0;
                syncBank = transaction.bookingBankAmount || transaction.bookingBank1 || transaction.bank || 0;
                syncUpi = transaction.bookingUPIAmount || transaction.upi || 0;
            } else if (transaction.Category === "RentOut") {
                syncCash = transaction.rentoutCashAmount || transaction.cash || 0;
                syncRbl = transaction.rblRazorPay || transaction.rbl || 0;
                syncBank = transaction.rentoutBankAmount || transaction.bank || 0;
                syncUpi = transaction.rentoutUPIAmount || transaction.upi || 0;
            } else if (transaction.Category === "Return") {
                syncCash = Math.abs(transaction.returnCashAmount || transaction.cash || transaction.cash1 || 0);
                syncRbl = Math.abs(transaction.rblRazorPay || transaction.rbl || 0);
                syncBank = Math.abs(transaction.returnBankAmount || transaction.bank || transaction.bank1 || 0);
                syncUpi = Math.abs(transaction.returnUPIAmount || transaction.upi || transaction.Tupi || 0);
            } else if (transaction.Category === "Cancel") {
                syncCash = Math.abs(transaction.deleteCashAmount || transaction.cash || 0);
                syncRbl = Math.abs(transaction.rblRazorPay || transaction.rbl || 0);
                syncBank = Math.abs(transaction.deleteBankAmount || transaction.bank || 0);
                syncUpi = Math.abs(transaction.deleteUPIAmount || transaction.upi || 0);
            }

            const patchedTransaction = {
                ...stateTransaction,
                customerName: transaction.customerName || "",
                locCode: transaction.locCode || currentusers.locCode,
                type: transaction.Category || transaction.type || 'income',
                category: transaction.SubCategory || transaction.category || 'General',
                paymentMethod: 'cash',
                date: transaction.date || new Date().toISOString().split('T')[0],
                cash: Number(syncCash) || 0,
                rbl: Number(syncRbl) || 0,
                bank: Number(syncBank) || 0,
                upi: Number(syncUpi) || 0,
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

                transaction._id = result.data._id;
                // Update the transaction in state
                setAllTransactionsState(prev =>
                    prev.map((t, idx) => {
                        // Match by invoiceNo and date to find the correct transaction
                        if ((t.invoiceNo === transaction.invoiceNo && t.date === transaction.date) || 
                            (idx === index && !t._id)) {
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

        // Extract cash, bank, rbl, upi based on transaction type
        let cash = stateTransaction.cash || 0;
        let rbl = stateTransaction.rbl || stateTransaction.rblRazorPay || 0;
        let bank = stateTransaction.bank || 0;
        let upi = stateTransaction.upi || 0;

        // For API transactions, extract from specific fields
        if (stateTransaction.Category === "Booking") {
            cash = stateTransaction.bookingCashAmount || stateTransaction.cash || 0;
            rbl = stateTransaction.rblRazorPay || stateTransaction.rbl || 0;
            bank = stateTransaction.bookingBankAmount || stateTransaction.bookingBank1 || stateTransaction.bank || 0;
            upi = stateTransaction.bookingUPIAmount || stateTransaction.upi || 0;
        } else if (stateTransaction.Category === "RentOut") {
            cash = stateTransaction.rentoutCashAmount || stateTransaction.cash || 0;
            rbl = stateTransaction.rblRazorPay || stateTransaction.rbl || 0;
            bank = stateTransaction.rentoutBankAmount || stateTransaction.bank || 0;
            upi = stateTransaction.rentoutUPIAmount || stateTransaction.upi || 0;
        } else if (stateTransaction.Category === "Return") {
            cash = stateTransaction.returnCashAmount || stateTransaction.cash || stateTransaction.cash1 || 0;
            rbl = stateTransaction.rblRazorPay || stateTransaction.rbl || 0;
            bank = stateTransaction.returnBankAmount || stateTransaction.bank || stateTransaction.bank1 || 0;
            upi = stateTransaction.returnUPIAmount || stateTransaction.upi || stateTransaction.Tupi || 0;
        } else if (stateTransaction.Category === "Cancel") {
            cash = stateTransaction.deleteCashAmount || stateTransaction.cash || 0;
            rbl = stateTransaction.rblRazorPay || stateTransaction.rbl || 0;
            bank = stateTransaction.deleteBankAmount || stateTransaction.bank || 0;
            upi = stateTransaction.deleteUPIAmount || stateTransaction.upi || 0;
        }

        setEditedTransaction({
            _id: stateTransaction._id,
            cash: Number(cash) || 0,
            rbl: Number(rbl) || 0,
            bank: Number(bank) || 0,
            upi: Number(upi) || 0,
            securityAmount: stateTransaction.securityAmount || 0,
            Balance: stateTransaction.Balance || 0,
            date: stateTransaction.date || "",
            customerName: stateTransaction.customerName || "",
            invoiceNo: stateTransaction.invoiceNo || stateTransaction.locCode || "",
            Category: stateTransaction.Category || stateTransaction.type || "",
            SubCategory: stateTransaction.SubCategory || stateTransaction.category || "",
            SubCategory1: stateTransaction.SubCategory1 || stateTransaction.subCategory1 || "",
            remark: stateTransaction.remark || "",
            billValue: stateTransaction.billValue || stateTransaction.invoiceAmount || 0,
            totalTransaction:
                (stateTransaction.Category === "RentOut")
                    ? (Number(stateTransaction.securityAmount || 0) +
                        Number(stateTransaction.Balance || 0))
                    : (Number(stateTransaction.totalTransaction) ||
                        Number(stateTransaction.amount) ||
                        (Number(cash) +
                            Number(rbl) +
                            Number(bank) +
                            Number(upi))),
            amount:
                (stateTransaction.Category === "RentOut")
                    ? (Number(stateTransaction.securityAmount || 0) +
                        Number(stateTransaction.Balance || 0))
                    : (stateTransaction.amount || 0)
        });

        // Use unique identifier for editing instead of index
        const uniqueId = stateTransaction._id || `${String(stateTransaction.invoiceNo || "").trim()}-${stateTransaction.date}-${stateTransaction.Category || stateTransaction.type || ""}`;
        setEditingId(uniqueId);
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

            // Update the transaction in state instead of reloading
            // Find the original transaction to preserve all fields
            const originalTransaction = allTransactionsState.find(t => 
                t._id === _id || 
                (String(t.invoiceNo || "").trim() === String(invoiceNo || invoice || "").trim() && 
                 t.date === date &&
                 (t.Category || t.type) === (editedTransaction.Category || ""))
            ) || editedTransaction;

            const updatedRow = {
                ...originalTransaction, // Preserve all original fields
                ...editedTransaction, // Override with edited values
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
                _id: _id, // Ensure _id is preserved
                // Preserve category fields
                Category: editedTransaction.Category || originalTransaction.Category || "",
                SubCategory: editedTransaction.SubCategory || originalTransaction.SubCategory || "",
                SubCategory1: editedTransaction.SubCategory1 || originalTransaction.SubCategory1 || "",
            };

            // Update the transaction in the state - ensure we update correctly
            setAllTransactionsState(prev => {
                const updated = prev.map(t => {
                    // Match by _id first (most reliable)
                    if (t._id === _id) {
                        // Return the updated row with all fields
                        return updatedRow;
                    }
                    // For API transactions without _id, match by invoiceNo, date, and Category
                    const invoiceMatch = String(t.invoiceNo || "").trim() === String(invoiceNo || invoice || "").trim();
                    const dateMatch = t.date === date;
                    const categoryMatch = (t.Category || t.type || "") === (editedTransaction.Category || "");
                    
                    if (!t._id && invoiceMatch && dateMatch && categoryMatch) {
                        // Return the updated row with _id
                        return updatedRow;
                    }
                    return t;
                });
                
                // If transaction wasn't found in state, add it (shouldn't happen but safety check)
                const found = updated.some(t => t._id === _id || 
                    (String(t.invoiceNo || "").trim() === String(invoiceNo || invoice || "").trim() && 
                     t.date === date));
                
                if (!found && updatedRow._id) {
                    updated.push(updatedRow);
                }
                
                return updated;
            });

            // Also update editedTransactions state so the override map includes this edit
            setEditedTransactions(prev => {
                const existingIndex = prev.findIndex(e => 
                    String(e.invoiceNo || e.invoice || "").trim() === String(invoiceNo || invoice || "").trim()
                );
                
                const editedEntry = {
                    invoiceNo: invoiceNo || invoice,
                    cash: adjCash,
                    rbl: adjRbl,
                    bank: adjBank,
                    upi: adjUpi,
                    date: date,
                    type: editedTransaction.Category || "",
                    category: editedTransaction.SubCategory || "",
                    subCategory1: editedTransaction.SubCategory1 || "",
                    billValue: originalBillValue,
                    securityAmount: numSec,
                    Balance: numBal,
                };
                
                if (existingIndex >= 0) {
                    // Update existing entry
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], ...editedEntry };
                    return updated;
                } else {
                    // Add new entry
                    return [...prev, editedEntry];
                }
            });

            setEditingIndex(null);
            setEditingId(null);
            setEditedTransaction({});
        } catch (err) {
            console.error("Update error:", err);
            alert("❌ Update failed: " + err.message);
        }
    };

    // Enter key to save transaction (only when editing)
    useEnterToSave(() => {
        if (editingId !== null) {
            handleSave();
        }
    }, editingId === null);

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
                                        <tbody>{/* Opening Balance Row */}
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
                                                    // Use unique ID to determine if editing
                                                    const uniqueId = transaction._id || `${String(transaction.invoiceNo || "").trim()}-${transaction.date}-${transaction.Category || transaction.type || ""}`;
                                                    const isEditing = editingId === uniqueId;
                                                    const t = isEditing ? editedTransaction : transaction;

                                                    if (transaction.Category === 'RentOut') {
                                                        return (
                                                            <>
                                                                <tr key={`${index}-1`}>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.date}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.invoiceNo}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.customerName}</td>
                                                                    <td rowSpan="2" className="border p-2 text-left whitespace-nowrap">{t.Category}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.SubCategory}</td>
                                                                    <td className="border p-2 text-left">{t.remark || ""}</td>
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
                                                                        {t.totalTransaction || (t.securityAmount + t.Balance)}
                                                                    </td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{t.discountAmount || 0}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">{t.invoiceAmount || t.billValue}</td>
                                                                    <td rowSpan="2" className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
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
                                                                            {isSyncing && isEditing ? (
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
                                                                <tr key={`${index}-2`}>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.rentOutDate || t.bookingDate || t.date}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.invoiceNo}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.customerName}</td>
                                                                    <td className="border p-2 text-left whitespace-nowrap">{t.SubCategory1}</td>
                                                                    <td className="border p-2 text-left">{t.remark || ""}</td>
                                                                    <td className="border p-2 text-right">
                                                                        {isEditing && editedTransaction._id ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editedTransaction.Balance}
                                                                                onChange={(e) => handleInputChange("Balance", e.target.value)}
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

                                                    return (
                                                        <tr key={index}>
                                                            <td className="border p-2 text-left whitespace-nowrap">{t.date}</td>
                                                            <td className="border p-2 text-left whitespace-nowrap">{t.invoiceNo || t.locCode}</td>
                                                            <td className="border p-2 text-left whitespace-nowrap">{t.customerName}</td>
                                                            <td className="border p-2 text-left whitespace-nowrap">{t.category || t.Category || t.type}</td>
                                                            <td className="border p-2 text-left whitespace-nowrap">{t.subCategory || t.SubCategory}</td>
                                                            <td className="border p-2 text-left">{t.remark || ""}</td>
                                                            <td className="border p-2 text-right">
                                                                {t.Category === 'Return' && t.returnCashAmount !== undefined ?
                                                                    (parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) + parseInt(t.returnUPIAmount || 0)) :
                                                                    t.Category === 'Return' ?
                                                                    (parseInt(t.amount || 0) || parseInt(t.totalTransaction || 0) || 
                                                                     (parseInt(t.cash || 0) + parseInt(t.bank || 0) + parseInt(t.upi || 0) + parseInt(t.rbl || 0))) :
                                                                    parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) ||
                                                                    parseInt(t.rentoutCashAmount || 0) + parseInt(t.rentoutBankAmount || 0) ||
                                                                    parseInt(t.bookingCashAmount || 0) + parseInt(t.bookingBankAmount || 0) + parseInt(t.bookingUPIAmount || 0) ||
                                                                    parseInt(t.amount || -(parseInt(t.advanceAmount || 0)) || 0)}
                                                            </td>
                                                            <td className="border p-2 text-right">
                                                                {t.totalTransaction || 
                                                                    (t.Category === 'Return' && t.returnCashAmount !== undefined ?
                                                                        (parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) + parseInt(t.returnUPIAmount || 0) + parseInt(t.rblRazorPay || 0)) :
                                                                        t.Category === 'Return' ?
                                                                        (parseInt(t.totalTransaction || 0) || parseInt(t.amount || 0) || 
                                                                         (parseInt(t.cash || 0) + parseInt(t.bank || 0) + parseInt(t.upi || 0) + parseInt(t.rbl || 0))) :
                                                                        parseInt(t.returnCashAmount || 0) + parseInt(t.returnBankAmount || 0) ||
                                                                        parseInt(t.rentoutCashAmount || 0) + parseInt(t.rentoutBankAmount || 0) ||
                                                                        t.TotaltransactionBooking ||
                                                                        parseInt(t.totalTransaction || 0) ||
                                                                        parseInt(t.amount || -(parseInt(t.deleteBankAmount || 0) + parseInt(t.deleteCashAmount || 0)) || 0))}
                                                            </td>
                                                            <td className="border p-2 text-right">
                                                                {t.discountAmount || 0}
                                                            </td>
                                                            <td className="border p-2 text-right">
                                                                {parseInt(t.billValue) || parseInt(t.invoiceAmount) || parseInt(t.amount) || 0}
                                                            </td>
                                                            <td className="border p-2 text-right">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
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
                                                                {isEditing ? (
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
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
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
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
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
                                                                    {isSyncing && isEditing ? (
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
                                                    <td colSpan={showAction ? "15" : "14"} className="text-center border p-4">No transactions found</td>
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
                                                {showAction && <td className="border border-gray-300 px-4 py-2"></td>}
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
