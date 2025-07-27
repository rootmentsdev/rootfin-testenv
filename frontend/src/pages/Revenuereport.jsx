




import Headers from '../components/Header.jsx';
import { useEffect, useMemo, useRef, useState } from "react";
import useFetch from '../hooks/useFetch.jsx';
import { Helmet } from "react-helmet";
import { FiCalendar, FiDownload, FiPrinter, FiTrendingUp, FiDollarSign, FiBarChart3 } from "react-icons/fi";

const Revenuereport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [apiUrl, setApiUrl] = useState("");
    const [apiUrl1, setApiUrl1] = useState("");

    const currentusers = JSON.parse(localStorage.getItem("rootfinuser"));

    const handleFetch = () => {
        const baseUrl1 = "https://rentalapi.rootments.live/api/GetBooking";
        const updatedApiUrl = `${baseUrl1}/GetBookingList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
        const updatedApiUrl1 = `${baseUrl1}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;

        setApiUrl(updatedApiUrl);
        setApiUrl1(updatedApiUrl1);
    };

    const fetchOptions = useMemo(() => ({}), []);
    const { data: bookingData } = useFetch(apiUrl, fetchOptions);
    const { data: rentoutData } = useFetch(apiUrl1, fetchOptions);

    const printRef = useRef(null);

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        document.body.innerHTML = `<html><head><title>Revenue Report</title>
            <style>
                @page { size: tabloid; margin: 10mm; }
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                tr { break-inside: avoid; }
            </style>
        </head><body>${printContent}</body></html>`;
        window.print();
        window.location.reload();
    };

    // Calculate totals
    const bookingTotals = bookingData?.dataSet?.data?.reduce((acc, item) => ({
        bills: acc.bills + (parseInt(item.bills) || 0),
        quantity: acc.quantity + (parseInt(item.quantity) || 0),
        billValue: acc.billValue + (parseInt(item.billValue) || 0)
    }), { bills: 0, quantity: 0, billValue: 0 }) || { bills: 0, quantity: 0, billValue: 0 };

    const rentoutTotals = rentoutData?.dataSet?.data?.reduce((acc, item) => ({
        bills: acc.bills + (parseInt(item.bills) || 0),
        quantity: acc.quantity + (parseInt(item.quantity) || 0),
        billValue: acc.billValue + (parseInt(item.billValue) || 0)
    }), { bills: 0, quantity: 0, billValue: 0 }) || { bills: 0, quantity: 0, billValue: 0 };

    const grandTotal = {
        bills: bookingTotals.bills + rentoutTotals.bills,
        quantity: bookingTotals.quantity + rentoutTotals.quantity,
        billValue: bookingTotals.billValue + rentoutTotals.billValue
    };

    return (
        <>
            <Helmet>
                <title>Revenue Report | RootFin</title>
            </Helmet>
            
            <div>
                <Headers title={'Revenue Report'} />
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
                        {(bookingData?.dataSet?.data || rentoutData?.dataSet?.data) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Bills</p>
                                            <p className="text-2xl font-bold text-gray-900">{grandTotal.bills}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FiBarChart3 className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                                            <p className="text-2xl font-bold text-gray-900">{grandTotal.quantity}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <FiTrendingUp className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                            <p className="text-2xl font-bold text-gray-900">₹{grandTotal.billValue.toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <FiDollarSign className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Report Tables */}
                        <div ref={printRef} className="space-y-8">
                            {/* Booking Report */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-800">Booking Report</h3>
                                    <p className="text-sm text-gray-600">
                                        {fromDate && toDate ? `From ${fromDate} to ${toDate}` : 'Select date range to view data'}
                                    </p>
                                </div>
                                
                                <div className="max-h-[400px] overflow-y-auto">
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
                                            {bookingData?.dataSet?.data?.length > 0 ? (
                                                bookingData.dataSet.data.map((item, index) => (
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
                                                            <FiBarChart3 className="w-12 h-12 text-gray-300" />
                                                            <p className="text-lg font-medium">No booking data found</p>
                                                            <p className="text-sm">Select a date range and generate the report</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        
                                        {bookingData?.dataSet?.data?.length > 0 && (
                                            <tfoot className="sticky bottom-0 bg-gray-50 border-t border-gray-200 z-20 shadow-md">
                                                <tr className="font-bold text-gray-800">
                                                    <td className="px-6 py-4 text-left">Total</td>
                                                    <td className="px-6 py-4 text-center text-blue-600">{bookingTotals.bills}</td>
                                                    <td className="px-6 py-4 text-center text-green-600">{bookingTotals.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-gray-900">₹{bookingTotals.billValue.toLocaleString()}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            {/* Rent Out Report */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-800">Rent Out Report</h3>
                                    <p className="text-sm text-gray-600">
                                        {fromDate && toDate ? `From ${fromDate} to ${toDate}` : 'Select date range to view data'}
                                    </p>
                                </div>
                                
                                <div className="max-h-[400px] overflow-y-auto">
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
                                            {rentoutData?.dataSet?.data?.length > 0 ? (
                                                rentoutData.dataSet.data.map((item, index) => (
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
                                                            <p className="text-lg font-medium">No rent out data found</p>
                                                            <p className="text-sm">Select a date range and generate the report</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        
                                        {rentoutData?.dataSet?.data?.length > 0 && (
                                            <tfoot className="sticky bottom-0 bg-gray-50 border-t border-gray-200 z-20 shadow-md">
                                                <tr className="font-bold text-gray-800">
                                                    <td className="px-6 py-4 text-left">Total</td>
                                                    <td className="px-6 py-4 text-center text-blue-600">{rentoutTotals.bills}</td>
                                                    <td className="px-6 py-4 text-center text-green-600">{rentoutTotals.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-gray-900">₹{rentoutTotals.billValue.toLocaleString()}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {(bookingData?.dataSet?.data?.length > 0 || rentoutData?.dataSet?.data?.length > 0) && (
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

export default Revenuereport;