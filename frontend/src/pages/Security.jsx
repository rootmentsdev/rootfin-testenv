/*  ────────────────────────────────────────────────
 *  Security.jsx   – fixed "previous-month" range
 *  ────────────────────────────────────────────────*/
import { useEffect, useMemo, useRef, useState } from "react";
import useFetch            from "../hooks/useFetch.jsx";
import { Helmet }          from "react-helmet";
import Headers             from "../components/Header.jsx";
import { CSVLink }         from "react-csv";
import { FiCalendar, FiDownload, FiPrinter, FiShield, FiTrendingUp, FiHome } from "react-icons/fi";

/* ---------- CSV helpers ---------- */
const csvHeaders = [
  { label: "Date",         key: "date" },
  { label: "Invoice",      key: "invoice" },
  { label: "Customer",     key: "customer" },
  { label: "Category",     key: "category" },
  { label: "Sub",          key: "sub" },
  { label: "Security In",  key: "secIn" },
  { label: "Security Out", key: "secOut" },
  { label: "Difference",   key: "difference" },
];
const csvHeadersAllStores = [
  { label: "Store",        key: "store" },
  { label: "LocCode",      key: "locCode" },
  { label: "Security In",  key: "secIn" },
  { label: "Security Out", key: "secOut" },
  { label: "Difference",   key: "difference" },
];

/* ────────── Store master list ────────── */
const AllLoation = [
  { locName: "Z-Edapally1",      locCode: "144" },
  { locName: "G-Edappally",      locCode: "702" },
  { locName: "SG-Trivandrum",    locCode: "700" },
  { locName: "Z- Edappal",       locCode: "100" },
  { locName: "Z.Perinthalmanna", locCode: "133" },
  { locName: "Z.Kottakkal",      locCode: "122" },
  { locName: "G.Kottayam",       locCode: "701" },
  { locName: "G.Perumbavoor",    locCode: "703" },
  { locName: "G.Thrissur",       locCode: "704" },
  { locName: "G.Chavakkad",      locCode: "706" },
  { locName: "G.Calicut",        locCode: "712" },
  { locName: "G.Vadakara",       locCode: "708" },
  { locName: "G.Edappal",        locCode: "707" },
  { locName: "G.Perinthalmanna", locCode: "709" },
  { locName: "G.Kottakkal",      locCode: "711" },
  { locName: "G.Manjeri",        locCode: "710" },
  { locName: "G.Palakkad",       locCode: "705" },
  { locName: "G.Kalpetta",       locCode: "717" },
  { locName: "G.Kannur",         locCode: "716" },
];
const getStoreName = (code) =>
  AllLoation.find((l) => l.locCode === code)?.locName || "Unknown";

