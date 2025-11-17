import { useState } from "react";
import Head from "../components/Head";
import { Link } from "react-router-dom";

const Input = ({ label, placeholder = "", hint, type = "text", right, ...props }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span>
    <div className="flex items-center rounded-lg border border-[#d7dcf5] focus-within:border-[#4285f4]">
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:outline-none"
        {...props}
      />
      {right}
    </div>
    {hint && <span className="text-xs text-[#94a3b8]">{hint}</span>}
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span>
    <select
      className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
      {...props}
    >
      {children}
    </select>
  </label>
);

const TABS = ["Other Details", "Address", "Contact Persons", "Bank Details", "Custom Fields", "Reporting Tags", "Remarks"];

const PurchaseVendorCreate = () => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Other Details");
  const [contacts, setContacts] = useState([{ id: Date.now(), salutation: "", firstName: "", lastName: "", email: "", workPhone: "", mobile: "" }]);
  const save = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <Head
        title="New Vendor"
        description=""
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/purchase/vendors"
              className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
            >
              Back
            </Link>
          </div>
        }
      />

      <form onSubmit={save} className="space-y-6">
        <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
          <div className="px-8 py-8">
            {/* Primary details */}
            <div className="grid gap-4 md:grid-cols-3">
              <Select label="Primary Contact">
                <option>Salutation</option>
              </Select>
              <Input label="First Name" />
              <Input label="Last Name" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="Company Name" />
              <Input label="Display Name" placeholder="Select or type to add" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input label="Email Address" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Phone" />
                <Input label="Mobile" />
              </div>
              <Select label="Vendor Language">
                <option>English</option>
              </Select>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-[#e7ebf8]">
              <div className="flex flex-wrap gap-6 text-sm">
                {TABS.map((tab) => (
                  <span
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer select-none px-1 pb-2 transition ${
                      activeTab === tab
                        ? "border-b-2 border-[#2563eb] font-medium text-[#2563eb]"
                        : "text-[#64748b] hover:text-[#1f2937]"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "Other Details" && (
              <div className="mt-6 grid gap-5 md:grid-cols-[280px_1fr]">
                <div className="space-y-5">
                  <Select label="GST Treatment">
                    <option>Select a GST treatment</option>
                  </Select>
                  <Select label="Source of Supply">
                    <option>Please select</option>
                  </Select>
                  <Input label="PAN" />
                  <label className="mt-2 inline-flex items-center gap-2 text-sm text-[#1f2937]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#cbd5f5] text-[#2563eb] focus:ring-[#2563eb]" />
                    This vendor is MSME registered
                  </label>
                  <Select label="Currency">
                    <option>INR- Indian Rupee</option>
                  </Select>
                  <Select label="Payment Terms">
                    <option>Due on Receipt</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                  </Select>
                  <Select label="TDS">
                    <option>—</option>
                  </Select>
                  <label className="inline-flex items-center gap-2 text-sm text-[#1f2937]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#cbd5f5] text-[#2563eb] focus:ring-[#2563eb]" />
                    Enable Portal?
                  </label>
                </div>

                {/* Documents UI */}
                <div className="rounded-2xl border border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-6">
                  <p className="text-sm font-medium text-[#475569]">Documents</p>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#cbd5f5] bg-white px-3 py-2 text-sm font-medium text-[#1f2937] hover:bg-[#eef2ff]">
                      <input type="file" className="hidden" />
                      Upload File
                    </label>
                    <span className="text-xs text-[#94a3b8]">You can upload a maximum of 10 files, 10MB each</span>
                  </div>
                  <button type="button" className="mt-3 text-xs font-medium text-[#2563eb] hover:underline">
                    Add more details
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Address" && (
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                {/* Billing Address */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-[#1f2937]">Billing Address</h4>
                  <div className="space-y-3">
                    <Input label="Attention" />
                    <Select label="Country/Region"><option>Select</option></Select>
                    <Input label="Address" placeholder="Street 1" />
                    <Input label="" placeholder="Street 2" />
                    <Input label="City" />
                    <Select label="State"><option>Select or type to add</option></Select>
                    <Input label="Pin Code" />
                    <Input label="Phone" />
                    <Input label="Fax Number" />
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#1f2937]">Shipping Address</h4>
                    <button type="button" className="text-xs font-medium text-[#2563eb] hover:underline">Copy billing address</button>
                  </div>
                  <div className="space-y-3">
                    <Input label="Attention" />
                    <Select label="Country/Region"><option>Select</option></Select>
                    <Input label="Address" placeholder="Street 1" />
                    <Input label="" placeholder="Street 2" />
                    <Input label="City" />
                    <Select label="State"><option>Select or type to add</option></Select>
                    <Input label="Pin Code" />
                    <Input label="Phone" />
                    <Input label="Fax Number" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Contact Persons" && (
              <div className="mt-6">
                <div className="overflow-x-auto rounded-xl border border-[#e6eafb]">
                  <table className="min-w-full divide-y divide-[#e6eafb]">
                    <thead className="bg-[#f5f6ff]">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        <th className="px-4 py-2">Salutation</th>
                        <th className="px-4 py-2">First Name</th>
                        <th className="px-4 py-2">Last Name</th>
                        <th className="px-4 py-2">Email Address</th>
                        <th className="px-4 py-2">Work Phone</th>
                        <th className="px-4 py-2">Mobile</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef2ff] text-sm">
                      {contacts.map((c, idx) => (
                        <tr key={c.id}>
                          <td className="px-4 py-2">
                            <select className="w-full rounded-md border border-[#d7dcf5] px-2 py-1.5 text-sm">
                              <option></option>
                              <option>Mr</option>
                              <option>Ms</option>
                            </select>
                          </td>
                          <td className="px-4 py-2"><input className="w-full rounded-md border border-[#d7dcf5] px-2 py-1.5" /></td>
                          <td className="px-4 py-2"><input className="w-full rounded-md border border-[#d7dcf5] px-2 py-1.5" /></td>
                          <td className="px-4 py-2"><input className="w-full rounded-md border border-[#d7dcf5] px-2 py-1.5" /></td>
                          <td className="px-4 py-2"><input className="w-full rounded-md border border-[#d7dcf5] px-2 py-1.5" /></td>
                          <td className="px-4 py-2"><input className="w-full rounded-md border border-[#d7dcf5] px-2 py-1.5" /></td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="text-xs font-medium text-[#ef4444]"
                              onClick={() => setContacts((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => setContacts((prev) => [...prev, { id: Date.now() }])}
                  className="mt-3 text-sm font-medium text-[#2563eb] hover:underline"
                >
                  + Add Contact Person
                </button>
              </div>
            )}

            {activeTab === "Bank Details" && (
              <div className="mt-6 max-w-xl space-y-4">
                <Input label="Account Holder Name" />
                <Input label="Bank Name" />
                <Input label="Account Number*" />
                <Input label="Re-enter Account Number*" />
                <Input label="IFSC*" />
                <button type="button" className="text-sm font-medium text-[#2563eb] hover:underline">
                  + Add New Bank
                </button>
              </div>
            )}

            {activeTab === "Custom Fields" && (
              <div className="mt-6 text-sm text-[#64748b]">No custom fields configured.</div>
            )}
            {activeTab === "Reporting Tags" && (
              <div className="mt-6 text-sm text-[#64748b]">No reporting tags configured.</div>
            )}
            {activeTab === "Remarks" && (
              <div className="mt-6 max-w-3xl">
                <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Remarks (For Internal Use)
                  </span>
                  <textarea className="min-h-[120px] rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none" />
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#e7ebf8] px-8 py-4">
            <Link
              to="/purchase/vendors"
              className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#3762f9] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseVendorCreate;


