import Headers from '../components/Header.jsx';
import { useEffect, useState } from "react";
import Select from "react-select";
import baseUrl from '../api/api.js';
import { CSVLink } from 'react-csv';
import { Helmet } from "react-helmet";
import { FiDownload, FiSearch } from "react-icons/fi";

const SalesByInvoiceReport = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedStore, setSelectedStore] = useState("all");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [csvData, setCsvData] = useState([]);
  
  // Advanced filtering states
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [skuSearch, setSkuSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("rootfinuser"));
  const isAdmin = (currentUser?.power || "").toLowerCase() === "admin";
  
  // For store users, set their store as default and disable selection
  useEffect(() => {
    if (!isAdmin && currentUser?.locCode) {
      setSelectedStore(currentUser.locCode);
    }
  }, [isAdmin, currentUser]);

  const storeOptions = [
    { value: "all", label: "All Stores" },
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
    { value: "718", label: "G.MG Road" },
    { value: "101", label: "Production" },
    { value: "102", label: "Office" },
    { value: "103", label: "WAREHOUSE" }
  ];

  const categoryOptions = [
    { value: null, label: "All Categories" },
    { value: "Shoes", label: "Shoes" },
    { value: "Shirts", label: "Shirts" },
    { value: "Accessories", label: "Accessories" },
    { value: "Others", label: "Others" }
  ];

  const sizeOptions = [
    { value: null, label: "All Sizes" },
    { value: "XS", label: "XS" },
    { value: "S", label: "S" },
    { value: "M", label: "M" },
    { value: "L", label: "L" },
    { value: "XL", label: "XL" },
    { value: "XXL", label: "XXL" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
    { value: "28", label: "28" },
    { value: "30", label: "30" },
    { value: "32", label: "32" },
    { value: "34", label: "34" },
    { value: "36", label: "36" },
    { value: "38", label: "38" },
    { value: "40", label: "40" },
    { value: "42", label: "42" }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = `api/reports/sales/by-invoice`;
      
      const params = new URLSearchParams({
        dateFrom: fromDate,
        dateTo: toDate,
        locCode: isAdmin ? selectedStore : currentUser?.locCode,
        userId: currentUser?.email || currentUser?.userId,
        ...(categoryFilter && { category: categoryFilter }),
        ...(skuSearch && { sku: skuSearch }),
        ...(sizeFilter && { size: sizeFilter }),
        ...(customerSearch && { customer: customerSearch })
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
        prepareCsvData(result.data);
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

  const prepareCsvData = (data) => {
    const csv = data.invoices?.map(inv => ({
      Date: inv.date,
      "Invoice No": inv.invoiceNumber,
      Customer: inv.customer,
      SKU: inv.skus || "N/A",
      Category: inv.category,
      "Item Count": inv.itemCount,
      "Total Amount": inv.totalAmount,
      Discount: inv.discount,
      "Net Amount": inv.netAmount,
      "Payment Method": inv.paymentMethod,
      Branch: inv.branch,
      "Sales Person": inv.salesPerson
    })) || [];
    setCsvData(csv);
  };

  return (
    <>
      <Helmet>
        <title>Sales by Invoice Report</title>
      </Helmet>
      <Headers />
      <div style={{ marginLeft: "256px", padding: "20px", maxWidth: "calc(100% - 256px)" }}>
        <h1>Sales by Invoice Report</h1>

        {/* Main Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          {isAdmin ? (
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Store</label>
              <Select
                options={storeOptions}
                value={storeOptions.find(s => s.value === selectedStore)}
                onChange={(opt) => setSelectedStore(opt.value)}
                isSearchable
                placeholder="Select Store..."
              />
            </div>
          ) : (
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Store</label>
              <div style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", backgroundColor: "#f5f5f5" }}>
                {storeOptions.find(s => s.value === selectedStore)?.label || selectedStore}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px", padding: "20px", backgroundColor: "#fff", border: "1px solid #e9ecef", borderRadius: "8px" }}>
          <h3 style={{ gridColumn: "1 / -1", margin: "0 0 15px 0", color: "#495057" }}>Advanced Filters</h3>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Category</label>
            <Select
              options={categoryOptions}
              value={categoryOptions.find(c => c.value === categoryFilter)}
              onChange={(opt) => setCategoryFilter(opt.value)}
              isClearable
              placeholder="Filter by category..."
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Item SKU</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Search by SKU..."
                style={{ 
                  width: "100%", 
                  padding: "8px 35px 8px 8px", 
                  borderRadius: "4px", 
                  border: "1px solid #ddd" 
                }}
              />
              <FiSearch style={{ 
                position: "absolute", 
                right: "10px", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "#6c757d" 
              }} />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Size</label>
            <Select
              options={sizeOptions}
              value={sizeOptions.find(s => s.value === sizeFilter)}
              onChange={(opt) => setSizeFilter(opt.value)}
              isClearable
              placeholder="Filter by size..."
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Customer</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer..."
                style={{ 
                  width: "100%", 
                  padding: "8px 35px 8px 8px", 
                  borderRadius: "4px", 
                  border: "1px solid #ddd" 
                }}
              />
              <FiSearch style={{ 
                position: "absolute", 
                right: "10px", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "#6c757d" 
              }} />
            </div>
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
              filename={`sales-by-invoice-${fromDate}-to-${toDate}.csv`}
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
            <h2>Sales by Invoice</h2>
            
            {/* Summary Cards */}
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
                <div style={{ fontSize: "12px", color: "#666" }}>Total Items</div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalItems || 0}</div>
              </div>
              <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>Avg Invoice Value</div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.avgInvoiceValue || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Invoice Details Table */}
            <h3>Invoice Details</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Invoice No</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Customer</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>SKU</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Items</th>
                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Amount</th>
                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Discount</th>
                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Net Amount</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Payment</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.invoices?.length > 0 ? (
                    reportData.invoices.map((invoice, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{invoice.date}</td>
                        <td style={{ padding: "10px", whiteSpace: "nowrap", fontWeight: "500" }}>{invoice.invoiceNumber}</td>
                        <td style={{ padding: "10px" }}>{invoice.customer}</td>
                        <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "12px", color: "#6366f1" }}>
                          {invoice.skus || "N/A"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ 
                            padding: "2px 8px", 
                            backgroundColor: "#e9ecef", 
                            borderRadius: "12px", 
                            fontSize: "12px" 
                          }}>
                            {invoice.category}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{invoice.itemCount}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "500" }}>₹{invoice.totalAmount.toFixed(2)}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: "#dc3545" }}>₹{invoice.discount.toFixed(2)}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", color: "#28a745" }}>₹{invoice.netAmount.toFixed(2)}</td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ 
                            padding: "2px 8px", 
                            backgroundColor: invoice.paymentMethod === "Cash" ? "#d4edda" : "#d1ecf1", 
                            color: invoice.paymentMethod === "Cash" ? "#155724" : "#0c5460",
                            borderRadius: "12px", 
                            fontSize: "12px" 
                          }}>
                            {invoice.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: "10px" }}>{invoice.branch}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                        No invoices found for the selected criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SalesByInvoiceReport;