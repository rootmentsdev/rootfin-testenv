import { useMemo, useRef, useState } from 'react';
import Headers from '../components/Header.jsx';
import useFetch from '../hooks/useFetch.jsx';
import { Helmet } from "react-helmet";
import { FiCalendar, FiDownload, FiPrinter, FiTrendingUp } from "react-icons/fi";

const DayBook = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [apiUrl, setApiUrl] = useState("");
    const currentusers = JSON.parse(localStorage.getItem("rootfinuser")); 

    const handleFetch = () => {
        const baseUrl = "https://rentalapi.rootments.live/api/GetBooking";
        if (!fromDate || !toDate) {
            return alert("Please select both dates");
        } else {
            const updatedApiUrl = `${baseUrl}/GetRentoutListDateWise?LocCode=${currentusers?.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
            setApiUrl(updatedApiUrl);
            console.log("API URLs Updated:", updatedApiUrl);
        }
    };

    const fetchOptions = useMemo(() => ({}), []);
    const { data } = useFetch(apiUrl, fetchOptions);
    console.log(data);
    const printRef = useRef(null);

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = `<html><head><title>Day Book Report</title>
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

    // Calculate totals
    const totals = data?.dataSet?.data?.reduce((acc, item) => ({
        bills: acc.bills + (parseInt(item.bills) || 0),
        quantity: acc.quantity + (parseInt(item.quantity) || 0),
        billValue: acc.billValue + (parseInt(item.billValue) || 0)
    }), { bills: 0, quantity: 0, billValue: 0 }) || { bills: 0, quantity: 0, billValue: 0 };

    return (
        <>
            <Helmet>
                <title>Day Book Report | RootFin</title>
            </Helmet>
            
            <div>
                <Headers title={'Day Book Report'} />
                <div className='ml-[240px] min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
                    <div className="p-8">
                        {/* Filters Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">Report Filters</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">From Date *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiCalendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">To Date *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiCalendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-end">
                                    <button
                                        onClick={handleFetch}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <FiTrendingUp className="w-5 h-5" />
                                            Generate Report
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        {data?.dataSet?.data && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Bills</p>
                                            <p className="text-2xl font-bold text-gray-900">{totals.bills}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FiTrendingUp className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                                            <p className="text-2xl font-bold text-gray-900">{totals.quantity}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <FiTrendingUp className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Bill Value</p>
                                            <p className="text-2xl font-bold text-gray-900">₹{totals.billValue.toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <FiTrendingUp className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Report Table */}
                        <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-800">Day Book Report</h3>
                                <p className="text-sm text-gray-600">
                                    {fromDate && toDate ? `From ${fromDate} to ${toDate}` : 'Select date range to view data'}
                                </p>
                            </div>
                            
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-600 text-white z-20 shadow-md">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold">Date</th>
                                            <th className="px-6 py-4 text-center font-semibold">Bills</th>
                                            <th className="px-6 py-4 text-center font-semibold">Quantity</th>
                                            <th className="px-6 py-4 text-right font-semibold">Bill Value</th>
                                        </tr>
                                    </thead>
                                    
                                    <tbody className="divide-y divide-gray-200">
                                        {data?.dataSet?.data?.length > 0 ? (
                                            data.dataSet.data.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-blue-600">
                                                        {item.bills}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-green-600">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                        ₹{parseInt(item.billValue || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <FiTrendingUp className="w-12 h-12 text-gray-300" />
                                                        <p className="text-lg font-medium">No data found</p>
                                                        <p className="text-sm">Select a date range and generate the report</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    
                                    {data?.dataSet?.data?.length > 0 && (
                                        <tfoot className="sticky bottom-0 bg-gray-50 border-t border-gray-200 z-20 shadow-md">
                                            <tr className="font-bold text-gray-800">
                                                <td className="px-6 py-4 text-left">Total</td>
                                                <td className="px-6 py-4 text-center text-blue-600">{totals.bills}</td>
                                                <td className="px-6 py-4 text-center text-green-600">{totals.quantity}</td>
                                                <td className="px-6 py-4 text-right text-gray-900">₹{totals.billValue.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {data?.dataSet?.data?.length > 0 && (
                            <div className="mt-8 flex justify-end space-x-4">
                                <button
                                    onClick={handlePrint}
                                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                    <span className="flex items-center gap-2">
                                        <FiPrinter className="w-5 h-5" />
                                        Print / PDF
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DayBook;