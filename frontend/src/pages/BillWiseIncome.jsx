// 

import { CSVLink } from "react-csv";
import Headers from '../components/Header.jsx';
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import useFetch from '../hooks/useFetch.jsx';
import baseUrl from '../api/api.js';
import { useRef } from "react";
import { FiRefreshCw } from "react-icons/fi";
// Add React Bootstrap imports
import { Container, Row, Col, Table, Button, Form, Card, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

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
    { label: "Bill Value", key: "billValue" },
    { label: "security", key: "securityAmount" },
    { label: "Balance Payable", key: "Balance" },
    { label: "Remark", key: "remark" },
    { label: "Cash", key: "cash" },
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
    { value: "shoe sales", label: "Shoe Sales" }
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

    const currentusers = JSON.parse(localStorage.getItem("rootfinuser"));
    const currentDate = new Date().toISOString().split("T")[0];
    
    const formatDate = (inputDate) => {
        const [day, month, year] = inputDate.split("-");
        return `${year}-${month}-${day}`;
    };

    const formattedDate = formatDate(previousDate1);
    console.log(formattedDate);

    // All API URLs remain the same
    const apiUrl = `https://rentalapi.rootments.live/api/GetBooking/GetBookingList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
    const apiurl1 = `https://rentalapi.rootments.live/api/GetBooking/GetRentoutList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
    const apiUrl2 = `https://rentalapi.rootments.live/api/GetBooking/GetReturnList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`
    const apiUrl3 = `https://rentalapi.rootments.live/api/GetBooking/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`
    const apiUrl4 = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentusers.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
    const apiUrl5 = `${baseUrl.baseUrl}user/saveCashBank`
    const apiUrl6 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${formattedDate}`
    const apiUrl7 = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentusers.locCode}&date=${currentDate}`

    const locCode = currentusers?.locCode
    const email = currentusers?.email

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
        window.location.reload();
    };

    const fetchOptions = useMemo(() => ({}), []);

    const { data } = useFetch(apiUrl, fetchOptions);
    const { data: data1 } = useFetch(apiurl1, fetchOptions);
    const { data: data2 } = useFetch(apiUrl2, fetchOptions);
    const { data: data3 } = useFetch(apiUrl3, fetchOptions);
    const { data: data4 } = useFetch(apiUrl4, fetchOptions);

    // All existing transaction processing logic remains the same
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

    const canCelTransactions = (data3?.dataSet?.data || []).map(transaction => ({
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
        "other expenses",
        "shoe sales return",
        "shirt sales return",
        "cash to bank",
        "bank to cash",
        "compensation",
        "shoe sales",
        "shirt sales",  
        "write off"
    ];

    const Transactionsall = (data4?.data || []).filter(transaction => {
        const cat = (transaction.category || "").toLowerCase();
        return allowedMongoCategories.includes(cat);
    }).map(transaction => ({
        ...transaction,
        locCode: currentusers.locCode,
        date: transaction.date.split("T")[0],
        Category: transaction.type,
        cash1: transaction.cash,
        bank1: transaction.bank,
        subCategory: transaction.category,
        billValue: transaction.amount,
        Tupi: transaction.upi
    }));

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

    const allTransactions = [
        ...bookingTransactions,
        ...rentOutTransactions,
        ...returnOutTransactions,
        ...canCelTransactions,
        ...Transactionsall
    ];

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

    const selectedCategoryValue = selectedCategory?.value?.toLowerCase() || "all";
    const selectedSubCategoryValue = selectedSubCategory?.value?.toLowerCase() || "all";

    const filteredTransactions = allTransactions.filter((t) =>
        (selectedCategoryValue === "all" || (t.category?.toLowerCase() === selectedCategoryValue || t.Category?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue || t.type?.toLowerCase() === selectedCategoryValue)) &&
        (selectedSubCategoryValue === "all" || (t.subCategory?.toLowerCase() === selectedSubCategoryValue || t.SubCategory?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.type?.toLowerCase() === selectedSubCategoryValue || t.subCategory1?.toLowerCase() === selectedSubCategoryValue || t.SubCategory1?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue || t.category?.toLowerCase() === selectedSubCategoryValue))
    );

    // All calculation logic remains the same
    const totalBankAmount = (filteredTransactions?.reduce((sum, item) =>
        sum +
        (parseInt(item.bookingBankAmount, 10) || 0) +
        (parseInt(item.rentoutBankAmount, 10) || 0) +
        (parseInt(item.rentoutUPIAmount, 10) || 0) +
        (parseInt(item.bookingUPIAmount, 10) || 0) +
        (parseInt(item.deleteBankAmount, 10) || 0) * -1 +
        (parseInt(item.deleteUPIAmount, 10) || 0) * -1 +
        (parseInt(item.returnBankAmount, 10) || 0),
        0
    ) || 0);

    const totalBankAmount1 = (filteredTransactions?.reduce((sum, item) =>
        sum +
        (parseInt(item.bookingBank1, 10) || 0) +
        (parseInt(item.rentoutBankAmount, 10) || 0) +
        (parseInt(item.returnBankAmount, 10) || 0) +
        (parseInt(item.deleteBankAmount, 10) || 0) * -1 +
        (parseInt(item.bank1, 10) || 0),
        0
    ) || 0);

    const totalBankAmountupi = (filteredTransactions?.reduce((sum, item) =>
        sum +
        (parseInt(item.rentoutUPIAmount, 10) || 0) +
        (parseInt(item.bookingUPIAmount, 10) || 0) +
        (parseInt(item.returnUPIAmount, 10) || 0) +
        (parseInt(item.deleteUPIAmount, 10) || 0) * -1 +
        (parseInt(item.Tupi, 10) || 0),
        0
    ) || 0);

    const totalCash = (filteredTransactions?.reduce((sum, item) =>
        sum +
        (parseInt(item.bookingCashAmount, 10) || 0) +
        (parseInt(item.rentoutCashAmount, 10) || 0) +
        (parseInt(item.returnCashAmount, 10) || 0) +
        (parseInt(item.cash1, 10) || 0) +
        ((parseInt(item.deleteCashAmount, 10) || 0) * -1),
        0
    ) + (parseInt(preOpen?.Closecash, 10) || 0));

    const savedData = {
        date,
        locCode,
        email,
        totalCash,
        totalAmount,
        totalBankAmount
    }

    // All API functions remain the same
    const CreateCashBank = async () => {
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

    const takeCreateCashBank = async () => {
        try {
            const response = await fetch(apiUrl7, { method: 'GET' });
            if (response.status === 404) {
                console.log("No closing data yet for today.");
                return;
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

    const csvData = filteredTransactions.map(transaction => ({
        ...transaction,
        cash:
            -(parseInt(transaction.deleteCashAmount)) ||
            parseInt(transaction.rentoutCashAmount) ||
            parseInt(transaction.bookingCashAmount) ||
            parseInt(transaction.returnCashAmount) ||
            parseInt(transaction.cash1) || 0,
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
            <Headers title={"Day Book"} />
            
            {/* Custom CSS for responsive design */}
            <style>
                {`
                    .sidebar-margin {
                        margin-left: 0;
                    }
                    
                    @media (min-width: 576px) {
                        .sidebar-margin {
                            margin-left: 60px;
                        }
                    }
                    
                    @media (min-width: 992px) {
                        .sidebar-margin {
                            margin-left: 240px;
                        }
                    }
                    
                    .mobile-table {
                        font-size: 11px;
                    }
                    
                    .mobile-table th,
                    .mobile-table td {
                        padding: 4px !important;
                        white-space: nowrap;
                        min-width: 80px;
                    }
                    
                    @media (max-width: 767px) {
                        .mobile-table {
                            font-size: 10px;
                        }
                        
                        .mobile-table th,
                        .mobile-table td {
                            padding: 2px !important;
                            min-width: 60px;
                        }
                    }
                    
                    .mobile-card {
                        display: none;
                    }
                    
                    @media (max-width: 767px) {
                        .desktop-table {
                            display: none;
                        }
                        
                        .mobile-card {
                            display: block;
                        }
                    }
                `}
            </style>

            <div className="sidebar-margin">
                <Container fluid className="p-2 p-sm-3 p-md-4">
                    <div className="bg-light min-vh-100 p-2 p-sm-3">
                        
                        {/* Dropdowns - Responsive */}
                        <Row className="mb-3 mb-md-4">
                            <Col xs={12} sm={6} className="mb-3">
                                <Form.Label className="fw-semibold">Category</Form.Label>
                                <Select
                                    options={categories}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                />
                            </Col>
                            <Col xs={12} sm={6} className="mb-3">
                                <Form.Label className="fw-semibold">Sub Category</Form.Label>
                                <Select
                                    options={subCategories}
                                    value={selectedSubCategory}
                                    onChange={setSelectedSubCategory}
                                />
                            </Col>
                        </Row>

                        <div ref={printRef}>
                            {/* Desktop Table */}
                            <Card className="shadow-sm mb-4 desktop-table">
                                <Card.Body className="p-1 p-sm-2 p-md-3">
                                    <div className="table-responsive">
                                        <Table bordered hover size="sm" className="mobile-table mb-0">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Invoice No.</th>
                                                    <th>Customer Name</th>
                                                    <th>Category</th>
                                                    <th>Sub Category</th>
                                                    <th>Remarks</th>
                                                    <th>Amount</th>
                                                    <th>Total Transaction</th>
                                                    <th>Bill Value</th>
                                                    <th>Cash</th>
                                                    <th>RBL</th>
                                                    <th>Bank</th>
                                                    <th>UPI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Opening Balance Row */}
                                                <tr className="table-secondary fw-bold">
                                                    <td colSpan="9">OPENING BALANCE</td>
                                                    <td>{preOpen.Closecash}</td>
                                                    <td>{preOpen.rbl ?? 0}</td>
                                                    <td>0</td>
                                                    <td>0</td>
                                                </tr>

                                                {/* Transaction Rows */}
                                                {filteredTransactions.length > 0 ? (
                                                    filteredTransactions.map((transaction, index) => (
                                                        <React.Fragment key={index}>
                                                            {transaction.Category === 'RentOut' ? (
                                                                <>
                                                                    <tr>
                                                                        <td>{transaction.date}</td>
                                                                        <td>{transaction.invoiceNo}</td>
                                                                        <td>{transaction.customerName}</td>
                                                                        <td rowSpan="2">{transaction.Category}</td>
                                                                        <td>{transaction.SubCategory}</td>
                                                                        <td></td>
                                                                        <td>{transaction.securityAmount || 0}</td>
                                                                        <td rowSpan="2">
                                                                            {transaction.securityAmount + transaction.Balance}
                                                                        </td>
                                                                        <td rowSpan="2">{transaction.invoiceAmount}</td>
                                                                        <td rowSpan="2">{transaction.rentoutCashAmount || 0}</td>
                                                                        <td rowSpan="2">{transaction.rbl ?? 0}</td>
                                                                        <td rowSpan="2">{parseInt(transaction.rentoutBankAmount) || 0}</td>
                                                                        <td rowSpan="2">{parseInt(transaction.rentoutUPIAmount) || 0}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>{transaction.rentOutDate || transaction.bookingDate}</td>
                                                                        <td>{transaction.invoiceNo}</td>
                                                                        <td>{transaction.customerName}</td>
                                                                        <td>{transaction.SubCategory1}</td>
                                                                        <td></td>
                                                                        <td>{transaction.Balance}</td>
                                                                    </tr>
                                                                </>
                                                            ) : (
                                                                <tr>
                                                                    <td>{transaction.date}</td>
                                                                    <td>{transaction.invoiceNo || transaction.locCode}</td>
                                                                    <td>{transaction.customerName}</td>
                                                                    <td>{transaction.Category || transaction.type}</td>
                                                                    <td>{transaction.SubCategory || transaction.category}</td>
                                                                    <td>{transaction.remark}</td>
                                                                    <td>
                                                                        {parseInt(transaction.returnCashAmount || 0) + parseInt(transaction.returnBankAmount || 0) ||
                                                                            parseInt(transaction.rentoutCashAmount || 0) + parseInt(transaction.rentoutBankAmount || 0) ||
                                                                            parseInt(transaction.bookingCashAmount || 0) + parseInt(transaction.bookingBankAmount || 0) + parseInt(transaction.bookingUPIAmount || 0) ||
                                                                            parseInt(transaction.amount || -(parseInt(transaction.advanceAmount || 0)) || 0)}
                                                                    </td>
                                                                    <td>
                                                                        {parseInt(transaction.returnCashAmount || 0) + parseInt(transaction.returnBankAmount || 0) ||
                                                                            parseInt(transaction.rentoutCashAmount || 0) + parseInt(transaction.rentoutBankAmount || 0) ||
                                                                            transaction.TotaltransactionBooking ||
                                                                            parseInt(transaction.amount || -(parseInt(transaction.deleteBankAmount || 0) + parseInt(transaction.deleteCashAmount || 0)) || 0)}
                                                                    </td>
                                                                    <td>
                                                                        {parseInt(transaction.invoiceAmount) || parseInt(transaction.amount) || 0}
                                                                    </td>
                                                                    <td>
                                                                        {-(parseInt(transaction.deleteCashAmount)) ||
                                                                         parseInt(transaction.rentoutCashAmount) ||
                                                                         parseInt(transaction.bookingCashAmount) ||
                                                                         parseInt(transaction.returnCashAmount) ||
                                                                         parseInt(transaction.cash1) || 0}
                                                                    </td>
                                                                    <td>{transaction.rbl ?? 0}</td>
                                                                    <td>
                                                                        {parseInt(transaction.rentoutBankAmount) ||
                                                                         parseInt(transaction.bookingBank1) ||
                                                                         parseInt(transaction.returnBankAmount) ||
                                                                         parseInt(transaction.deleteBankAmount) * -1 ||
                                                                         parseInt(transaction.bank1) || 0}
                                                                    </td>
                                                                    <td>
                                                                        {parseInt(transaction.rentoutUPIAmount) ||
                                                                         parseInt(transaction.bookingUPIAmount) ||
                                                                         parseInt(transaction.returnUPIAmount) ||
                                                                         parseInt(transaction.deleteUPIAmount) * -1 ||
                                                                         parseInt(transaction.Tupi) || 0}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="13" className="text-center py-3">No transactions found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot className="table-light fw-semibold">
                                                <tr>
                                                    <td colSpan="9">Total:</td>
                                                    <td>{totalCash}</td>
                                                    <td>0</td>
                                                    <td>{totalBankAmount1}</td>
                                                    <td>{totalBankAmountupi}</td>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Mobile Card View */}
                            <div className="mobile-card">
                                {/* Opening Balance */}
                                <Card className="mb-3">
                                    <Card.Header className="bg-secondary text-white">
                                        <strong>OPENING BALANCE</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col xs={6}>Cash: <Badge bg="primary">{preOpen.Closecash}</Badge></Col>
                                            <Col xs={6}>RBL: <Badge bg="info">{preOpen.rbl ?? 0}</Badge></Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Transaction Cards */}
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction, index) => (
                                        <Card key={index} className="mb-2">
                                            <Card.Body className="p-2">
                                                <Row className="g-1">
                                                    <Col xs={6}>
                                                        <small className="text-muted">Date:</small><br />
                                                        <strong>{transaction.date}</strong>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <small className="text-muted">Invoice:</small><br />
                                                        <strong>{transaction.invoiceNo || transaction.locCode}</strong>
                                                    </Col>
                                                    <Col xs={12}>
                                                        <small className="text-muted">Customer:</small><br />
                                                        <strong>{transaction.customerName}</strong>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <small className="text-muted">Category:</small><br />
                                                        <Badge bg="secondary">{transaction.Category || transaction.type}</Badge>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <small className="text-muted">Sub Category:</small><br />
                                                        <Badge bg="outline-secondary">{transaction.SubCategory || transaction.category}</Badge>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <small className="text-muted">Cash:</small><br />
                                                        <Badge bg="success">
                                                            {-(parseInt(transaction.deleteCashAmount)) ||
                                                             parseInt(transaction.rentoutCashAmount) ||
                                                             parseInt(transaction.bookingCashAmount) ||
                                                             parseInt(transaction.returnCashAmount) ||
                                                             parseInt(transaction.cash1) || 0}
                                                        </Badge>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <small className="text-muted">Bank:</small><br />
                                                        <Badge bg="warning">
                                                            {parseInt(transaction.rentoutBankAmount) ||
                                                             parseInt(transaction.bookingBank1) ||
                                                             parseInt(transaction.returnBankAmount) ||
                                                             parseInt(transaction.deleteBankAmount) * -1 ||
                                                             parseInt(transaction.bank1) || 0}
                                                        </Badge>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <small className="text-muted">UPI:</small><br />
                                                        <Badge bg="info">
                                                            {parseInt(transaction.rentoutUPIAmount) ||
                                                             parseInt(transaction.bookingUPIAmount) ||
                                                             parseInt(transaction.returnUPIAmount) ||
                                                             parseInt(transaction.deleteUPIAmount) * -1 ||
                                                             parseInt(transaction.Tupi) || 0}
                                                        </Badge>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    ))
                                ) : (
                                    <Card>
                                        <Card.Body className="text-center">
                                            No transactions found
                                        </Card.Body>
                                    </Card>
                                )}

                                {/* Mobile Totals */}
                                <Card className="mt-3">
                                    <Card.Header className="bg-primary text-white">
                                        <strong>TOTALS</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col xs={6}>Cash: <Badge bg="success">{totalCash}</Badge></Col>
                                            <Col xs={6}>Bank: <Badge bg="warning">{totalBankAmount1}</Badge></Col>
                                            <Col xs={6}>RBL: <Badge bg="info">0</Badge></Col>
                                            <Col xs={6}>UPI: <Badge bg="secondary">{totalBankAmountupi}</Badge></Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </div>
                        </div>

                        {/* Bottom Section - Responsive */}
                        <Card className="shadow-sm">
                            <Card.Body className="p-2 p-sm-3">
                                {/* Refresh Button */}
                                <div className="d-flex justify-content-end mb-3">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="d-flex align-items-center gap-2"
                                        onClick={() => window.location.reload()}
                                    >
                                        <FiRefreshCw size={16} />
                                        <span className="d-none d-sm-inline">Refresh Page</span>
                                        <span className="d-sm-none">Refresh</span>
                                    </Button>
                                </div>

                                <Row>
                                    {/* Denomination section */}
                                    <Col xs={12} lg={7} className="mb-4">
                                        <Card>
                                            <Card.Header>
                                                <h6 className="mb-0">Cash Denomination</h6>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="table-responsive">
                                                    <Table size="sm" className="mb-3">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Denom.</th>
                                                                <th>Qty</th>
                                                                <th>Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {denominations.map((denom, index) => (
                                                                <tr key={index}>
                                                                    <td className="bg-light">{denom.label}</td>
                                                                    <td>
                                                                        <Form.Control
                                                                            type="number"
                                                                            size="sm"
                                                                            value={quantities[index]}
                                                                            onChange={(e) => handleChange(index, e.target.value)}
                                                                            className="text-center"
                                                                            style={{ fontSize: '12px' }}
                                                                        />
                                                                    </td>
                                                                    <td className="bg-light">
                                                                        <small>{quantities[index] ? quantities[index] * denom.value : "-"}</small>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                                <div className="d-flex justify-content-between border-top pt-2">
                                                    <strong>TOTAL</strong>
                                                    <strong>{preOpen1?.cash || totalAmount}</strong>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Summary section */}
                                    <Col xs={12} lg={5} className="mb-4">
                                        <Card className="h-100">
                                            <Card.Header>
                                                <h6 className="mb-0">Cash Summary</h6>
                                            </Card.Header>
                                            <Card.Body className="d-flex flex-column justify-content-between">
                                                <div className="border rounded p-2 p-sm-3 mb-3">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Closing Cash</span>
                                                        <strong>{totalCash}</strong>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Physical Cash</span>
                                                        <strong>{preOpen1?.Closecash ? preOpen1?.cash : totalAmount}</strong>
                                                    </div>
                                                    <div className="d-flex justify-content-between text-danger">
                                                        <span>Differences</span>
                                                        <strong>{preOpen1?.cash ? (totalCash - preOpen1?.cash) * -1 : (totalCash - totalAmount) * -1}</strong>
                                                    </div>
                                                </div>

                                                {/* Action Buttons - Responsive */}
                                                <div className="d-flex flex-column flex-sm-row gap-2">
                                                    {loading ? (
                                                        !preOpen1?.cash && (
                                                            <Button variant="warning" disabled className="flex-fill">
                                                                🔃 Loading...!
                                                            </Button>
                                                        )
                                                    ) : (
                                                        !preOpen1?.cash && (
                                                            <Button onClick={CreateCashBank} variant="warning" className="flex-fill">
                                                                💾 Save
                                                            </Button>
                                                        )
                                                    )}
                                                    {!loading && preOpen1?.cash && (
                                                        <Button onClick={handlePrint} variant="primary" className="flex-fill">
                                                            📥 Take PDF
                                                        </Button>
                                                    )}
                                                    <CSVLink 
                                                        data={csvData} 
                                                        headers={headers} 
                                                        filename={`${currentDate} DayBook report.csv`}
                                                        className="flex-fill"
                                                    >
                                                        <Button variant="success" className="w-100">
                                                            Export CSV
                                                        </Button>
                                                    </CSVLink>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </div>
                </Container>
            </div>
        </>
    );
};

export default DayBookInc;
