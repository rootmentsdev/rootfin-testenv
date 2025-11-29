import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Head from "../components/Head";
import { X, Mail, Phone, MapPin, Building2, FileText, CreditCard, MessageSquare, FileSpreadsheet, Mail as MailIcon } from "lucide-react";
import baseUrl from "../api/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

const PurchaseVendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
        
        // First, try to fetch from API
        let foundVendor = null;
        
        try {
          const response = await fetch(`${API_URL}/api/purchase/vendors/${id}`);
          if (response.ok) {
            foundVendor = await response.json();
          }
        } catch (apiError) {
          console.warn("API fetch failed, trying localStorage:", apiError);
        }
        
        // If not found in API, try localStorage
        if (!foundVendor) {
          const vendors = JSON.parse(localStorage.getItem("vendors") || "[]");
          foundVendor = vendors.find((v) => 
            v.id === id || 
            v._id === id || 
            (v.id && String(v.id) === String(id)) ||
            (v._id && String(v._id) === String(id))
          );
        }
        
        if (foundVendor) {
          // Ensure vendor has an id field
          const vendorWithId = {
            ...foundVendor,
            id: foundVendor.id || foundVendor._id || id,
          };
          setVendor(vendorWithId);
          // Load comments for this vendor
          const vendorComments = JSON.parse(localStorage.getItem(`vendor_comments_${id}`) || "[]");
          setComments(vendorComments);
        } else {
          // If not found, redirect to vendors list
          navigate("/purchase/vendors");
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
        navigate("/purchase/vendors");
      }
    };
    
    fetchVendor();
  }, [id, navigate]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    const newComment = {
      id: `comment_${Date.now()}`,
      text: commentText,
      createdAt: new Date().toISOString(),
      createdBy: JSON.parse(localStorage.getItem("rootfinuser") || "{}")?.name || "User",
    };
    
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    localStorage.setItem(`vendor_comments_${id}`, JSON.stringify(updatedComments));
    setCommentText("");
  };

  const applyFormatting = (format) => {
    const textarea = document.getElementById("comment-textarea");
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = commentText.substring(start, end);
    
    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "underline":
        formattedText = `__${selectedText}__`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newText = commentText.substring(0, start) + formattedText + commentText.substring(end);
    setCommentText(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  if (!vendor) {
    return (
      <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  const tabs = ["Overview", "Comments", "Transactions", "Mails", "Statement"];

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
        {/* Header */}
        <div className="border-b border-[#e7ebf8] px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#1f2937]">{vendor.displayName || vendor.companyName || vendor.firstName + " " + vendor.lastName}</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`/purchase/vendors/${id}/edit`)}
                className="rounded-md border border-[#d7dcf5] px-4 py-2 text-base font-medium text-[#475569] transition hover:bg-[#f8f9ff]"
              >
                Edit
              </button>
              <div className="rounded-md border border-[#d7dcf5] px-3 py-2 text-base font-medium text-[#475569]">
                9
              </div>
              <button className="rounded-md bg-[#3762f9] px-4 py-2 text-base font-semibold text-white transition hover:bg-[#2748c9]">
                New Transaction
              </button>
              <button className="rounded-md border border-[#d7dcf5] px-4 py-2 text-base font-medium text-[#475569] transition hover:bg-[#f8f9ff]">
                More
              </button>
              <Link
                to="/purchase/vendors"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#64748b] hover:bg-[#f8f9ff]"
              >
                <X size={20} />
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-6 border-b border-[#e7ebf8]">
            {tabs.map((tab) => (
              <span
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-base font-medium cursor-pointer transition ${
                  activeTab === tab
                    ? "border-b-2 border-[#2563eb] text-[#2563eb]"
                    : "text-[#64748b] hover:text-[#1f2937]"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "Overview" && (
          <div className="px-8 py-6">
            <div className="grid gap-8 md:grid-cols-[1fr_400px]">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-[#e0e7ff] flex items-center justify-center">
                      <Building2 size={24} className="text-[#6366f1]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1f2937]">{vendor.displayName || vendor.companyName || vendor.firstName + " " + vendor.lastName}</h3>
                  </div>
                  <div className="space-y-2 text-base text-[#475569]">
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-[#94a3b8]" />
                        <span>{vendor.email}</span>
                      </div>
                    )}
                    {(vendor.phone || vendor.mobile) && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-[#94a3b8]" />
                        <span>{vendor.phone || vendor.mobile}</span>
                        {vendor.phone && vendor.mobile && vendor.phone !== vendor.mobile && (
                          <span className="text-[#94a3b8]">, {vendor.mobile}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-4 mt-3">
                      <span className="text-sm font-medium text-[#2563eb] hover:underline cursor-pointer">
                        Invite to Portal
                      </span>
                      <span className="text-sm font-medium text-[#2563eb] hover:underline cursor-pointer">
                        Send Email
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">ADDRESS</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#64748b] mb-2">Billing Address</p>
                      <div className="text-base text-[#475569] space-y-1">
                        {vendor.billingAddress ? (
                          <>
                            <p>{vendor.billingAddress}</p>
                            {vendor.billingCity && <p>{vendor.billingCity}</p>}
                            {vendor.billingState && <p>{vendor.billingState}</p>}
                            {vendor.billingPinCode && <p>{vendor.billingPinCode}</p>}
                            {vendor.billingCountry && <p>{vendor.billingCountry}</p>}
                            {vendor.billingPhone && <p className="mt-2">Phone: {vendor.billingPhone}</p>}
                          </>
                        ) : (
                          <p className="text-[#94a3b8]">No billing address</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#64748b] mb-2">Shipping Address</p>
                      <div className="text-base text-[#475569]">
                        {vendor.shippingAddress ? (
                          <>
                            <p>{vendor.shippingAddress}</p>
                            {vendor.shippingCity && <p>{vendor.shippingCity}</p>}
                            {vendor.shippingState && <p>{vendor.shippingState}</p>}
                            {vendor.shippingPinCode && <p>{vendor.shippingPinCode}</p>}
                            {vendor.shippingCountry && <p>{vendor.shippingCountry}</p>}
                            {vendor.shippingPhone && <p className="mt-2">Phone: {vendor.shippingPhone}</p>}
                          </>
                        ) : (
                          <>
                            <p className="text-[#94a3b8] mb-2">No Shipping Address</p>
                            <button className="text-sm font-medium text-[#2563eb] hover:underline">New Address</button>
                            <span className="mx-2 text-[#94a3b8]">|</span>
                            <button className="text-sm font-medium text-[#2563eb] hover:underline">Add additional address</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Details */}
                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">OTHER DETAILS</h4>
                  <div className="space-y-3 text-base">
                    {vendor.currency && (
                      <div>
                        <span className="text-[#64748b]">Default Currency: </span>
                        <span className="text-[#1f2937]">{vendor.currency}</span>
                      </div>
                    )}
                    {vendor.gstTreatment && (
                      <div>
                        <span className="text-[#64748b]">GST Treatment: </span>
                        <span className="text-[#1f2937]">{vendor.gstTreatment}</span>
                      </div>
                    )}
                    {vendor.gstin && (
                      <div>
                        <span className="text-[#64748b]">GSTIN: </span>
                        <span className="text-[#1f2937]">{vendor.gstin}</span>
                      </div>
                    )}
                    {vendor.sourceOfSupply && (
                      <div>
                        <span className="text-[#64748b]">Source of Supply: </span>
                        <span className="text-[#1f2937]">{vendor.sourceOfSupply}</span>
                      </div>
                    )}
                    {vendor.pan && (
                      <div>
                        <span className="text-[#64748b]">PAN: </span>
                        <span className="text-[#1f2937]">{vendor.pan}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#64748b]">Portal Status: </span>
                      <span className="text-[#ef4444]">Disabled</span>
                    </div>
                    {vendor.vendorLanguage && (
                      <div>
                        <span className="text-[#64748b]">Vendor Language: </span>
                        <span className="text-[#1f2937]">{vendor.vendorLanguage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Information */}
                {vendor.gstin && (
                  <div>
                    <h4 className="text-base font-semibold text-[#1f2937] mb-3">TAX INFORMATION</h4>
                    <div className="space-y-2 text-base">
                      <div>
                        <span className="text-[#64748b]">GSTIN/UIN: </span>
                        <span className="text-[#1f2937]">{vendor.gstin} (Primary)</span>
                      </div>
                      {vendor.sourceOfSupply && (
                        <div>
                          <span className="text-[#64748b]">Source of Supply: </span>
                          <span className="text-[#1f2937]">{vendor.sourceOfSupply}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Persons */}
                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">CONTACT PERSONS</h4>
                  {vendor.contacts && vendor.contacts.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[#e6eafb]">
                      <table className="min-w-full divide-y divide-[#e6eafb]">
                        <thead className="bg-[#f5f6ff]">
                          <tr className="text-left text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                            <th className="px-4 py-2">Salutation</th>
                            <th className="px-4 py-2">First Name</th>
                            <th className="px-4 py-2">Last Name</th>
                            <th className="px-4 py-2">Email Address</th>
                            <th className="px-4 py-2">Work Phone</th>
                            <th className="px-4 py-2">Mobile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef2ff] text-base">
                          {vendor.contacts.map((contact, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2">{contact.salutation || "-"}</td>
                              <td className="px-4 py-2">{contact.firstName || "-"}</td>
                              <td className="px-4 py-2">{contact.lastName || "-"}</td>
                              <td className="px-4 py-2">{contact.email || "-"}</td>
                              <td className="px-4 py-2">{contact.workPhone || "-"}</td>
                              <td className="px-4 py-2">{contact.mobile || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-base text-[#64748b] mb-3">No contact persons added</div>
                  )}
                  <button className="text-base font-medium text-[#2563eb] hover:underline">
                    + Add Contact Person
                  </button>
                </div>

                {/* Bank Account Details */}
                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">BANK ACCOUNT DETAILS</h4>
                  {vendor.bankAccounts && vendor.bankAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {vendor.bankAccounts.map((bank, idx) => (
                        <div key={idx} className="border border-[#e6eafb] rounded-lg p-4">
                          <div className="space-y-2 text-base">
                            <div>
                              <span className="text-[#64748b]">Account Holder Name: </span>
                              <span className="text-[#1f2937]">{bank.accountHolderName}</span>
                            </div>
                            <div>
                              <span className="text-[#64748b]">Bank Name: </span>
                              <span className="text-[#1f2937]">{bank.bankName}</span>
                            </div>
                            <div>
                              <span className="text-[#64748b]">Account Number: </span>
                              <span className="text-[#1f2937]">{bank.accountNumber}</span>
                            </div>
                            {bank.ifsc && (
                              <div>
                                <span className="text-[#64748b]">IFSC: </span>
                                <span className="text-[#1f2937]">{bank.ifsc}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-base text-[#64748b] mb-3">No bank account added yet</div>
                  )}
                  <button className="text-base font-medium text-[#2563eb] hover:underline">
                    + Add New Bank
                  </button>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="text-sm text-[#64748b]">
                  You can request your contact to directly update the GSTIN by sending an email.{" "}
                  <button className="text-[#2563eb] hover:underline">Send email</button>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">Payment Due Period</h4>
                  <p className="text-base text-[#475569]">{vendor.paymentTerms || "Due On Receipt"}</p>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">Payables</h4>
                  <div className="overflow-x-auto rounded-xl border border-[#e6eafb]">
                    <table className="min-w-full divide-y divide-[#e6eafb]">
                      <thead className="bg-[#f5f6ff]">
                        <tr className="text-left text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          <th className="px-4 py-2">CURRENCY</th>
                          <th className="px-4 py-2 text-right">OUTSTANDING PAYABLES</th>
                          <th className="px-4 py-2 text-right">UNUSED CREDITS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eef2ff] text-base">
                        <tr>
                          <td className="px-4 py-2">{vendor.currency || "INR"} Indian Rupee</td>
                          <td className="px-4 py-2 text-right font-semibold">{currency(vendor.payables || 0)}</td>
                          <td className="px-4 py-2 text-right">{currency(vendor.credits || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-sm text-[#64748b]">
                    <p>Items to be received: {vendor.itemsToReceive || 0}</p>
                    <p>Total items ordered: {vendor.totalItemsOrdered || 0}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#1f2937] mb-3">Activity</h4>
                  <div className="space-y-4">
                    {vendor.activities && vendor.activities.length > 0 ? (
                      vendor.activities.map((activity, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-[#2563eb]"></div>
                            {idx < vendor.activities.length - 1 && (
                              <div className="w-0.5 h-full bg-[#e2e8f0] mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium text-[#64748b]">{activity.date}</p>
                            <p className="text-base text-[#1f2937] mt-1">{activity.title}</p>
                            <p className="text-sm text-[#64748b] mt-1">{activity.description}</p>
                            {activity.link && (
                              <button className="text-sm text-[#2563eb] hover:underline mt-1">
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-base text-[#64748b]">No recent activity</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Comments" && (
          <div className="px-8 py-6">
            {/* Comment Input Section */}
            <div className="mb-8">
              {/* Formatting Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => applyFormatting("bold")}
                  className="px-3 py-1.5 rounded border border-[#d7dcf5] bg-white text-sm font-bold text-[#1f2937] hover:bg-[#f8f9ff] transition"
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => applyFormatting("italic")}
                  className="px-3 py-1.5 rounded border border-[#d7dcf5] bg-white text-sm italic text-[#1f2937] hover:bg-[#f8f9ff] transition"
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => applyFormatting("underline")}
                  className="px-3 py-1.5 rounded border border-[#d7dcf5] bg-white text-sm underline text-[#1f2937] hover:bg-[#f8f9ff] transition"
                  title="Underline"
                >
                  U
                </button>
              </div>
              
              {/* Text Area */}
              <textarea
                id="comment-textarea"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full min-h-[120px] rounded-lg border border-[#d7dcf5] px-3 py-2.5 text-base text-[#1f2937] focus:border-[#4285f4] focus:outline-none resize-y"
              />
              
              {/* Add Comment Button */}
              <div className="mt-3">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 rounded-md bg-[#e5e7eb] text-base font-medium text-[#6b7280] hover:bg-[#d1d5db] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Comment
                </button>
              </div>
            </div>

            {/* All Comments Section */}
            <div>
              <h3 className="text-base font-semibold text-[#1f2937] mb-4">ALL COMMENTS</h3>
              {comments.length === 0 ? (
                <div className="text-base text-[#64748b] py-8">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-[#e7ebf8] pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-base text-[#1f2937] whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#64748b]">
                        {comment.createdBy} • {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab !== "Overview" && activeTab !== "Comments" && (
          <div className="px-8 py-6">
            <div className="text-center text-base text-[#64748b] py-12">
              {activeTab} content coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseVendorDetail;

