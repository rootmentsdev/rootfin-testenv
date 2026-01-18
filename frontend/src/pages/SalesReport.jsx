import Headers from '../components/Header.jsx';
import { useEffect, useState } from "react";
import Select from "react-select";
import baseUrl from '../api/api.js';
import { CSVLink } from 'react-csv';
import { Helmet } from "react-helmet";
import { FiDownload } from "react-icons/fi";

const SalesReport = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedStore, setSelectedStore] = useState("Warehouse");
  const [reportType, setReportType] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [csvData, setCsvData] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("rootfinuser"));
  const isAdmin = (currentUser?.power || "").toLowerCase() === "admin";
  
  // For store users, set their store as default and disable selection
  useEffect(() => {
    if (!isAdmin && currentUser?.locCode) {
      // Find the store name from locCode
      const store = storeOptions.find(s => s.value === currentUser.locCode);
      if (store) {
        setSelectedStore(store.label); // Use the label (store name) not the locCode
      } else {
        setSelectedStore(currentUser.locCode);
      }
    }
  }, [isAdmin, currentUser]);

  const storeOptions = [
    { value: "Warehouse", label: "All Stores" },
    { value: "144", label: "Z-Edapally1" },
    { value: "858", label: "Warehouse" },
    { value: "702", label: "G-Edappally" },
    { value: "759", label: "HEAD OFFICE01" },
    { value: "700", label: "SG-Trivandrum" },
    { value: "100", label: "Z- Edappal" },
    { value: "133", label: "Z.Perinthalmanna" },
    { value: "122", label: "Z.Kottakkal" },
    { value: "701", label: "G.Kottayam" },
    { value: "703", label: "G.Perumbavoor" },
    { value: "704", label: "G.Thrissur" },
    { value: "706", label: "G.Chavakkad" },
    { value: "712", label: "G.Calicut" },
    { value: "708", label: "G.Vadakara" },
    { value: "707", label: "G.Edappal" },
    { value: "709", label: "G.Perinthalmanna" },
    { value: "711", label: "G.Kottakkal" },
    { value: "710", label: "G.Manjeri" },
    { value: "705", label: "G.Palakkad" },
    { value: "717", label: "G.Kalpetta" },
    { value: "716", label: "G.Kannur" },
    { value: "729", label: "G.Mg Road" },
    { value: "101", label: "Production" },
    { value: "102", label: "Office" },
    { value: "103", label: "WAREHOUSE" }
  ];

  const reportTypeOptions = [
    { value: "summary", label: "Sales Summary" },
    { value: "by-item", label: "Sales by Item" },
    { value: "returns", label: "Return Summary" }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = `api/reports/sales/${reportType}`;
      // For store users, pass their warehouse name; for admin, pass selected store name
      const warehouseParam = isAdmin ? selectedStore : (storeOptions.find(s => s.value === currentUser?.locCode)?.label || selectedStore);
      
      const params = new URLSearchParams({
        dateFrom: fromDate,
        dateTo: toDate,
        warehouse: warehouseParam,
        userId: currentUser?.email || currentUser?.userId,
        locCode: currentUser?.locCode
      });

      const response = await fetch(`${baseUrl.baseUrl}${endpoint}?${params}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error("API Error:", response.status, text);
        alert(`API Error: ${response.status} - ${text.substring(0, 100)}`);
        return;
      }
      
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
        prepareCsvData(result.data, reportType);
      } else {
        alert("Failed to fetch report: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      alert("Error fetching report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const prepareCsvData = (data, type) => {
    let csv = [];
    if (type === "summary") {
      csv = data.invoices?.map(inv => ({
        Date: inv.date,
        "Invoice No": inv.invoiceNumber,
        Customer: inv.customer,
        Category: inv.category,
        Amount: inv.amount,
        Discount: inv.discount,
        "Payment Method": inv.paymentMethod,
        Branch: inv.branch
      })) || [];
    } else if (type === "by-item") {
      csv = data.items?.map(item => ({
        "Item Name": item.name,
        SKU: item.sku,
        Quantity: item.quantity,
        "Total Amount": item.totalAmount,
        "Invoice Count": item.invoiceCount
      })) || [];
    } else if (type === "returns") {
      csv = data.returns?.map(ret => ({
        Date: ret.date,
        "Invoice No": ret.invoiceNumber,
        Customer: ret.customer,
        Amount: ret.amount,
        Reason: ret.reason,
        Branch: ret.branch
      })) || [];
    }
    setCsvData(csv);
  };

  return (
    <>
      <Helmet>
        <title>Sales Report</title>
      </Helmet>
      <Headers />
      <div style={{ marginLeft: "256px", padding: "20px", maxWidth: "calc(100% - 256px)" }}>
        <h1>Sales Report</h1>

        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <div>
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          <div>
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          {isAdmin ? (
            <div>
              <label>Store</label>
              <Select
                options={storeOptions}
                value={storeOptions.find(s => s.value === selectedStore)}
                onChange={(opt) => setSelectedStore(opt.value)}
                isSearchable
              />
            </div>
          ) : (
            <div>
              <label>Store</label>
              <div style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", backgroundColor: "#f5f5f5" }}>
                {storeOptions.find(s => s.value === selectedStore)?.label || selectedStore}
              </div>
            </div>
          )}
          <div>
            <label>Report Type</label>
            <Select
              options={reportTypeOptions}
              value={reportTypeOptions.find(r => r.value === reportType)}
              onChange={(opt) => setReportType(opt.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
          {csvData.length > 0 && (
            <CSVLink
              data={csvData}
              filename={`sales-report-${fromDate}-to-${toDate}.csv`}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FiDownload /> Export CSV
            </CSVLink>
          )}
        </div>

        {/* Report Display */}
        {reportData && (
          <div style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
            {reportType === "summary" && (
              <>
                <h2>Sales Summary</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Invoices</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalInvoices || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Sales</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.totalSales || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Discount</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.totalDiscount || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Net Sales</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.netSales || 0).toFixed(2)}</div>
                  </div>
                </div>

                <h3>Payment Breakdown</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "11px", color: "#666" }}>Cash</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>₹{(reportData.summary?.paymentBreakdown?.cash || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "11px", color: "#666" }}>Bank</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>₹{(reportData.summary?.paymentBreakdown?.bank || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "11px", color: "#666" }}>UPI</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>₹{(reportData.summary?.paymentBreakdown?.upi || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "11px", color: "#666" }}>RBL</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>₹{(reportData.summary?.paymentBreakdown?.rbl || 0).toFixed(2)}</div>
                  </div>
                </div>

                <h3>Sales by Category</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Category</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Count</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByCategory?.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{cat.category}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{cat.count}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{cat.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>Top Customers</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Customer</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Count</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topCustomers?.map((cust, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{cust.customer}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{cust.count}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{cust.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {reportType === "by-item" && (
              <>
                <h2>Sales by Item</h2>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Items Sold</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.totalQuantity || 0}</div>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Item Name</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>SKU</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Quantity</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{item.name}</td>
                        <td style={{ padding: "10px" }}>{item.sku}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{item.quantity}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {reportType === "returns" && (
              <>
                <h2>Return Summary</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Returns</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalReturns || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Return Amount</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.totalReturnAmount || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Average Return</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.averageReturnAmount || 0).toFixed(2)}</div>
                  </div>
                </div>

                <h3>Returns by Reason</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Reason</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Count</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.returnsByReason?.map((reason, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{reason.reason}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{reason.count}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{reason.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>Return Details</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Date</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Invoice No</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Customer</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Amount</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.returns?.map((ret, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{ret.date}</td>
                        <td style={{ padding: "10px" }}>{ret.invoiceNumber}</td>
                        <td style={{ padding: "10px" }}>{ret.customer}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{ret.amount.toFixed(2)}</td>
                        <td style={{ padding: "10px" }}>{ret.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SalesReport;
