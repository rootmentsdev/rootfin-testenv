import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { X, Edit, FileText, CreditCard, Check, ChevronRight } from "lucide-react";
import baseUrl from "../api/api";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  const [bill, setBill] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPdfView, setShowPdfView] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get user info
        const userStr = localStorage.getItem("rootfinuser");
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?._id || user?.id || user?.email || user?.locCode || null;
        const locCode = user?.locCode || "";

        if (!userId) {
          navigate("/purchase/bills");
          return;
        }

        // Fetch the specific bill
        const billResponse = await fetch(`${API_URL}/api/purchase/bills/${id}`);
        if (!billResponse.ok) {
          const errorText = await billResponse.text();
          console.error("Error fetching bill:", billResponse.status, errorText);
          throw new Error(`Bill not found: ${billResponse.status}`);
        }
        const billData = await billResponse.json();
        console.log("Bill data loaded:", billData);
        setBill(billData);

        // Fetch vendor if vendorId exists
        if (billData.vendorId) {
          try {
            const vendorResponse = await fetch(`${API_URL}/api/purchase/vendors/${billData.vendorId}`);
            if (vendorResponse.ok) {
              const vendorData = await vendorResponse.json();
              setVendor(vendorData);
            }
          } catch (error) {
            console.error("Error fetching vendor:", error);
          }
        }

        // Fetch all bills for sidebar
        const billsResponse = await fetch(`${API_URL}/api/purchase/bills?userId=${userId}${locCode ? `&locCode=${locCode}` : ""}`);
        if (billsResponse.ok) {
          const billsData = await billsResponse.json();
          setBills(Array.isArray(billsData) ? billsData : []);
        }
      } catch (error) {
        console.error("Error loading bill:", error);
        navigate("/purchase/bills");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, API_URL]);

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="ml-64 min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#64748b] mb-4">Bill not found</p>
          <Link to="/purchase/bills" className="text-[#2563eb] hover:underline">
            Back to Bills
          </Link>
        </div>
      </div>
    );
  }

  // Calculate bill status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;
  if (dueDate) dueDate.setHours(0, 0, 0, 0);

  let status = "OPEN";
  let isOverdue = false;
  let overdueDays = 0;

  if (dueDate) {
    if (dueDate < today) {
      isOverdue = true;
      overdueDays = daysBetween(today, dueDate);
      status = "OVERDUE";
    } else if (dueDate.getTime() === today.getTime()) {
      status = "DUE_TODAY";
    }
  }

  const balanceDue = parseFloat(bill.finalTotal) || 0;

  // Process bills for sidebar
  const processedBills = bills.map((b) => {
    const bDueDate = b.dueDate ? new Date(b.dueDate) : null;
    if (bDueDate) bDueDate.setHours(0, 0, 0, 0);

    let bStatus = "OPEN";
    let bIsOverdue = false;
    let bOverdueDays = 0;

    if (bDueDate) {
      if (bDueDate < today) {
        bIsOverdue = true;
        bOverdueDays = daysBetween(today, bDueDate);
        bStatus = "OVERDUE";
      } else if (bDueDate.getTime() === today.getTime()) {
        bStatus = "DUE_TODAY";
      }
    }

    return {
      ...b,
      status: bStatus,
      isOverdue: bIsOverdue,
      overdueDays: bOverdueDays,
      finalTotal: parseFloat(b.finalTotal) || 0,
    };
  });

  // Get company details (you may need to fetch this from user/organization settings)
  const companyName = "Meenakshi Apparels"; // This should come from user/organization settings
  const companyAddress = "6182 MAINROAD, GANDHI NAGAR, DELHI-110051"; // This should come from user/organization settings
  const companyGSTIN = "07AACPA8514M1ZX"; // This should come from user/organization settings
  const companyCountry = "India";

  // Get vendor details
  const vendorName = vendor?.displayName || vendor?.companyName || bill.vendorName || "";
  const vendorState = vendor?.billingState || bill.destinationOfSupply || "";
  const vendorGSTIN = vendor?.gstin || "";
  const vendorEmail = vendor?.email || "";

  // Build vendor address
  const vendorAddressParts = [
    vendor?.billingAddress,
    vendor?.billingAddress2,
    vendor?.billingCity,
    vendor?.billingState,
    vendor?.billingPinCode,
  ].filter(Boolean);
  const vendorAddress = vendorAddressParts.join(", ");

  // Calculate tax breakdown
  const taxBreakdown = {};
  bill.items?.forEach((item) => {
    if (item.isInterState && item.igstPercent > 0) {
      const key = `IGST${item.igstPercent} (${item.igstPercent}%)`;
      taxBreakdown[key] = (taxBreakdown[key] || 0) + parseFloat(item.igstAmount || 0);
    } else if (!item.isInterState) {
      if (item.cgstPercent > 0) {
        const key = `CGST${item.cgstPercent} (${item.cgstPercent}%)`;
        taxBreakdown[key] = (taxBreakdown[key] || 0) + parseFloat(item.cgstAmount || 0);
      }
      if (item.sgstPercent > 0) {
        const key = `SGST${item.sgstPercent} (${item.sgstPercent}%)`;
        taxBreakdown[key] = (taxBreakdown[key] || 0) + parseFloat(item.sgstAmount || 0);
      }
    }
  });

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] flex">
      {/* Left Sidebar - Bills List */}
      <div className="w-80 bg-white border-r border-[#e6eafb] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#e6eafb]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#1f2937]">{vendorName}</h2>
          </div>
          <p className="text-2xl font-bold text-[#1f2937]">{formatCurrency(balanceDue)}</p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-[#e6eafb] flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm font-medium text-[#475569] border border-[#d7dcf5] rounded-md hover:bg-[#f8fafc] transition-colors">
            <Edit size={14} className="inline mr-1" />
            Edit
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-medium text-[#475569] border border-[#d7dcf5] rounded-md hover:bg-[#f8fafc] transition-colors">
            <FileText size={14} className="inline mr-1" />
            PDF/Print
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-medium text-[#475569] border border-[#d7dcf5] rounded-md hover:bg-[#f8fafc] transition-colors">
            <CreditCard size={14} className="inline mr-1" />
            Record Payment
          </button>
        </div>

        {/* Overdue Banner */}
        {isOverdue && (
          <div className="p-4 bg-[#dbeafe] border-b border-[#e6eafb]">
            <p className="text-sm font-medium text-[#1e40af] mb-2">
              WHAT'S NEXT? Payment for this bill is overdue. You can record the payment for this bill if paid.
            </p>
            <button className="w-full px-3 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8] transition-colors">
              Record Payment
            </button>
          </div>
        )}

        {/* Bills List */}
        <div className="flex-1 overflow-y-auto">
          {processedBills
            .filter((b) => b.vendorName === bill.vendorName)
            .map((b) => (
              <Link
                key={b._id}
                to={`/purchase/bills/${b._id}`}
                className={`block p-4 border-b border-[#e6eafb] hover:bg-[#f9fafb] transition-colors ${
                  b._id === id ? "bg-[#eff6ff] border-l-4 border-l-[#2563eb]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-[#1f2937] truncate">{b.vendorName}</p>
                      <ChevronRight size={16} className="text-[#94a3b8] shrink-0" />
                    </div>
                    <p className="text-xs text-[#64748b] mb-1">
                      {b.billNumber} - {formatDate(b.billDate)}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#1f2937]">
                        {formatCurrency(b.finalTotal)}
                      </p>
                      {b.isOverdue ? (
                        <span className="text-xs font-medium text-[#dc2626] bg-[#fee2e2] px-2 py-0.5 rounded">
                          OVERDUE BY {b.overdueDays} DAYS
                        </span>
                      ) : b.status === "DUE_TODAY" ? (
                        <span className="text-xs font-medium text-[#f59e0b] bg-[#fef3c7] px-2 py-0.5 rounded">
                          DUE TODAY
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#10b981] bg-[#d1fae5] px-2 py-0.5 rounded">
                          OPEN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e6eafb] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/purchase/bills"
              className="p-2 hover:bg-[#f1f5f9] rounded-md transition-colors"
            >
              <X size={20} className="text-[#64748b]" />
            </Link>
            <h1 className="text-xl font-semibold text-[#1f2937]">Bill Details</h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={showPdfView}
                onChange={(e) => setShowPdfView(e.target.checked)}
                className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
              />
              Show PDF View
            </label>
          </div>
        </div>

        {/* Bill Content */}
        <div className="p-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg border border-[#e6eafb] shadow-sm">
            {/* Bill Header */}
            <div className="p-8 border-b border-[#e6eafb]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  {isOverdue && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-[#92400e] bg-[#fef3c7] rounded mb-3">
                      Overdue
                    </span>
                  )}
                  <h1 className="text-4xl font-bold text-[#1f2937] mb-2">BILL</h1>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#64748b] mb-1">Bill# {bill.billNumber}</p>
                  <p className="text-lg font-semibold text-[#1f2937]">
                    Balance Due {formatCurrency(balanceDue)}
                  </p>
                </div>
              </div>

              {/* Bill From / Bill To */}
              <div className="grid grid-cols-2 gap-8">
                {/* Bill From */}
                <div>
                  <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                    Bill From
                  </h3>
                  <div className="text-sm text-[#1f2937] space-y-1">
                    <p className="font-semibold">{companyName}</p>
                    <p>{companyAddress}</p>
                    <p>{companyCountry}</p>
                    <p>GSTIN {companyGSTIN}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div>
                  <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                    Bill To
                  </h3>
                  <div className="text-sm text-[#1f2937] space-y-1">
                    <p className="font-semibold">{vendorName}</p>
                    {vendorAddress && <p>{vendorAddress}</p>}
                    {vendorState && <p>{vendorState}</p>}
                    {vendorGSTIN && <p>GSTIN {vendorGSTIN}</p>}
                    {vendorEmail && <p>{vendorEmail}</p>}
                  </div>
                </div>
              </div>

              {/* Dates and Terms */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[#64748b]">Bill Date: </span>
                  <span className="text-[#1f2937] font-medium">{formatDate(bill.billDate)}</span>
                </div>
                <div>
                  <span className="text-[#64748b]">Due Date: </span>
                  <span className="text-[#1f2937] font-medium">
                    {bill.dueDate ? formatDate(bill.dueDate) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Terms: </span>
                  <span className="text-[#1f2937] font-medium">{bill.paymentTerms || "Due on Receipt"}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e6eafb]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Item & Description
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Size
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      HSN/SAC
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Rate
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item, index) => (
                    <tr key={index} className="border-b border-[#e6eafb]">
                      <td className="py-3 px-4 text-sm text-[#1f2937]">{index + 1}</td>
                      <td className="py-3 px-4 text-sm text-[#1f2937]">
                        <div>
                          <p className="font-medium">{item.itemName || "-"}</p>
                          {item.itemDescription && (
                            <p className="text-xs text-[#64748b] mt-1">{item.itemDescription}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#1f2937]">{item.size || "-"}</td>
                      <td className="py-3 px-4 text-sm text-[#1f2937]">
                        {item.taxCode || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#1f2937] text-right">
                        {item.quantity?.toFixed(2) || "0.00"} pcs
                      </td>
                      <td className="py-3 px-4 text-sm text-[#1f2937] text-right">
                        {formatCurrency(item.rate || 0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#1f2937] text-right font-medium">
                        {formatCurrency(item.amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="p-8 border-t border-[#e6eafb] bg-[#fafbff]">
              <div className="max-w-md ml-auto space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Sub Total</span>
                  <span className="text-[#1f2937] font-medium">
                    {formatCurrency(bill.subTotal || 0)}
                  </span>
                </div>

                {/* Tax Breakdown */}
                {Object.entries(taxBreakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-[#64748b]">{key}</span>
                    <span className="text-[#1f2937] font-medium">{formatCurrency(value)}</span>
                  </div>
                ))}

                {/* Discount */}
                {bill.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Discount</span>
                    <span className="text-[#1f2937] font-medium text-[#10b981]">
                      -{formatCurrency(bill.discountAmount || 0)}
                    </span>
                  </div>
                )}

                {/* TDS/TCS */}
                {bill.tdsTcsAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">
                      {bill.tdsTcsType || "TDS"} ({bill.tdsTcsTax || ""})
                    </span>
                    <span className="text-[#1f2937] font-medium text-[#dc2626]">
                      -{formatCurrency(bill.tdsTcsAmount || 0)}
                    </span>
                  </div>
                )}

                {/* Adjustment */}
                {bill.adjustment !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Adjustment</span>
                    <span className="text-[#1f2937] font-medium">
                      {bill.adjustment > 0 ? "+" : ""}
                      {formatCurrency(bill.adjustment || 0)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#e6eafb] flex justify-between">
                  <span className="text-base font-semibold text-[#1f2937]">Total</span>
                  <span className="text-base font-semibold text-[#1f2937]">
                    {formatCurrency(bill.finalTotal || 0)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#e6eafb] flex justify-between">
                  <span className="text-base font-semibold text-[#1f2937]">Balance Due</span>
                  <span className="text-base font-semibold text-[#1f2937]">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {bill.notes && (
              <div className="p-8 border-t border-[#e6eafb]">
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                  Notes
                </h3>
                <p className="text-sm text-[#1f2937] whitespace-pre-wrap">{bill.notes}</p>
              </div>
            )}

            {/* Authorized Signature */}
            <div className="p-8 border-t border-[#e6eafb]">
              <div className="max-w-xs">
                <div className="border-b border-[#e6eafb] h-16"></div>
                <p className="text-xs text-[#64748b] mt-2">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetail;

