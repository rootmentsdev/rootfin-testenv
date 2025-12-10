import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Printer, Download, Mail, Share2, Edit, MoreHorizontal, ArrowLeft } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";

const SalesInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);

  // NEW STATE (dropdown toggle)
  const [showSendMenu, setShowSendMenu] = useState(false);

  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("rootfinuser");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoadingList(true);
      try {
        const user = getUserInfo();
        if (!user || !user.email) return;
        const params = new URLSearchParams({
          userId: user.email,
        });
        if (user.power) params.append("userPower", user.power);
        if (user.locCode) params.append("locCode", user.locCode);

        const response = await fetch(`${API_URL}/api/sales/invoices?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setInvoices(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching invoices list:", err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchInvoices();
  }, [API_URL]);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/sales/invoices/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch invoice: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("API Response:", data); // Add this line for debugging
        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError(err.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchInvoice();
    }
  }, [id, API_URL]);

  const handlePrint = () => {
    window.print();
  };

  // OLD email handler remains
  const handleEmail = () => {
    alert("Email functionality will be implemented");
  };

  // NEW — Send SMS handler
  const handleSMS = () => {
    alert("SMS functionality will be implemented");
  };

  // NEW — Delete Invoice handler
  const handleDeleteInvoice = async () => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete invoice");

      alert("Invoice deleted successfully");
      navigate("/sales/invoices");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete invoice");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice?.invoiceNumber}`,
        text: `Invoice for ${invoice?.customer}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Invoice link copied to clipboard");
    }
  };


  // Whatsapp

  const handleWhatsApp = () => {
    console.log("Invoice data:", invoice);
    console.log("Customer phone:", invoice?.customerPhone);
    
    const phone = invoice?.customerPhone || "";
    
    if (!phone) {
      alert("Customer phone number not available.");
      return;
    }
  
    // Clean and format phone number - remove all non-digit characters
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Ensure phone number has country code (India: 91)
    let formattedPhone = cleanedPhone;
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone; // Add India country code
    }
  
    const message =
      `Hello,\n\n` +
      `Here is your invoice from Grooms Wedding Hub.\n` +
      `Invoice No: ${invoice.invoiceNumber}\n` +
      `Invoice Date: ${formatDate(invoice.invoiceDate)}\n` +
      `Due Date: ${formatDate(invoice.dueDate)}\n` +
      `Customer: ${invoice.customer}\n` +
      `Phone: ${invoice.customerPhone || 'Not provided'}\n` +
      `Branch: ${invoice.branch}\n\n` +
      `--- ITEMS ---\n` +
      `${invoice.lineItems?.map((item, index) => 
        `${index + 1}. ${item.item || 'Item'} - Qty: ${item.quantity || 0} - Rate: ₹${parseFloat(item.rate || 0).toLocaleString('en-IN')} - Amount: ₹${parseFloat(item.amount || 0).toLocaleString('en-IN')}`
      ).join('\n') || 'No items'}\n\n` +
      `Sub Total: ₹${parseFloat(invoice.subTotal || 0).toLocaleString('en-IN')}\n` +
      `Discount: ${invoice.discount?.value || '0'}${invoice.discount?.type || '%'}\n` +
      `Discount Amount: ₹${parseFloat(invoice.discountAmount || 0).toLocaleString('en-IN')}\n` +
      `Tax: ₹${parseFloat(invoice.totalTax || 0).toLocaleString('en-IN')}\n` +
      `Adjustment: ₹${parseFloat(invoice.adjustmentAmount || 0).toLocaleString('en-IN')}\n` +
      `Total Amount: ₹${parseFloat(invoice.finalTotal || 0).toLocaleString('en-IN')}\n\n` +
      `Status: ${invoice.status?.toUpperCase() || 'DRAFT'}\n` +
      `Terms: ${invoice.terms || 'Due on Receipt'}\n\n` +
      `Thank you for your business!`;
  
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
    window.open(url, "_blank");
  };
  


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-[#6b7280]">Loading invoice...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f9ff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[#ef4444] mb-4">{error}</p>
          <button
            onClick={() => navigate("/sales/invoices")}
            className="text-[#2563eb] hover:text-[#1d4ed8] text-sm"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f6f9ff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[#6b7280]">Invoice not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <Head title={`Invoice ${invoice.invoiceNumber}`} description={`Invoice details for ${invoice.customer}`} />
  
      <div className="flex">
  
        {/* LEFT SIDEBAR — unchanged */}
        <div className="w-80 bg-white border-r border-[#e5e7eb] h-screen overflow-y-auto ml-64">
  <div className="p-4 border-b border-[#e5e7eb]">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-[#1f2937]">All Invoices</h2>
      <Link
        to="/sales/invoices/new"
        className="bg-[#2563eb] text-white px-3 py-1 rounded-md text-sm hover:bg-[#1d4ed8] transition-colors"
      >
        + New
      </Link>
    </div>
  </div>

  <div className="p-2">
    {loadingList ? (
      <div className="text-center py-8">
        <div className="text-sm text-[#6b7280]">Loading invoices...</div>
      </div>
    ) : (
      <div className="space-y-1">
        {invoices.map((inv) => (
          <Link
            key={inv._id}
            to={`/sales/invoices/${inv._id}`}
            className={`block p-3 rounded-lg border transition-colors ${
              inv._id === id
                ? 'bg-[#eff6ff] border-[#2563eb] text-[#2563eb]'
                : 'bg-white border-[#e5e7eb] hover:bg-[#f9fafb] text-[#1f2937]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{inv.customer}</div>
                <div className="text-xs text-[#6b7280]">{inv.invoiceNumber}</div>
                <div className="text-xs text-[#6b7280]">{formatDate(inv.invoiceDate)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-sm">{formatCurrency(inv.finalTotal)}</div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    inv.status?.toLowerCase() === 'paid'
                      ? 'bg-[#d1fae5] text-[#065f46]'
                      : inv.status?.toLowerCase() === 'draft'
                      ? 'bg-[#f3f4f6] text-[#374151]'
                      : 'bg-[#dbeafe] text-[#1e40af]'
                  }`}
                >
                  {(inv.status || 'DRAFT').toUpperCase()}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
</div>

  
        {/* MAIN CONTENT */}
        <div className="flex-1 px-10 pb-16 pt-6">
  
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/sales/invoices")} className="flex items-center gap-2 text-[#6b7280] hover:text-[#1f2937]">
                <ArrowLeft size={20} />
                <span className="text-sm">All Invoices</span>
              </button>
              <div className="text-2xl font-semibold text-[#1f2937]">
                {invoice.invoiceNumber}
              </div>
            </div>
  
            <div className="flex items-center gap-2">
  
              {/* PRINT BUTTON — unchanged */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f9fafb]"
              >
                <Printer size={16} />
                Print
              </button>
  
              {/* NEW SEND DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setShowSendMenu((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f9fafb]"
                >
                  <Mail size={16} />
                  Send
                </button>
  
                {showSendMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <button onClick={handleEmail} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Send Email
                    </button>
  
                    <button onClick={handleSMS} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Send SMS
                    </button>
                    <button
  onClick={handleWhatsApp}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
>
  Send via WhatsApp
</button>

  
                    <button onClick={handleDeleteInvoice} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100">
                      Delete Invoice
                    </button>
                  </div>
                )}
              </div>
  
              {/* SHARE */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f9fafb]"
              >
                <Share2 size={16} />
                Share
              </button>
  
              {/* EDIT */}
              <Link
                to={`/sales/invoices/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] border border-[#2563eb] rounded-md hover:bg-[#1d4ed8]"
              >
                <Edit size={16} />
                Edit
              </Link>
  
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f9fafb]">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
  

        {/* Invoice Document - Zoho Template Style */}
        <div className="bg-white shadow-lg border-2 border-[#000] max-w-4xl mx-auto">
          {/* Green PAID Banner */}
          <div className="relative">
            <div className="absolute top-4 left-4 bg-[#10b981] text-white px-3 py-1 text-sm font-bold transform -rotate-45 origin-top-left">
              PAID
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8">
            {/* Header Section */}
            <div className="border-2 border-[#000]">
              <div className="grid grid-cols-2">
                {/* Left - Company Info */}
                <div className="border-r-2 border-[#000] p-4">
                  <h1 className="text-xl font-bold text-[#000] mb-3">Grooms Wedding Hub</h1>
                  <div className="text-sm text-[#000] space-y-1">
                    <div>Kerala</div>
                    <div>INDIA</div>
                    <div>0493</div>
                    <div>GSTIN: 32AEHCR4208L1ZS</div>
                    <div>groomsweddinghub@gmail.com</div>
                  </div>
                </div>

                {/* Right - Invoice Details */}
                <div className="p-4">
                  <div className="text-right mb-4">
                    <h2 className="text-2xl font-bold text-[#000]">TAX INVOICE</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-[#000]">Invoice Date</div>
                    <div className="font-medium">: {formatDate(invoice.invoiceDate)}</div>
                    <div className="text-[#000]">Terms</div>
                    <div className="font-medium">: {invoice.terms}</div>
                    <div className="text-[#000]">Due Date</div>
                    <div className="font-medium">: {formatDate(invoice.dueDate)}</div>
                  </div>
                </div>
              </div>

              {/* Invoice Number Section */}
              <div className="border-t-2 border-[#000] grid grid-cols-2">
                <div className="border-r-2 border-[#000] p-3">
                  <div className="text-sm text-[#000]">
                    <div>Invoice Date: {formatDate(invoice.invoiceDate)}</div>
                    <div>Place Of Supply: Kerala (32)</div>
                    <div>Sales person: {invoice.salesperson || "NIYAS"}</div>
                  </div>
                </div>
                <div className="p-3 text-right">
                  <div className="text-lg font-bold text-[#000]">{invoice.invoiceNumber}</div>
                </div>
              </div>

              {/* Bill To Section */}
              <div className="border-t-2 border-[#000] p-4">
                <div className="text-sm font-semibold text-[#000] mb-2">Bill To</div>
                <div className="text-base font-bold text-[#000]">{invoice.customer}</div>
                {invoice.customerPhone && (
                  <div className="text-sm text-[#000] mt-1">Phone: {invoice.customerPhone}</div>
                )}
              </div>

               {/* Items Table */}
               <div className="border-t-2 border-[#000]">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b-2 border-[#000]">
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">#</th>
                       <th className="border-r border-[#000] px-2 py-2 text-left font-semibold text-[#000]">Item & Description</th>
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">Size</th>
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">HSN/SAC</th>
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">Qty</th>
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">Rate</th>
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">CGST</th>
                       <th className="border-r border-[#000] px-2 py-2 text-center font-semibold text-[#000]">SGST</th>
                       <th className="px-2 py-2 text-center font-semibold text-[#000]">Amount</th>
                     </tr>
                   </thead>
                   <tbody>
                     {invoice.lineItems?.map((item, index) => {
                       // Get real data from itemData or use defaults
                       const itemData = item.itemData || {};
                       const hsnCode = itemData.hsnCode || itemData.hsn || "61051010";
                       const cgstPercent = parseFloat(item.cgstPercent || 0);
                       const sgstPercent = parseFloat(item.sgstPercent || 0);
                       const cgstAmount = parseFloat(item.cgstAmount || 0);
                       const sgstAmount = parseFloat(item.sgstAmount || 0);
                       const baseAmount = parseFloat(item.baseAmount || item.amount || 0);
                       
                       return (
                         <tr key={index} className="border-b border-[#000]">
                           <td className="border-r border-[#000] px-2 py-2 text-center text-[#000]">{index + 1}</td>
                           <td className="border-r border-[#000] px-2 py-2 text-[#000]">
                             <div className="font-medium">{item.item || itemData.itemName}</div>
                             {itemData.description && (
                               <div className="text-xs text-[#666] mt-1">{itemData.description}</div>
                             )}
                           </td>
                           <td className="border-r border-[#000] px-2 py-2 text-center text-[#000]">
                             {item.size || itemData.size || "42"}
                           </td>
                           <td className="border-r border-[#000] px-2 py-2 text-center text-[#000]">
                             {hsnCode}
                           </td>
                           <td className="border-r border-[#000] px-2 py-2 text-center font-medium text-[#000]">
                             {parseFloat(item.quantity || 0).toFixed(2)}<br/>
                             <span className="text-xs">pcs</span>
                           </td>
                           <td className="border-r border-[#000] px-2 py-2 text-right font-medium text-[#000]">
                             {parseFloat(item.rate || 0).toLocaleString('en-IN', {
                               minimumFractionDigits: 2,
                               maximumFractionDigits: 2
                             })}
                           </td>
                           <td className="border-r border-[#000] px-2 py-2 text-center text-[#000]">
                             <div>{cgstPercent > 0 ? cgstPercent.toFixed(1) : '2.5'}%</div>
                             <div className="font-medium">{cgstAmount > 0 ? cgstAmount.toFixed(2) : (baseAmount * 0.025).toFixed(2)}</div>
                           </td>
                           <td className="border-r border-[#000] px-2 py-2 text-center text-[#000]">
                             <div>{sgstPercent > 0 ? sgstPercent.toFixed(1) : '2.5'}%</div>
                             <div className="font-medium">{sgstAmount > 0 ? sgstAmount.toFixed(2) : (baseAmount * 0.025).toFixed(2)}</div>
                           </td>
                           <td className="px-2 py-2 text-right font-bold text-[#000]">
                             {baseAmount.toLocaleString('en-IN', {
                               minimumFractionDigits: 2,
                               maximumFractionDigits: 2
                             })}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>

              {/* Totals Section */}
              <div className="border-t-2 border-[#000] grid grid-cols-2">
                {/* Left - Notes */}
                <div className="border-r-2 border-[#000] p-4">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-[#000] mb-2">Total in Words</div>
                    <div className="text-sm text-[#000] italic">
                      Rupees One Thousand One Hundred Only
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-semibold text-[#000] mb-2">Notes</div>
                    <div className="text-sm text-[#000]">
                      {invoice.customerNotes || "Thanks for your business."}
                    </div>
                  </div>
                </div>

                {/* Right - Calculations */}
                <div className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#000]">Sub Total</span>
                      <span className="font-medium text-[#000]">{parseFloat(invoice.subTotal || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-[#000]">CGST @ 2.5%</span>
                      <span className="font-medium text-[#000]">{(parseFloat(invoice.subTotal || 0) * 0.025).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-[#000]">SGST @ 2.5%</span>
                      <span className="font-medium text-[#000]">{(parseFloat(invoice.subTotal || 0) * 0.025).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold border-t border-[#000] pt-2">
                      <span className="text-[#000]">Total</span>
                      <span className="text-[#000]">₹{parseFloat(invoice.finalTotal || 0).toFixed(2)}</span>
                    </div>
                    
                    {invoice.tdsTcsAmount > 0 && (
                      <div className="flex justify-between text-[#ef4444]">
                        <span>Payment Made</span>
                        <span>(-) ₹{parseFloat(invoice.tdsTcsAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-bold">
                      <span className="text-[#000]">Balance Due</span>
                      <span className="text-[#000]">₹0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="border-t-2 border-[#000] col-span-2 p-4 text-right">
                <div className="text-sm font-semibold text-[#000] mb-8">Authorised Signature</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Section */}
        <div className="mt-8 bg-white rounded-lg border border-[#e5e7eb] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1f2937]">More Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <div className="mb-4">
                <span className="text-[#6b7280]">Salesperson:</span>
                <span className="ml-2 font-medium text-[#1f2937]">{invoice.salesperson || "NIYAS"}</span>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <span className="text-[#6b7280]">Journal:</span>
                <span className="ml-2 font-medium text-[#1f2937]">
                  Amount is displayed in your base currency 
                  <span className="inline-flex items-center ml-2 px-2 py-1 bg-[#d1fae5] text-[#065f46] text-xs rounded">
                    ✓
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Journal Entries Table */}
          <div className="mt-6">
            <h4 className="text-base font-semibold text-[#1f2937] mb-4">Invoice</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                  <tr className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">ACCOUNT</th>
                    <th className="px-4 py-3 text-center">BRANCH</th>
                    <th className="px-4 py-3 text-right">DEBIT</th>
                    <th className="px-4 py-3 text-right">CREDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  <tr>
                    <td className="px-4 py-3 text-[#2563eb] hover:underline cursor-pointer">Accounts Receivable</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{invoice.branch}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.finalTotal)}</td>
                    <td className="px-4 py-3 text-right">0.00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#2563eb] hover:underline cursor-pointer">Output SGST</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{invoice.branch}</td>
                    <td className="px-4 py-3 text-right">0.00</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.subTotal * 0.025)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#2563eb] hover:underline cursor-pointer">Output CGST</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{invoice.branch}</td>
                    <td className="px-4 py-3 text-right">0.00</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.subTotal * 0.025)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#2563eb] hover:underline cursor-pointer">Sales</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{invoice.branch}</td>
                    <td className="px-4 py-3 text-right">0.00</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.subTotal)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#2563eb] hover:underline cursor-pointer">Inventory Asset</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{invoice.branch}</td>
                    <td className="px-4 py-3 text-right">0.00</td>
                    <td className="px-4 py-3 text-right font-medium">575.00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#2563eb] hover:underline cursor-pointer">Cost of Goods Sold</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{invoice.branch}</td>
                    <td className="px-4 py-3 text-right font-medium">575.00</td>
                    <td className="px-4 py-3 text-right">0.00</td>
                  </tr>
                  <tr className="border-t-2 border-[#e5e7eb] font-semibold">
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-center">Total</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(invoice.finalTotal + 575)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(invoice.finalTotal + 575)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
         </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceDetail;
