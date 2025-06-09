import Headers from '../components/Header.jsx';
import { useEffect, useMemo, useRef, useState } from "react";
import useFetch from '../hooks/useFetch.jsx';

const Security = () => {
    const today = new Date().toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState("2025-01-01");
    const [toDate, setToDate] = useState(today);
    const [apiUrl1, setApiUrl1] = useState("");
    const [apiUrl2, setApiUrl2] = useState("");

    const currentusers = JSON.parse(localStorage.getItem("rootfinuser"));

    const handleFetch = () => {
        const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
        const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
        const updatedApiUrl2 = `${baseUrl1}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
        setApiUrl1(updatedApiUrl1);
        setApiUrl2(updatedApiUrl2);
    };

    useEffect(() => {
        if (currentusers?.locCode) {
            handleFetch();
        }
    }, []);

    const fetchOptions = useMemo(() => ({}), []);
    const { data: data1 } = useFetch(apiUrl1, fetchOptions);
    const { data: data2 } = useFetch(apiUrl2, fetchOptions);

    const printRef = useRef(null);

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;

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

    const rentOutTransactions = (data1?.dataSet?.data || []).map(transaction => ({
        ...transaction,
        bookingCashAmount: parseInt(transaction.bookingCashAmount, 10) || 0,
        bookingBankAmount: parseInt(transaction.bookingBankAmount, 10) || 0,
        invoiceAmount: parseInt(transaction.invoiceAmount, 10) || 0,
        securityAmount1: parseInt(transaction.securityAmount, 10) || 0,
        advanceAmount: parseInt(transaction.advanceAmount, 10) || 0,
        Balance: (parseInt(transaction.invoiceAmount ?? 0, 10) - parseInt(transaction.advanceAmount ?? 0, 10)) || 0,
        rentoutUPIAmount: parseInt(transaction.rentoutUPIAmount),
        Category: "RentOut",
        SubCategory: "Security",
        SubCategory1: "Balance Payable"
    }));

    const returnOutTransactions = (data2?.dataSet?.data || []).map(transaction => ({
        ...transaction,
        returnBankAmount: -(parseInt(transaction.returnBankAmount, 10) + parseInt(transaction.returnUPIAmount) || 0),
        returnCashAmount: -(parseInt(transaction.returnCashAmount, 10) || 0),
        invoiceAmount: parseInt(transaction.invoiceAmount, 10) || 0,
        advanceAmount: parseInt(transaction.advanceAmount, 10) || 0,
        securityAmountOut: (parseInt(transaction.securityAmount, 10) || 0),
        RsecurityAmount: (parseInt(transaction.securityAmount, 10) * -1 || 0),
        Category: "Return",
        SubCategory: "security Refund"
    }));

    const allTransactions = [...rentOutTransactions, ...returnOutTransactions];

    const outse = allTransactions.reduce(
        (sum, item) => sum + (parseInt(item.securityAmountOut, 10) || 0), 0
    );
    const Sein = allTransactions.reduce(
        (sum, item) => sum + (parseInt(item.securityAmount1, 10) || 0), 0
    );

    return (
        <div>
            <Headers title={"Security Report"} />
            <div className='ml-[240px]'>
                <div className="p-6 bg-gray-100 min-h-screen">
                    <div className="flex gap-4 mb-6 w-[800px]">
                        <div className='w-full flex flex-col'>
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
                    </div>

                    <div ref={printRef}>
                        <div className="bg-white p-4 shadow-md rounded-lg ">
                            <table className="w-full border-collapse border rounded-md border-gray-300">
                                <thead className='rounded-md'>
                                    <tr className="bg-[#7C7C7C] rounded-md text-white">
                                        <th className="border p-2">Date</th>
                                        <th className="border p-2">Invoice No.</th>
                                        <th className="border p-2">Customer Name</th>
                                        <th className="border p-2">Category</th>
                                        <th className="border p-2">Sub Category</th>
                                        <th className="border p-2">Security In</th>
                                        <th className="border p-2">Security Out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTransactions.length > 0 ? (
                                        allTransactions.map((transaction, index) => (
                                            <>
                                                {transaction.Category === 'RentOut' ? (
                                                    <tr key={`${index}-1`}>
                                                        <td className="border p-2">{transaction.rentOutDate}</td>
                                                        <td className="border p-2">{transaction.invoiceNo}</td>
                                                        <td className="border p-2">{transaction.customerName}</td>
                                                        <td className="border p-2">{transaction.Category}</td>
                                                        <td className="border p-2">{transaction.SubCategory}</td>
                                                        <td className="border p-2">{transaction.securityAmount1}</td>
                                                        <td className="border p-2">{transaction.securityAmountOut}</td>
                                                    </tr>
                                                ) : (
                                                    <tr key={index}>
                                                        <td className="border p-2">{transaction.returnedDate || transaction.rentOutDate || transaction.cancelDate || transaction.bookingDate || transaction.date}</td>
                                                        <td className="border p-2">{transaction.invoiceNo || transaction.locCode}</td>
                                                        <td className="border p-2">{transaction.customerName}</td>
                                                        <td className="border p-2">{transaction.Category || transaction.type}</td>
                                                        <td className="border p-2">{transaction.SubCategory || transaction.category}</td>
                                                        <td className="border p-2">{transaction.securityAmount1}</td>
                                                        <td className="border p-2">{transaction.securityAmountOut}</td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="11" className="text-center border p-4">No transactions found</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-white text-center font-semibold">
                                        <td className="border border-gray-300 px-4 py-2 text-left" colSpan="5">Difference :</td>
                                        <td colSpan='2' className="border border-gray-300 px-4 py-2">{Sein - outse}</td>
                                    </tr>
                                    <tr className="bg-white text-center font-semibold">
                                        <td className="border border-gray-300 px-4 py-2 text-left" colSpan="5">Total</td>
                                        <td className="border border-gray-300 px-4 py-2">{Sein}</td>
                                        <td className="border border-gray-300 px-4 py-2">{outse}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <button onClick={handlePrint} className="mt-6 w-[200px] float-right cursor-pointer bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                        <span>📥 Take pdf</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Security;