/* ────────── Local date formatter (no UTC shift) ────────── */
const toYYYYMMDD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const Security = () => {
  /* ────────── State ────────── */
  const todayIso = toYYYYMMDD(new Date());
  const [fromDate, setFromDate]       = useState(todayIso.replace(/-\d\d$/, "-01")); // 1st of this month
  const [toDate,   setToDate]         = useState(todayIso);                          // today
  const [selectedStore, setSelectedStore] = useState("current"); // "current" | "all"
  const [rentAll,   setRentAll]   = useState([]); // only for All-store mode
  const [returnAll, setReturnAll] = useState([]);
  const [openingCash, setOpeningCash] = useState(0);

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser"));

  /* ────────── Previous-month helper (TZ-safe) ────────── */
  const getPreviousMonthDates = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);          // y=2025 m=07 d=01
    const current   = new Date(y, m - 1, d);               // local time
    const prevFirst = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const prevLast  = new Date(current.getFullYear(), current.getMonth(),   0);
    return {
      prevMonthStart: toYYYYMMDD(prevFirst),               // 2025-06-01
      prevMonthEnd  : toYYYYMMDD(prevLast),                // 2025-06-30
    };
  };

  /* ────────── Fetch opening cash (prev-month diff) ────────── */
  const fetchOpeningCash = async () => {
    const { prevMonthStart, prevMonthEnd } =
      getPreviousMonthDates(fromDate);

    try {
      const base   = "https://rentalapi.rootments.live/api/GetBooking";
      const rentU  = `${base}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${prevMonthStart}&DateTo=${prevMonthEnd}`;
      const retU   = `${base}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${prevMonthStart}&DateTo=${prevMonthEnd}`;
      const [r1, r2]   = await Promise.all([fetch(rentU), fetch(retU)]);
      const [j1, j2]   = await Promise.all([r1.json(),   r2.json()]);

      const secIn  = (j1?.dataSet?.data || []).reduce(
        (s, t) => s + +t.securityAmount || 0, 0);
      const secOut = (j2?.dataSet?.data || []).reduce(
        (s, t) => s + +t.securityAmount || 0, 0);

      setOpeningCash(secIn - secOut);
    } catch (err) {
      console.error("Opening-cash fetch error:", err);
      setOpeningCash(0);
    }
  };

  /* ────────── API URLs ────────── */
  const apiUrls = useMemo(() => {
    if (selectedStore === "current") {
      const base = "https://rentalapi.rootments.live/api/GetBooking";
      return {
        rent: `${base}/GetRentoutList?LocCode=${currentusers?.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`,
        return: `${base}/GetReturnList?LocCode=${currentusers?.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`,
      };
    } else {
      return { rent: "", return: "" };
    }
  }, [selectedStore, fromDate, toDate, currentusers?.locCode]);

  /* ────────── Fetch data ────────── */
  const { data: rentData } = useFetch(apiUrls.rent, {});
  const { data: returnData } = useFetch(apiUrls.return, {});

  /* ────────── Handle fetch for all stores ────────── */
  const handleFetch = async () => {
    if (selectedStore === "all") {
      try {
        const base = "https://rentalapi.rootments.live/api/GetBooking";
        const promises = AllLoation.map(async (location) => {
          const [rentRes, returnRes] = await Promise.all([
            fetch(`${base}/GetRentoutList?LocCode=${location.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`),
            fetch(`${base}/GetReturnList?LocCode=${location.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`)
          ]);
          const [rentJson, returnJson] = await Promise.all([rentRes.json(), returnRes.json()]);
          
          const secIn = (rentJson?.dataSet?.data || []).reduce((sum, t) => sum + (+t.securityAmount || 0), 0);
          const secOut = (returnJson?.dataSet?.data || []).reduce((sum, t) => sum + (+t.securityAmount || 0), 0);
          
          return {
            store: location.locName,
            locCode: location.locCode,
            secIn,
            secOut,
            difference: secIn - secOut
          };
        });
        
        const results = await Promise.all(promises);
        setRentAll(results);
      } catch (error) {
        console.error("Error fetching all stores data:", error);
      }
    }
  };

  /* ────────── Effects ────────── */
  useEffect(() => {
    if (selectedStore === "current") {
      fetchOpeningCash();
    }
  }, [fromDate, selectedStore]);

  useEffect(() => {
    if (selectedStore === "all") {
      handleFetch();
    }
  }, [selectedStore, fromDate, toDate]);

  /* ────────── Process data ────────── */
  const processedData = useMemo(() => {
    if (selectedStore === "current") {
      const rent = rentData?.dataSet?.data || [];
      const returns = returnData?.dataSet?.data || [];
      
      const combined = [
        ...rent.map(r => ({
          date: r.rentoutDate?.split('T')[0] || r.date,
          invoice: r.invoiceNo || r.locCode,
          customer: r.customerName || r.customer || r.name || "-",
          category: "RentOut",
          sub: r.SubCategory || "-",
          secIn: +r.securityAmount || 0,
          secOut: 0,
          difference: +r.securityAmount || 0
        })),
        ...returns.map(r => ({
          date: r.returnDate?.split('T')[0] || r.date,
          invoice: r.invoiceNo || r.locCode,
          customer: r.customerName || r.customer || r.name || "-",
          category: "Return",
          sub: r.SubCategory || "-",
          secIn: 0,
          secOut: +r.securityAmount || 0,
          difference: -(+r.securityAmount || 0)
        }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return combined;
    } else {
      return rentAll;
    }
  }, [rentData, returnData, rentAll, selectedStore]);

  /* ────────── Calculate totals ────────── */
  const totals = useMemo(() => {
    if (selectedStore === "current") {
      return processedData.reduce((acc, item) => ({
        secIn: acc.secIn + item.secIn,
        secOut: acc.secOut + item.secOut,
        difference: acc.difference + item.difference
      }), { secIn: 0, secOut: 0, difference: 0 });
    } else {
      return rentAll.reduce((acc, item) => ({
        secIn: acc.secIn + item.secIn,
        secOut: acc.secOut + item.secOut,
        difference: acc.difference + item.difference
      }), { secIn: 0, secOut: 0, difference: 0 });
    }
  }, [processedData, rentAll, selectedStore]);

  /* ────────── Print functionality ────────── */
  const printRef = useRef(null);
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    document.body.innerHTML = `<html><head><title>Security Report</title>
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

  /* ────────── Get previous month dates for display ────────── */
  const { prevMonthStart, prevMonthEnd } = getPreviousMonthDates(fromDate);

  return (
    <>
      <Helmet>
        <title>Security Report | RootFin</title>
      </Helmet>
      
      <div>
        <Headers title={'Security Report'} />
        <div className='ml-[240px] min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
          <div className="p-8">
            {/* Opening Cash Banner */}
            {selectedStore === "current" && (
              <div className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Opening Cash</h2>
                    <p className="text-blue-100 text-sm">
                      Security difference from previous month ({prevMonthStart} to {prevMonthEnd})
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold mb-1">
                      ₹{openingCash.toLocaleString()}
                    </div>
                    <div className={`text-sm px-3 py-1 rounded-full ${
                      openingCash >= 0
                        ? 'bg-green-500/20 text-green-100'
                        : 'bg-red-500/20 text-red-100'
                    }`}>
                      {openingCash >= 0 ? "Positive Balance" : "Negative Balance"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Report Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Store Selection</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiHome className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="current">Current Store</option>
                      <option value="all">All Stores</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleFetch}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FiTrendingUp className="w-5 h-5" />
                      Fetch Data
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            {processedData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Security In</p>
                      <p className="text-2xl font-bold text-green-600">₹{totals.secIn.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiShield className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Security Out</p>
                      <p className="text-2xl font-bold text-red-600">₹{totals.secOut.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FiShield className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Difference</p>
                      <p className={`text-2xl font-bold ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{totals.difference.toLocaleString()}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      totals.difference >= 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <FiTrendingUp className={`w-6 h-6 ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Table */}
            <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Security Report</h3>
                <p className="text-sm text-gray-600">
                  {fromDate && toDate ? `From ${fromDate} to ${toDate}` : 'Select date range to view data'}
                </p>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-600 text-white z-20 shadow-md">
                    <tr>
                      {selectedStore === "all" ? (
                        <>
                          <th className="px-6 py-4 text-left font-semibold">Store</th>
                          <th className="px-6 py-4 text-left font-semibold">LocCode</th>
                          <th className="px-6 py-4 text-right font-semibold">Security In</th>
                          <th className="px-6 py-4 text-right font-semibold">Security Out</th>
                          <th className="px-6 py-4 text-right font-semibold">Difference</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left font-semibold">Date</th>
                          <th className="px-6 py-4 text-left font-semibold">Invoice</th>
                          <th className="px-6 py-4 text-left font-semibold">Customer</th>
                          <th className="px-6 py-4 text-left font-semibold">Category</th>
                          <th className="px-6 py-4 text-left font-semibold">Sub</th>
                          <th className="px-6 py-4 text-right font-semibold">Security In</th>
                          <th className="px-6 py-4 text-right font-semibold">Security Out</th>
                          <th className="px-6 py-4 text-right font-semibold">Difference</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-200">
                    {processedData.length > 0 ? (
                      processedData.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          {selectedStore === "all" ? (
                            <>
                              <td className="px-6 py-4 font-medium text-gray-900">{r.store}</td>
                              <td className="px-6 py-4 text-gray-600">{r.locCode}</td>
                              <td className="px-6 py-4 text-right font-medium text-green-600">
                                ₹{r.secIn.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-red-600">
                                ₹{r.secOut.toLocaleString()}
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${
                                (r.secIn - r.secOut) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ₹{(r.secIn - r.secOut).toLocaleString()}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-gray-600">
                                {new Date(r.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900">{r.invoice}</td>
                              <td className="px-6 py-4 text-gray-700">{r.customer}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  r.category === 'RentOut'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {r.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{r.sub}</td>
                              <td className="px-6 py-4 text-right font-medium text-green-600">
                                ₹{r.secIn.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-red-600">
                                ₹{r.secOut.toLocaleString()}
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${
                                (r.secIn - r.secOut) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ₹{(r.secIn - r.secOut).toLocaleString()}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={selectedStore === "all" ? 5 : 8} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <FiShield className="w-12 h-12 text-gray-300" />
                            <p className="text-lg font-medium">No data found</p>
                            <p className="text-sm">Select a date range and fetch data</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  
                  {processedData.length > 0 && (
                    <tfoot className="sticky bottom-0 bg-gray-50 border-t border-gray-200 z-20 shadow-md">
                      <tr className="font-bold text-gray-800">
                        {selectedStore === "all" ? (
                          <>
                            <td colSpan="2" className="px-6 py-4 text-left">Total</td>
                            <td className="px-6 py-4 text-right text-green-600">₹{totals.secIn.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-red-600">₹{totals.secOut.toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{totals.difference.toLocaleString()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan="5" className="px-6 py-4 text-left">Total</td>
                            <td className="px-6 py-4 text-right text-green-600">₹{totals.secIn.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-red-600">₹{totals.secOut.toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{totals.difference.toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            {processedData.length > 0 && (
              <div className="mt-8 flex justify-end space-x-4">
                <CSVLink 
                  data={processedData} 
                  headers={selectedStore === "all" ? csvHeadersAllStores : csvHeaders} 
                  filename={`security-report-${fromDate}-to-${toDate}.csv`}
                >
                  <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                    <span className="flex items-center gap-2">
                      <FiDownload className="w-5 h-5" />
                      Download CSV
                    </span>
                  </button>
                </CSVLink>
                
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

export default Security;
