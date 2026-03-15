import Headers from '../components/Header.jsx';
import { useEffect, useState } from "react";
import Select from "react-select";
import baseUrl from '../api/api.js';
import { CSVLink } from 'react-csv';
import { Helmet } from "react-helmet";
import { FiDownload, FiSearch, FiTruck, FiPackage, FiArrowRight } from "react-icons/fi";

const InTransitStock = () => {
  const [selectedStore, setSelectedStore] = useState("All Stores");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState("all");

  const currentUser = JSON.parse(localStorage.getItem("rootfinuser"));
  const isAdmin = (currentUser?.power || "").toLowerCase() === "admin";
  const adminEmails = ['officerootments@gmail.com'];
  const isMainAdmin =
    adminEmails.some(email => (currentUser?.email || "").toLowerCase() === email.toLowerCase()) ||
    ['858', '103'].includes(currentUser?.locCode);
  const canChooseStore = isAdmin && isMainAdmin;
  
  // For store users, set their store as default and disable selection
  useEffect(() => {
    if (!canChooseStore && currentUser?.locCode) {
      setSelectedStore(currentUser.locCode);
    }
  }, [canChooseStore, currentUser?.locCode]);

  const storeOptions = [
    { value: "All Stores", label: "All Stores" },
    { value: "858", label: "Warehouse" },
    { value: "702", label: "G-Edappally" },
    { value: "759", label: "HEAD OFFICE01" },
    { value: "700", label: "SG-Trivandrum" },
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
    { value: "102", label: "Office" }
  ];

  const fetchInTransitStock = async () => {
    setLoading(true);
    try {
      const endpoint = `api/reports/inventory/in-transit-stock`;
      const selectedStoreOption = storeOptions.find(s => s.value === selectedStore);
      const currentUserStoreOption = storeOptions.find(s => s.value === currentUser?.locCode);
      
      // Send both label and value for better matching
      const warehouseParam = canChooseStore
        ? (selectedStoreOption?.label || selectedStore)
        : (currentUserStoreOption?.label || selectedStoreOption?.label || currentUser?.locCode || selectedStore);
      
      const params = new URLSearchParams({
        warehouse: warehouseParam,
        warehouseCode: canChooseStore ? selectedStore : (currentUser?.locCode || selectedStore),
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
        prepareCsvData(result.data);
        setCurrentPage(1);
      } else {
        alert("Failed to fetch in-transit stock: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching in-transit stock:", error);
      alert("Error fetching in-transit stock: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const prepareCsvData = (data) => {
    const csv = data.items?.map(item => ({
      "Transfer Order": item.transferOrderNumber,
      "Date": new Date(item.date).toLocaleDateString('en-IN'),
      "Item Name": item.itemName,
      "SKU": item.sku || '',
      "Quantity": item.quantity,
      "Cost Price": item.costPrice,
      "Total Value": item.totalValue,
      "Source Warehouse": item.sourceWarehouse,
      "Destination Warehouse": item.destinationWarehouse,
      "Reason": item.reason || '',
      "Created By": item.createdBy || ''
    })) || [];
    setCsvData(csv);
  };

  // Pagination helper functions
  const getPaginatedData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    if (itemsPerPage === "all") {
      return data;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    if (!data || !Array.isArray(data)) return 1;
    if (itemsPerPage === "all") return 1;
    return Math.ceil(data.length / itemsPerPage);
  };

  const PaginationControls = ({ totalItems, data }) => {
    if (!data || data.length === 0) return null;
    
    const totalPages = getTotalPages(data);
    const startItem = totalItems > 0 ? (itemsPerPage === "all" ? 1 : (currentPage - 1) * itemsPerPage + 1) : 0;
    const endItem = itemsPerPage === "all" ? totalItems : Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "15px", 
        marginTop: "20px", 
        padding: "15px", 
        backgroundColor: "white", 
        borderRadius: "4px",
        borderTop: "1px solid #ddd"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ color: "#666", fontSize: "14px" }}>
            Showing <span style={{ fontWeight: "bold", color: "#333" }}>{startItem}</span> to{" "}
            <span style={{ fontWeight: "bold", color: "#333" }}>{endItem}</span> of{" "}
            <span style={{ fontWeight: "bold", color: "#333" }}>{totalItems}</span> items
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#666", fontSize: "14px" }}>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const value = e.target.value === "all" ? "all" : Number(e.target.value);
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>

            {itemsPerPage !== "all" && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    backgroundColor: currentPage === 1 ? "#f5f5f5" : "white",
                    color: currentPage === 1 ? "#999" : "#333",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Previous
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    backgroundColor: currentPage === totalPages ? "#f5f5f5" : "white",
                    color: currentPage === totalPages ? "#999" : "#333",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>In-Transit Stock</title>
      </Helmet>
      <Headers />
      <div style={{ 
        marginLeft: "256px", 
        padding: "24px", 
        maxWidth: "calc(100% - 256px)",
        minHeight: "100vh",
        backgroundColor: "#fafbfc",
        transition: "all 0.3s ease"
      }}>
        {/* Page Header */}
        <div style={{ 
          marginBottom: "32px",
          paddingBottom: "16px",
          borderBottom: "2px solid #e9ecef"
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: "28px",
            fontWeight: "600",
            color: "#2c3e50",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <FiTruck style={{ color: "#f39c12" }} />
            In-Transit Stock
          </h1>
          <p style={{ 
            margin: "8px 0 0 0",
            color: "#6c757d",
            fontSize: "14px"
          }}>Monitor items currently being transferred between warehouses</p>
        </div>

        {/* Filters Card */}
        <div style={{ 
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #e9ecef",
          transition: "box-shadow 0.3s ease"
        }}>
          <h3 style={{ 
            margin: "0 0 20px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#495057"
          }}>Filter Options</h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
            gap: "20px"
          }}>
            {canChooseStore ? (
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "500",
                  color: "#495057",
                  fontSize: "14px"
                }}>Store</label>
                <Select
                  options={storeOptions}
                  value={storeOptions.find(s => s.value === selectedStore)}
                  onChange={(opt) => setSelectedStore(opt.value)}
                  isSearchable
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: "8px",
                      borderColor: state.isFocused ? "#007bff" : "#dee2e6",
                      boxShadow: state.isFocused ? "0 0 0 2px rgba(0,123,255,0.1)" : "none",
                      padding: "4px 8px",
                      transition: "all 0.2s ease"
                    })
                  }}
                />
              </div>
            ) : (
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "500",
                  color: "#495057",
                  fontSize: "14px"
                }}>Store</label>
                <div style={{ 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "1px solid #dee2e6", 
                  backgroundColor: "#f8f9fa",
                  color: "#6c757d",
                  fontSize: "14px"
                }}>
                  {storeOptions.find(s => s.value === currentUser?.locCode)?.label || currentUser?.locCode || storeOptions.find(s => s.value === selectedStore)?.label || selectedStore}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: "32px",
          alignItems: "center"
        }}>
          <button
            onClick={fetchInTransitStock}
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f39c12",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(243,156,18,0.2)"
            }}
          >
            <FiSearch />
            {loading ? "Loading..." : "Load In-Transit Stock"}
          </button>
          
          {csvData.length > 0 && (
            <CSVLink
              data={csvData}
              filename={`in-transit-stock-${new Date().toISOString().split('T')[0]}.csv`}
              style={{
                padding: "12px 24px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(40,167,69,0.2)"
              }}
            >
              <FiDownload /> Export CSV
            </CSVLink>
          )}
        </div>

        {/* Report Display */}
        {reportData && (
          <div style={{ 
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ 
              marginBottom: "32px",
              paddingBottom: "20px",
              borderBottom: "2px solid #f8f9fa"
            }}>
              <h2 style={{ 
                margin: "0 0 8px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <FiTruck style={{ color: "#f39c12" }} />
                In-Transit Stock Report
              </h2>
              <p style={{ 
                margin: 0,
                color: "#6c757d",
                fontSize: "14px"
              }}>Items currently being transferred between warehouses - {reportData.period}</p>
            </div>

            {/* Summary Cards */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "20px", 
              marginBottom: "40px"
            }}>
              <div style={{ 
                backgroundColor: "#fff3cd", 
                padding: "24px", 
                borderRadius: "12px", 
                border: "1px solid #ffeaa7"
              }}>
                <div style={{ 
                  fontSize: "13px", 
                  color: "#856404", 
                  fontWeight: "500",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>Total Orders</div>
                <div style={{ 
                  fontSize: "32px", 
                  fontWeight: "700",
                  color: "#856404",
                  lineHeight: "1"
                }}>{reportData.summary?.totalOrders || 0}</div>
              </div>
              
              <div style={{ 
                backgroundColor: "#e8f4fd", 
                padding: "24px", 
                borderRadius: "12px", 
                border: "1px solid #b8daff"
              }}>
                <div style={{ 
                  fontSize: "13px", 
                  color: "#0c5aa6", 
                  fontWeight: "500",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>Total Items</div>
                <div style={{ 
                  fontSize: "32px", 
                  fontWeight: "700",
                  color: "#0c5aa6",
                  lineHeight: "1"
                }}>{reportData.summary?.totalItems || 0}</div>
              </div>
              
              <div style={{ 
                backgroundColor: "#f8f9fa", 
                padding: "24px", 
                borderRadius: "12px", 
                border: "1px solid #e9ecef"
              }}>
                <div style={{ 
                  fontSize: "13px", 
                  color: "#6c757d", 
                  fontWeight: "500",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>Total Quantity</div>
                <div style={{ 
                  fontSize: "32px", 
                  fontWeight: "700",
                  color: "#f39c12",
                  lineHeight: "1"
                }}>{reportData.summary?.totalQuantity || 0}</div>
              </div>
              
              <div style={{ 
                backgroundColor: "#d4edda", 
                padding: "24px", 
                borderRadius: "12px", 
                border: "1px solid #c3e6cb"
              }}>
                <div style={{ 
                  fontSize: "13px", 
                  color: "#155724", 
                  fontWeight: "500",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>Total Value</div>
                <div style={{ 
                  fontSize: "32px", 
                  fontWeight: "700",
                  color: "#155724",
                  lineHeight: "1"
                }}>₹{(reportData.summary?.totalValue || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
              </div>
            </div>

            {/* Items Table */}
            {reportData.items?.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "60px 20px",
                color: "#6c757d"
              }}>
                <FiPackage size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "500" }}>
                  No In-Transit Stock Found
                </h3>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  There are currently no items being transferred between warehouses.
                </p>
              </div>
            ) : (
              <>
                <div style={{ 
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #e9ecef"
                }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse",
                    backgroundColor: "white"
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f1f3f4" }}>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "left", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Transfer Order</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "left", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Date</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "left", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Item Name</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "left", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>SKU</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "right", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Quantity</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "right", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Cost Price</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "right", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Total Value</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "left", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Route</th>
                        <th style={{ 
                          padding: "16px 20px", 
                          textAlign: "left", 
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "14px",
                          borderBottom: "2px solid #dee2e6"
                        }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(reportData.items)?.map((item, idx) => (
                        <tr key={idx} style={{ 
                          borderBottom: "1px solid #f1f3f4",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
                          <td style={{ 
                            padding: "16px 20px",
                            fontWeight: "600",
                            color: "#007bff"
                          }}>{item.transferOrderNumber}</td>
                          <td style={{ 
                            padding: "16px 20px",
                            color: "#6c757d",
                            fontSize: "14px"
                          }}>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                          <td style={{ 
                            padding: "16px 20px",
                            fontWeight: "500",
                            color: "#495057"
                          }}>{item.itemName}</td>
                          <td style={{ 
                            padding: "16px 20px", 
                            fontFamily: "monospace", 
                            fontSize: "13px",
                            color: "#6c757d"
                          }}>{item.sku || '-'}</td>
                          <td style={{ 
                            padding: "16px 20px", 
                            textAlign: "right",
                            fontWeight: "600",
                            color: "#f39c12"
                          }}>{item.quantity}</td>
                          <td style={{ 
                            padding: "16px 20px", 
                            textAlign: "right",
                            color: "#6c757d"
                          }}>₹{item.costPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          <td style={{ 
                            padding: "16px 20px", 
                            textAlign: "right",
                            fontWeight: "700",
                            color: "#28a745"
                          }}>₹{item.totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          <td style={{ 
                            padding: "16px 20px",
                            fontSize: "13px"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "8px",
                              color: "#495057"
                            }}>
                              <span style={{ fontWeight: "500" }}>{item.sourceWarehouse}</span>
                              <FiArrowRight style={{ color: "#f39c12" }} />
                              <span style={{ fontWeight: "500" }}>{item.destinationWarehouse}</span>
                            </div>
                          </td>
                          <td style={{ 
                            padding: "16px 20px",
                            color: "#6c757d",
                            fontSize: "14px"
                          }}>{item.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls totalItems={reportData.items?.length || 0} data={reportData.items} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default InTransitStock;