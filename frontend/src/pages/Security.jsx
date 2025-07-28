/*  ────────────────────────────────────────────────
 *  Security.jsx   (paste the whole file as-is)
 *  ────────────────────────────────────────────────*/
import { useEffect, useMemo, useRef, useState } from "react";
import useFetch from "../hooks/useFetch.jsx";
import { Helmet } from "react-helmet";
import Headers from "../components/Header.jsx";
import { CSVLink } from "react-csv";



/* ---------- CSV helpers ---------- */
const csvHeaders = [
  { label: "Date",          key: "date" },
  { label: "Invoice",       key: "invoice" },
  { label: "Customer",      key: "customer" },
  { label: "Category",      key: "category" },
  { label: "Sub",           key: "sub" },
  { label: "Security In",   key: "secIn" },
  { label: "Security Out",  key: "secOut" },
  { label: "Difference",    key: "difference" },
];

const csvHeadersAllStores = [
  { label: "Store",         key: "store" },
  { label: "LocCode",       key: "locCode" },
  { label: "Security In",   key: "secIn" },
  { label: "Security Out",  key: "secOut" },
  { label: "Difference",    key: "difference" },
];

/* ────────── Store master list ────────── */
const AllLoation = [
  { locName: "Z-Edapally1",   locCode: "144" },
  { locName: "G-Edappally",   locCode: "702" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Z- Edappal",    locCode: "100" },
  { locName: "Z.Perinthalmanna", locCode: "133" },
  { locName: "Z.Kottakkal",   locCode: "122" },
  { locName: "G.Kottayam",    locCode: "701" },
  { locName: "G.Perumbavoor", locCode: "703" },
  { locName: "G.Thrissur",    locCode: "704" },
  { locName: "G.Chavakkad",   locCode: "706" },
  { locName: "G.Calicut",     locCode: "712" },
  { locName: "G.Vadakara",    locCode: "708" },
  { locName: "G.Edappal",     locCode: "707" },
  { locName: "G.Perinthalmanna", locCode: "709" },
  { locName: "G.Kottakkal",   locCode: "711" },
  { locName: "G.Manjeri",     locCode: "710" },
  { locName: "G.Palakkad",    locCode: "705" },
  { locName: "G.Kalpetta",    locCode: "717" },
  { locName: "G.Kannur",      locCode: "716" }
];

const getStoreName = (code) =>
  AllLoation.find((l) => l.locCode === code)?.locName || "Unknown";

const Security = () => {
  /* ────────── State ────────── */
  const today       = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate]       = useState("2025-01-01");
  const [toDate,   setToDate]         = useState(today);
  const [selectedStore, setSelectedStore] = useState("current"); // "current" | "all"
  const [rentAll,   setRentAll]   = useState([]); // only for All-store mode
  const [returnAll, setReturnAll] = useState([]);
  const [yesterdayBalance, setYesterdayBalance] = useState(0); // Yesterday's closing balance

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser"));

  /* ────────── Calculate the day before fromDate ────────── */
  const getDayBeforeFromDate = () => {
    const dayBefore = new Date(fromDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    return dayBefore.toISOString().split("T")[0];
  };

  /* ────────── Fetch cumulative security difference up to day before fromDate ────────── */
  const fetchYesterdayBalance = async () => {
    if (selectedStore !== "current") return; // Only for current store
    
    const dayBeforeFromDate = getDayBeforeFromDate();
    const base = "https://rentalapi.rootments.live/api/GetBooking";
    // Fetch all security transactions from the beginning up to the day before fromDate
    const urlRent = `${base}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=2025-01-01&DateTo=${dayBeforeFromDate}`;
    const urlRet = `${base}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=2025-01-01&DateTo=${dayBeforeFromDate}`;
    
    try {
      const [responseRent, responseRet] = await Promise.all([fetch(urlRent), fetch(urlRet)]);
      const [dataRent, dataRet] = await Promise.all([responseRent.json(), responseRet.json()]);
      
      // Calculate cumulative security in and out up to the day before fromDate
      const cumulativeSecIn = (dataRent?.dataSet?.data || []).reduce((sum, t) => 
        sum + parseInt(t.securityAmount || 0, 10), 0
      );
      const cumulativeSecOut = (dataRet?.dataSet?.data || []).reduce((sum, t) => 
        sum + parseInt(t.securityAmount || 0, 10), 0
      );
      
      // Cumulative difference = Total Security In - Total Security Out
      const cumulativeDifference = cumulativeSecIn - cumulativeSecOut;
      setYesterdayBalance(cumulativeDifference);
    } catch (error) {
      console.error("Error fetching cumulative security data:", error);
      setYesterdayBalance(0);
    }
  };

  /* ────────── Build URLs for current-store fetch ────────── */
  const base = "https://rentalapi.rootments.live/api/GetBooking";
  const apiUrl1Current = `${base}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const apiUrl2Current = `${base}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;

  /* ────────── doFetch handler (handles both modes) ────────── */
   const handleFetch = async () => {
    if (selectedStore !== "all") {
      await fetchYesterdayBalance(); // Fetch yesterday's balance for current store
      return; // current‑store uses useFetch
    }

    const tempRent = [];
    const tempRet  = [];

    for (const store of AllLoation) {
      const urlRent = `${base}/GetRentoutList?LocCode=${store.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
      const urlRet  = `${base}/GetReturnList?LocCode=${store.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
      try {
        const [r1, r2] = await Promise.all([fetch(urlRent), fetch(urlRet)]);
        const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
        if (j1?.dataSet?.data)
          tempRent.push(
            ...j1.dataSet.data.map((d) => ({ ...d, locCode: store.locCode, Category: "RentOut" }))
          );
        if (j2?.dataSet?.data)
          tempRet.push(
            ...j2.dataSet.data.map((d) => ({ ...d, locCode: store.locCode, Category: "Return" }))
          );
      } catch (err) {
        console.error("Fetch error", err);
      }
    }
    setRentAll(tempRent);
    setReturnAll(tempRet);
  };

  useEffect(() => {
    if (selectedStore === "all") handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  /* ────────── useFetch (only for current store) ────────── */
  const fetchOptions = useMemo(() => ({}), []);
  const { data: data1 } = useFetch(
    selectedStore === "current" ? apiUrl1Current : null,
    fetchOptions
  );
  const { data: data2 } = useFetch(
    selectedStore === "current" ? apiUrl2Current : null,
    fetchOptions
  );

  /* ────────── Fetch yesterday's balance when data changes ────────── */
  useEffect(() => {
    if (selectedStore === "current" && (data1 || data2)) {
      fetchYesterdayBalance();
    }
  }, [selectedStore, data1, data2]);

  /* ────────── Build rows based on mode ────────── */
  let tableRows = [];
  if (selectedStore === "current") {
    const rentRows = (data1?.dataSet?.data || []).map((t) => ({
      date:       t.rentOutDate,
      invoice:    t.invoiceNo,
      customer:   t.customerName,
      category:   "RentOut",
      sub:        "Security",
      secIn:      parseInt(t.securityAmount || 0, 10),
      secOut:     0
    }));
    const retRows = (data2?.dataSet?.data || []).map((t) => ({
      date:       t.returnedDate,
      invoice:    t.invoiceNo,
      customer:   t.customerName,
      category:   "Return",
      sub:        "Security Refund",
      secIn:      0,
      secOut:     parseInt(t.securityAmount || 0, 10)
    }));
    tableRows = [...rentRows, ...retRows];
  } else {
    /* aggregate totals per store */
    const combined = [...rentAll, ...returnAll];
    const byStore = Object.values(
      combined.reduce((acc, t) => {
        const name = getStoreName(t.locCode);
        if (!acc[name])
          acc[name] = { store: name, locCode: t.locCode, secIn: 0, secOut: 0 };
        if (t.Category === "Return")
          acc[name].secOut += parseInt(t.securityAmount || 0, 10);
        else
          acc[name].secIn += parseInt(t.securityAmount || 0, 10);
        return acc;
      }, {})
    ).map((r) => ({ ...r, diff: r.secIn - r.secOut }));
    tableRows = byStore;
  }

  const totalIn  = tableRows.reduce((s, r) => s + (r.secIn  || 0), 0);
  const totalOut = tableRows.reduce((s, r) => s + (r.secOut || 0), 0);
  
  // Add yesterday's balance to total security in for current store
  const adjustedTotalIn = selectedStore === "current" ? totalIn + yesterdayBalance : totalIn;

  /* ────────── CSV data generation ────────── */
  const csvData = selectedStore === "all" 
    ? tableRows.map((r) => ({
        store: r.store,
        locCode: r.locCode,
        secIn: r.secIn,
        secOut: r.secOut,
        difference: r.diff
      }))
    : [
        // Add opening cash row for current store
        ...(selectedStore === "current" ? [{
          date: "OPENING CASH",
          invoice: "",
          customer: "",
          category: "",
          sub: "",
          secIn: yesterdayBalance,
          secOut: 0,
          difference: 0
        }] : []),
        // Add regular transaction rows
        ...tableRows.map((r) => ({
          date: r.date,
          invoice: r.invoice,
          customer: r.customer || "",
          category: r.category || "",
          sub: r.sub || "",
          secIn: r.secIn,
          secOut: r.secOut,
          difference: r.secIn - r.secOut
        }))
      ];

  /* ────────── Print helper ────────── */
  const printRef = useRef(null);
  const handlePrint = () => {
    const html = `<html><head><title>Security Report</title><style>
      @page{size:tabloid;margin:10mm}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #000;padding:8px}
    </style></head><body>${printRef.current.innerHTML}</body></html>`;
    const w = window.open("", "print");
    w.document.write(html);
    w.document.close();
    w.print();
  };

  /* ────────── UI ────────── */
  return (
    <>
      <Helmet>
        <title>Security Report | RootFin</title>
      </Helmet>

      <Headers title="Security Report" />

      <div className="ml-[240px] p-6 bg-gray-100 min-h-screen">

  {/* ────────── Filters ────────── */}
  <div className="flex gap-4 mb-6 w-[1000px]">
    {/* From date */}
    <div className="w-full flex flex-col">
      <label>From *</label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="border p-2"
      />
    </div>

    {/* To date */}
    <div className="w-full flex flex-col">
      <label>To *</label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="border p-2"
      />
    </div>

    {/* Store selector */}
    <div className="w-full flex flex-col">
      <label>Store</label>
      <select
        value={selectedStore}
        onChange={(e) => setSelectedStore(e.target.value)}
        className="border p-2"
      >
        <option value="current">
          Current Store ({getStoreName(currentusers.locCode)})
        </option>
        <option value="all">All Stores (Totals)</option>
      </select>
    </div>

    {/* Fetch button */}
    <button
      onClick={handleFetch}
      className="bg-blue-600 text-white px-10 h-[40px] mt-6 rounded-md"
    >
      Fetch
    </button>
  </div>

  {/* ────────── Report table ────────── */}
  <div ref={printRef} className="bg-white p-4 shadow rounded-lg">
    {/* Scrollable wrapper */}
    <div className="max-h-[420px] overflow-y-auto relative">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead className="sticky top-0 bg-gray-500 text-white z-20">
          {selectedStore === "all" ? (
            <tr>
              <th className="border p-2">Store</th>
              <th className="border p-2">LocCode</th>
              <th className="border p-2">Security In</th>
              <th className="border p-2">Security Out</th>
              <th className="border p-2">Difference</th>
            </tr>
          ) : (
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Invoice</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Sub</th>
              <th className="border p-2">Security In</th>
              <th className="border p-2">Security Out</th>
              <th className="border p-2">Difference</th>
            </tr>
          )}
        </thead>

        {/* Body */}
        <tbody>
          {/* Opening Cash Row (only for current store) */}
          {selectedStore === "current" && yesterdayBalance !== 0 && (
            <tr className="font-bold bg-gray-100">
              <td className="border p-2">OPENING CASH</td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
                          <td className="border p-2">{yesterdayBalance}</td>
            <td className="border p-2">0</td>
            <td className="border p-2">0</td>
            </tr>
          )}
          
          {tableRows.length ? (
            tableRows.map((r, idx) =>
              selectedStore === "all" ? (
                <tr key={idx}>
                  <td className="border p-2">{r.store}</td>
                  <td className="border p-2">{r.locCode}</td>
                  <td className="border p-2">{r.secIn}</td>
                  <td className="border p-2">{r.secOut}</td>
                  <td className="border p-2">{r.diff}</td>
                </tr>
              ) : (
                <tr key={idx}>
                  <td className="border p-2">{r.date}</td>
                  <td className="border p-2">{r.invoice}</td>
                  <td className="border p-2">{r.customer}</td>
                  <td className="border p-2">{r.category}</td>
                  <td className="border p-2">{r.sub}</td>
                  <td className="border p-2">{r.secIn}</td>
                  <td className="border p-2">{r.secOut}</td>
                  <td className="border p-2">{r.secIn - r.secOut}</td>
                </tr>
              )
            )
          ) : (
            <tr>
              <td
                colSpan={selectedStore === "all" ? 5 : 8}
                className="text-center p-4"
              >
                No data found
              </td>
            </tr>
          )}
        </tbody>

        {/* Footer (sticky) */}
        <tfoot className="sticky bottom-0 bg-white z-20">
          <tr className="font-semibold">
            <td
              className="border p-2 text-left"
              colSpan={selectedStore === "all" ? 2 : 5}
            >
              Totals
            </td>
            <td className="border p-2">{adjustedTotalIn}</td>
            <td className="border p-2">{totalOut}</td>
            <td className="border p-2">{adjustedTotalIn - totalOut}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  {/* Print */}
  <button
    onClick={handlePrint}
    className="mt-6 w-[200px] float-right bg-blue-600 text-white py-2 rounded-lg"
  >
    📄 Print / PDF
  </button>

  {/* CSV Download */}
<CSVLink
  headers={selectedStore === "all" ? csvHeadersAllStores : csvHeaders}
  data={csvData}
  filename={`${fromDate}_to_${toDate}_security_report.csv`}
>
  <button className="mt-6 me-4 w-[200px] float-right bg-green-600 text-white py-2 rounded-lg">
    ⬇️ Download CSV
  </button>
</CSVLink>

</div>

    </>
  );
};

export default Security;