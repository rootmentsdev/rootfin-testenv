import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ChevronDown, ArrowUp, Calendar } from "lucide-react";
import baseUrl from "../api/api";

const Label = ({ children, required = false }) => (
  <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${required ? "text-[#ef4444]" : "text-[#64748b]"}`}>
    {children}
    {required && <span className="ml-0.5">*</span>}
  </span>
);

const Input = ({ placeholder = "", className = "", ...props }) => {
  const baseClasses = "w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors";
  const defaultClasses = "px-3 py-2.5";
  const finalClasses = `${baseClasses} ${defaultClasses} ${className}`;
  
  return (
    <input
      {...props}
      className={finalClasses}
      placeholder={placeholder}
    />
  );
};

const Select = ({ className = "", ...props }) => {
  const baseClasses = "w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer";
  const defaultClasses = "px-3 py-2.5";
  const finalClasses = `${baseClasses} ${defaultClasses} ${className}`;
  
  return (
    <select
      {...props}
      className={finalClasses}
    />
  );
};

const PurchaseReceiveCreate = () => {
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  // Initial form state - only show first 2 fields
  const [vendorName, setVendorName] = useState("Rewa footwear co.");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  
  // Rest of the form fields (shown after first 2 are filled)
  const [purchaseReceiveNumber, setPurchaseReceiveNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState("17/11/2025");
  const [notes, setNotes] = useState("");
  
  // Check if both initial fields are filled
  const showRestOfForm = vendorName && purchaseOrder;

  // Get today's date in DD/MM/YYYY format
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Set default date on mount
  useEffect(() => {
    if (!receivedDate) {
      setReceivedDate(getTodayDate());
    }
  }, []);

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <div className="border-b border-[#e6eafb] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f5f7ff]">
              <ArrowUp size={16} className="text-[#2563eb]" />
            </div>
            <h1 className="text-xl font-semibold text-[#1f2937]">New Purchase Receive</h1>
          </div>
          <Link
            to="/purchase/receives"
            className="rounded-md p-2 text-[#64748b] hover:bg-[#f5f7fb] transition-colors"
          >
            <X size={20} />
          </Link>
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-6">
          {/* Initial Fields - Always Visible */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vendor Name */}
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <div className="relative">
                <Input
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Select a Vendor"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {vendorName && (
                    <button
                      onClick={() => setVendorName("")}
                      className="text-[#dc2626] hover:text-[#b91c1c] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <ChevronDown size={16} className="text-[#9ca3af]" />
                </div>
              </div>
            </div>

            {/* Purchase Order# */}
            <div className="space-y-2">
              <Label required>Purchase Order#</Label>
              <div className="relative">
                <Select
                  value={purchaseOrder}
                  onChange={(e) => setPurchaseOrder(e.target.value)}
                >
                  <option value="">Select a Purchase Order</option>
                  <option value="PO-001">PO-001</option>
                  <option value="PO-002">PO-002</option>
                  <option value="PO-003">PO-003</option>
                </Select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={16} className="text-[#9ca3af]" />
                </div>
              </div>
            </div>
          </div>

          {/* Rest of Form - Conditionally Rendered */}
          {showRestOfForm && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Purchase Receive# */}
                <div className="space-y-2">
                  <Label required>Purchase Receive#</Label>
                  <div className="relative">
                    <Input
                      value={purchaseReceiveNumber}
                      onChange={(e) => setPurchaseReceiveNumber(e.target.value)}
                      placeholder="Auto-generated"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 rounded border border-[#d7dcf5] bg-[#f5f7fb] flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-[#9ca3af]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Received Date */}
                <div className="space-y-2">
                  <Label required>Received Date</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Calendar size={16} className="text-[#9ca3af]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items & Description Table */}
              <div className="space-y-3">
                <Label>ITEMS & DESCRIPTION</Label>
                <div className="rounded-xl border border-[#e6eafb] bg-white overflow-hidden">
                  <table className="min-w-full divide-y divide-[#e6eafb]">
                    <thead className="bg-[#f9fafb]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          ITEMS & DESCRIPTION
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          ORDERED
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          RECEIVED
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          IN TRANSIT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          QUANTITY TO RECEIVE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6eafb] bg-white">
                      {/* Empty state - items will be populated from purchase order */}
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-[#64748b]">
                          Items will be loaded from the selected Purchase Order
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <Label>Notes (For Internal Use)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors resize-y"
                  placeholder="Add internal notes..."
                />
              </div>

              {/* File Attachment Section */}
              <div className="space-y-2">
                <Label>Attach File(s) to Purchase Receive</Label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-4 py-2.5 text-sm font-medium text-[#1f2937] hover:bg-[#f8fafc] transition-colors">
                    <ArrowUp size={16} />
                    <span>Upload File</span>
                    <ChevronDown size={16} className="text-[#9ca3af]" />
                    <input type="file" className="hidden" multiple />
                  </label>
                </div>
                <p className="text-xs text-[#64748b]">
                  You can upload a maximum of 5 files, 10MB each
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-[#e7ebf8] bg-[#fafbff] px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {showRestOfForm ? (
            <>
              <button className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                Save as Draft
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors shadow-sm">
                <span>Save as Received</span>
                <ChevronDown size={16} />
              </button>
              <Link
                to="/purchase/receives"
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </Link>
            </>
          ) : (
            <Link
              to="/purchase/receives"
              className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
            >
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceiveCreate;

