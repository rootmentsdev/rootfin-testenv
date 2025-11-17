import { Link } from "react-router-dom";
import Head from "../components/Head";

const Label = ({ children }) => (
  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{children}</span>
);

const Input = ({ placeholder = "", ...props }) => (
  <input
    {...props}
    className="w-full rounded-md border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
    placeholder={placeholder}
  />
);

const Select = (props) => (
  <select
    {...props}
    className="w-full rounded-md border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none"
  />
);

const PurchaseOrderCreate = () => {
  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <Head
        title="New Purchase Order"
        description=""
        actions={
          <Link
            to="/purchase/orders"
            className="rounded-md border border-[#d7dcf5] px-4 py-1.5 text-sm font-medium text-[#475569] hover:bg-white"
          >
            Close
          </Link>
        }
      />

      <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
        <div className="px-8 py-8 space-y-8">
          {/* Header form block - exact two column positioning */}
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Vendor + Branch */}
              <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                <div className="space-y-1">
                  <Label>Vendor Name</Label>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="">
                      <option value="">Select a Vendor</option>
                    </Select>
                    <button className="rounded-md bg-[#3b82f6] px-3 py-2 text-xs font-semibold text-white">Search</button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Branch</Label>
                  <Select defaultValue="Head Office">
                    <option>Head Office</option>
                  </Select>
                </div>
              </div>

              {/* Delivery Address */}
              <Label>Vendor Name</Label>
              <div className="space-y-1">
                <Label>Delivery Address</Label>
                <div className="flex items-center gap-6 text-sm text-[#475569]">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="deliveryTo" defaultChecked className="text-[#2563eb]" />
                    Warehouses
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="deliveryTo" className="text-[#2563eb]" />
                    Customer
                  </label>
                </div>
                <div className="rounded-lg border border-[#d7dcf5] p-3 text-sm text-[#1f2937]">
                  Kerala, India
                </div>
                <button type="button" className="text-xs font-medium text-[#2563eb]">
                  Change destination to deliver
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              <Label>Delivery Address</Label>
              <div className="space-y-1">
                <Label>Purchase Order#</Label>
                <Input placeholder="PO-00001" />
              </div>
              <div className="space-y-1">
                <Label>Reference</Label>
                <Input />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input placeholder="dd/MM/yyyy" />
              </div>
              <div className="space-y-1">
                <Label>Delivery Date</Label>
                <Input placeholder="dd/MM/yyyy" />
              </div>
              <div className="space-y-1">
                <Label>Payment Terms</Label>
                <Select>
                  <option>Due on Receipt</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Shipment Preference</Label>
                <Select>
                  <option>Choose shipment preference</option>
                </Select>
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[#475569]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#cbd5f5] text-[#2563eb]" />
                  This transaction is applicable for reverse charge
                </label>
              </div>
            </div>
          </div>

          {/* Warehouse + Item table */}
          <div className="mt-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Select className="w-48">
                  <option>Warehouse</option>
                </Select>
                <Select className="w-56">
                  <option>Select a warehouse</option>
                </Select>
                <Select className="w-40">
                  <option>At Transaction Level</option>
                </Select>
              </div>
              <button className="text-xs font-medium text-[#2563eb]">Bulk Actions</button>
            </div>

            <div className="mt-3 overflow-x-auto rounded-xl border border-[#e6eafb]">
              <table className="min-w-full divide-y divide-[#e6eafb]">
                <thead className="bg-[#f5f6ff]">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    <th className="px-3 py-2 w-[240px]">Item Details</th>
                    <th className="px-3 py-2 w-[160px]">Account</th>
                    <th className="px-3 py-2 w-[80px]">Size</th>
                    <th className="px-3 py-2 w-[90px]">Quantity</th>
                    <th className="px-3 py-2 w-[90px]">Rate</th>
                    <th className="px-3 py-2 w-[120px]">Tax</th>
                    <th className="px-3 py-2 w-[100px] text-right">Amount</th>
                    <th className="px-3 py-2 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2ff] text-sm">
                  <tr>
                    <td className="px-3 py-2">
                      <Input placeholder="Type or click to select an item" />
                    </td>
                    <td className="px-3 py-2">
                      <Select defaultValue="">
                        <option value="">Select an account</option>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input placeholder="" />
                    </td>
                    <td className="px-3 py-2">
                      <Input defaultValue="1.00" />
                    </td>
                    <td className="px-3 py-2">
                      <Input defaultValue="0.00" />
                    </td>
                    <td className="px-3 py-2">
                      <Select defaultValue="">
                        <option value="">Select a Tax</option>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right">0.00</td>
                    <td className="px-3 py-2 text-right">
                      <button className="text-xs text-[#ef4444]">x</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button className="rounded-md border border-[#d7dcf5] px-3 py-1.5 text-xs font-medium text-[#2563eb] hover:bg-[#eef2ff]">
                + Add New Row
              </button>
              <button className="rounded-md border border-[#d7dcf5] px-3 py-1.5 text-xs font-medium text-[#2563eb] hover:bg-[#eef2ff]">
                + Add Items in Bulk
              </button>
            </div>
          </div>

          {/* Totals section */}
          <div className="grid gap-6 md:grid-cols-[1fr,320px]">
            <div className="space-y-3">
              <Label>Customer Notes</Label>
              <textarea className="h-20 w-full rounded-md border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none" placeholder="Will be displayed on purchase order" />

              <Label>Terms & Conditions</Label>
              <textarea className="h-20 w-full rounded-md border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none" placeholder="Enter the terms and conditions..." />
            </div>
            <div>
              <div className="rounded-xl border border-[#e6eafb] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">Sub Total</span>
                  <span className="text-[#0f172a]">0.00</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#64748b]">Discount</span>
                    <div className="flex items-center gap-2">
                      <Input className="w-24" defaultValue="0" />
                      <Select className="w-20">
                        <option>%</option>
                        <option>₹</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#64748b]">Tax</span>
                    <Select className="w-40">
                      <option>Select a Tax</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#64748b]">Adjustment</span>
                    <Input className="w-40" placeholder="Adjustment" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#eef2ff] pt-3 text-sm font-semibold">
                  <span className="text-[#0f172a]">Total</span>
                  <span className="text-[#0f172a]">0.00</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#e6eafb] p-4">
                <div className="text-sm font-medium text-[#475569]">Attach Files to Purchase Order</div>
                <div className="mt-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#cbd5f5] bg-white px-3 py-1.5 text-sm font-medium text-[#1f2937] hover:bg-[#eef2ff]">
                    <input type="file" className="hidden" />
                    Upload File
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-[#94a3b8]">You can upload a maximum of 10 files, 10MB each</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[#e7ebf8] px-8 py-4">
          <button className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-white">
            Save as Draft
          </button>
          <button className="rounded-md bg-[#3762f9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2748c9]">
            Save and Send
          </button>
          <Link
            to="/purchase/orders"
            className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-white"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderCreate;


