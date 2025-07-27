/*  ────────────────────────────────────────────────
 *  Security.jsx   – fixed “previous-month” range
 *  ────────────────────────────────────────────────*/
import { useEffect, useMemo, useRef, useState } from "react";
import useFetch            from "../hooks/useFetch.jsx";
import { Helmet }          from "react-helmet";
import Headers             from "../components/Header.jsx";
import { CSVLink }         from "react-csv";

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

  /* ────────── URLs for “current-store” mode ────────── */
  const base   = "https://rentalapi.rootments.live/api/GetBooking";
  const rentU  = `${base}/GetRentoutList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
  const retU   = `${base}/GetReturnList?LocCode=${currentusers.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;

  /* ────────── Fetch button handler ────────── */
  const handleFetch = async () => {
    await fetchOpeningCash();
    if (selectedStore !== "all") return;           // current-store handled by hooks

    const tmpRent = [];
    const tmpRet  = [];

    for (const st of AllLoation) {
      const rU = `${base}/GetRentoutList?LocCode=${st.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
      const uU = `${base}/GetReturnList?LocCode=${st.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
      try {
        const [r1, r2] = await Promise.all([fetch(rU), fetch(uU)]);
        const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
        if (j1?.dataSet?.data)
          tmpRent.push(
            ...j1.dataSet.data.map((d) => ({ ...d, locCode: st.locCode, Category: "RentOut" }))
          );
        if (j2?.dataSet?.data)
          tmpRet.push(
            ...j2.dataSet.data.map((d) => ({ ...d, locCode: st.locCode, Category: "Return" }))
          );
      } catch (err) {
        console.error("Fetch error", err);
      }
    }
    setRentAll(tmpRent);
    setReturnAll(tmpRet);
  };

  /* ────────── React-query hooks ────────── */
  const fetchOpts = useMemo(() => ({}), []);
  const { data: dataRent } = useFetch(
    selectedStore === "current" ? rentU : null, fetchOpts);
  const { data: dataRet  } = useFetch(
    selectedStore === "current" ? retU  : null, fetchOpts);

  /* Re-compute opening whenever range or data changes */
  useEffect(() => { fetchOpeningCash(); }, [fromDate]);
  useEffect(() => {
    if (selectedStore === "current" && (dataRent || dataRet))
      fetchOpeningCash();
  }, [selectedStore, dataRent, dataRet]);

  /* ────────── Build table rows ────────── */
  let rows = [];
  if (selectedStore === "current") {
    const rentRows = (dataRent?.dataSet?.data || []).map((t) => ({
      date:     t.rentOutDate,
      invoice:  t.invoiceNo,
      customer: t.customerName,
      category: "RentOut",
      sub:      "Security",
      secIn:    +t.securityAmount || 0,
      secOut:   0,
    }));
    const retRows = (dataRet?.dataSet?.data || []).map((t) => ({
      date:     t.returnedDate,
      invoice:  t.invoiceNo,
      customer: t.customerName,
      category: "Return",
      sub:      "Security Refund",
      secIn:    0,
      secOut:   +t.securityAmount || 0,
    }));
    rows = [...rentRows, ...retRows];
  } else {
    const combined = [...rentAll, ...returnAll];
    rows = Object.values(
      combined.reduce((acc, t) => {
        const n = getStoreName(t.locCode);
        if (!acc[n]) acc[n] = { store: n, locCode: t.locCode, secIn: 0, secOut: 0 };
        if (t.Category === "Return") acc[n].secOut += +t.securityAmount || 0;
        else                          acc[n].secIn  += +t.securityAmount || 0;
        return acc;
      }, {})
    ).map((r) => ({ ...r, diff: r.secIn - r.secOut }));
  }

  const totIn  = rows.reduce((s, r) => s + (r.secIn  || 0), 0);
  const totOut = rows.reduce((s, r) => s + (r.secOut || 0), 0);

  /* ────────── CSV payload ────────── */
  const csvData =
    selectedStore === "all"
      ? rows.map((r) => ({
          store: r.store, locCode: r.locCode,
          secIn: r.secIn, secOut: r.secOut, difference: r.diff,
        }))
      : rows.map((r) => ({
          date: r.date, invoice: r.invoice, customer: r.customer,
          category: r.category, sub: r.sub,
          secIn: r.secIn, secOut: r.secOut, difference: r.secIn - r.secOut,
        }));

  /* ────────── Print helper ────────── */
  const printRef = useRef(null);
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=600");
    w.document.write(`<html><head><title>Security Report</title><style>
      @page{size:tabloid;margin:10mm}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #000;padding:6px}
    </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  /* ────────── UI ────────── */
  const { prevMonthStart, prevMonthEnd } = getPreviousMonthDates(fromDate);

  return (
    <>
      <Helmet><title>Security Report | RootFin</title></Helmet>
      <Headers title="Security Report" />

      <div className="ml-[240px] p-6 bg-gray-100 min-h-screen">

        {/* Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Opening Cash</h3>
              <p className="text-sm text-blue-600">
                Security difference from previous month ({prevMonthStart} to {prevMonthEnd})
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-800">
                ₹{openingCash.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">
                {openingCash >= 0 ? "Positive Balance" : "Negative Balance"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 w-[1000px]">
          <div className="w-full flex flex-col">
            <label>From *</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border p-2"
            />
          </div>
          <div className="w-full flex flex-col">
            <label>To *</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border p-2"
            />
          </div>
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
          <button
            onClick={handleFetch}
            className="bg-blue-600 text-white px-10 h-[40px] mt-6 rounded-md"
          >
            Fetch
          </button>
        </div>

        {/* Table */}
        <div ref={printRef} className="bg-white p-4 shadow rounded-lg">
          <div className="max-h-[420px] overflow-y-auto relative">
            <table className="w-full border-collapse">
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

              <tbody>
                {rows.length ? (
                  rows.map((r, i) =>
                    selectedStore === "all" ? (
                      <tr key={i}>
                        <td className="border p-2">{r.store}</td>
                        <td className="border p-2">{r.locCode}</td>
                        <td className="border p-2">{r.secIn}</td>
                        <td className="border p-2">{r.secOut}</td>
                        <td className="border p-2">{r.diff}</td>
                      </tr>
                    ) : (
                      <tr key={i}>
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

              <tfoot className="sticky bottom-0 bg-white z-20">
                <tr className="font-semibold">
                  <td
                    className="border p-2 text-left"
                    colSpan={selectedStore === "all" ? 2 : 5}
                  >
                    Totals
                  </td>
                  <td className="border p-2">{totIn}</td>
                  <td className="border p-2">{totOut}</td>
                  <td className="border p-2">{totIn - totOut}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handlePrint}
          className="mt-6 w-[200px] float-right bg-blue-600 text-white py-2 rounded-lg"
        >
          📄 Print / PDF
        </button>

        <CSVLink
          headers={selectedStore === "all" ? csvHeadersAllStores : csvHeaders}
          data={csvData}
          filename={`${fromDate}_to_${toDate}_security_report.csv`}
        >
          <button className="mt-6 mr-4 w-[200px] float-right bg-green-600 text-white py-2 rounded-lg">
            ⬇️ Download CSV
          </button>
        </CSVLink>
      </div>
    </>
  );
};

export default Security;
