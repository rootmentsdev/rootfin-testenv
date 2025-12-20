import Headers from '../components/Header.jsx';
import { useEffect, useState } from "react";
import Select from "react-select";
import baseUrl from '../api/api.js';
import { CSVLink } from 'react-csv';
import { Helmet } from "react-helmet";
import { FiDownload } from "react-icons/fi";

const InventoryReport = () => {
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
    { value: "718", label: "G.Mg Road" },
    { value: "101", label: "Production" },
    { value: "102", label: "Office" },
    { value: "103", label: "WAREHOUSE" }
  ];

  const reportTypeOptions = [
    { value: "summary", label: "Inventory Summary" },
    { value: "stock-summary", label: "Stock Summary" },
    { value: "valuation", label: "Inventory Valuation" },
    { value: "aging", label: "Inventory Aging" }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = `api/reports/inventory/${reportType}`;
      // For store users, pass their warehouse name; for admin, pass selected store name
      const warehouseParam = isAdmin ? selectedStore : (storeOptions.find(s => s.value === currentUser?.locCode)?.label || selectedStore);
      
      const params = new URLSearchParams({
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
      csv = data.items?.map(item => ({
        "Item Name": item.itemName,
        SKU: item.sku,
        Category: item.category,
        "Cost": item.cost,
        "Total Stock": item.totalStock,
        "Total Value": item.totalValue
      })) || [];
    } else if (type === "stock-summary") {
      csv = data.warehouses?.map(wh => ({
        Warehouse: wh.warehouse,
        "Total Quantity": wh.totalQuantity,
        "Total Value": wh.totalValue,
        "Item Count": wh.itemCount
      })) || [];
    } else if (type === "valuation") {
      csv = data.categories?.map(cat => ({
        Category: cat.category,
        "Item Count": cat.itemCount,
        "Total Quantity": cat.totalQuantity,
        "Total Value": cat.totalValue
      })) || [];
    } else if (type === "aging") {
      csv = [];
      data.aging?.forEach(bucket => {
        bucket.items?.forEach(item => {
          csv.push({
            "Age Bucket": bucket.bucket,
            "Item Name": item.itemName,
            SKU: item.sku,
            Quantity: item.quantity,
            Value: item.value,
            "Days Old": item.daysOld
          });
        });
      });
    }
    setCsvData(csv);
  };

  return (
    <>
      <Helmet>
        <title>Inventory Report</title>
      </Helmet>
      <Headers />
      <div style={{ marginLeft: "256px", padding: "20px", maxWidth: "calc(100% - 256px)" }}>
        <h1>Inventory Report</h1>

        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
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
              filename={`inventory-report-${new Date().toISOString().split('T')[0]}.csv`}
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
                <h2>Inventory Summary</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Items</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalItems || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Quantity</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalQuantity || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Stock Value</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.totalStockValue || 0).toFixed(2)}</div>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Item Name</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>SKU</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Category</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Cost</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Stock</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{item.itemName}</td>
                        <td style={{ padding: "10px" }}>{item.sku}</td>
                        <td style={{ padding: "10px" }}>{item.category}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{item.cost.toFixed(2)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{item.totalStock}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{item.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {reportType === "stock-summary" && (
              <>
                <h2>Stock Summary by Warehouse</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Warehouses</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalWarehouses || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Grand Total Quantity</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.grandTotalQuantity || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Grand Total Value</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.grandTotalValue || 0).toFixed(2)}</div>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Warehouse</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Quantity</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Value</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Item Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.warehouses?.map((wh, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{wh.warehouse}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{wh.totalQuantity}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{wh.totalValue.toFixed(2)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{wh.itemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {reportType === "valuation" && (
              <>
                <h2>Inventory Valuation by Category</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Categories</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalCategories || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Valuation</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.totalValuation || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Avg per Category</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.averageValuePerCategory || 0).toFixed(2)}</div>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Category</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Item Count</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Quantity</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.categories?.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{cat.category}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{cat.itemCount}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{cat.totalQuantity}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{cat.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {reportType === "aging" && (
              <>
                <h2>Inventory Aging Report</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Items</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{reportData.summary?.totalItems || 0}</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total Value</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{(reportData.summary?.totalValue || 0).toFixed(2)}</div>
                  </div>
                </div>

                {reportData.aging?.map((bucket, idx) => (
                  <div key={idx} style={{ marginBottom: "20px" }}>
                    <h3>{bucket.bucket}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px" }}>
                        <div style={{ fontSize: "11px", color: "#666" }}>Item Count</div>
                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>{bucket.itemCount}</div>
                      </div>
                      <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px" }}>
                        <div style={{ fontSize: "11px", color: "#666" }}>Total Value</div>
                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>₹{bucket.totalValue.toFixed(2)}</div>
                      </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f0f0f0" }}>
                          <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Item Name</th>
                          <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>SKU</th>
                          <th style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Qty</th>
                          <th style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Value</th>
                          <th style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Days Old</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bucket.items?.map((item, itemIdx) => (
                          <tr key={itemIdx} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "8px", fontSize: "12px" }}>{item.itemName}</td>
                            <td style={{ padding: "8px", fontSize: "12px" }}>{item.sku}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>{item.quantity}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>₹{item.value.toFixed(2)}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>{item.daysOld}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryReport;
