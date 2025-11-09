import { Link } from "react-router-dom";
import { UploadCloud, ArrowLeft } from "lucide-react";
import Head from "../components/Head";

const ShoeSalesItemCreate = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="New Item"
        description="Capture product details for sales, purchasing, and inventory tracking."
        actions={
          <Link
            to="/shoe-sales/items"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to Items
          </Link>
        }
      />

      <div className="space-y-6">
        <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
          <div className="grid gap-8 border-b border-[#e7ebf8] px-8 py-8 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                  Type
                </legend>
                <div className="flex flex-wrap gap-4 text-sm font-medium text-[#1f2937]">
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                    <input type="radio" name="type" defaultChecked className="text-[#4285f4]" />
                    Goods
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                    <input type="radio" name="type" className="text-[#4285f4]" />
                    Service
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-6 sm:grid-cols-2">
                <FloatingField label="Item Name*" placeholder="Enter item name" required />
                <FloatingField label="SKU" placeholder="e.g. KSB-36" />
                <FloatingSelect label="Unit*" placeholder="Select or type to add" />
                <FloatingSelect label="HSN Code" placeholder="Enter HSN" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FloatingSelect label="Manufacturer" placeholder="Select or add manufacturer" />
                <FloatingSelect label="Brand" placeholder="Select or add brand" />
                <FloatingCheckbox label="Returnable Item" defaultChecked />
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4444]">
                    Tax Preference*
                  </legend>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-[#1f2937]">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="tax" defaultChecked className="text-[#4285f4]" />
                      Taxable
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="tax" className="text-[#4285f4]" />
                      Non-Taxable
                    </label>
                  </div>
                </fieldset>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FloatingField label="Dimensions" placeholder="Length × Width × Height" hint="cm" />
                <FloatingField label="Weight" placeholder="Add weight" hint="kg" />
                <FloatingField label="UPC" placeholder="Enter UPC" />
                <FloatingField label="MPN" placeholder="Enter MPN" />
                <FloatingField label="EAN" placeholder="Enter EAN" />
                <FloatingField label="ISBN" placeholder="Enter ISBN" />
                <FloatingField label="Size" placeholder="Select size" />
                <FloatingSelect label="Inventory Valuation Method" placeholder="FIFO (First In First Out)" />
              </div>
            </div>

            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
              <UploadCloud size={36} className="mb-3 text-[#94a3b8]" />
              <p className="text-sm font-medium">Drag image(s) here or browse images</p>
              <p className="mt-2 text-xs leading-5">
                You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
              </p>
              <button className="mt-4 rounded-full border border-[#cbd5f5] px-4 py-2 text-sm font-medium text-[#3762f9] hover:bg-[#eef2ff]">
                Upload
              </button>
            </div>
          </div>

          <div className="space-y-8 px-8 py-8">
            <section className="grid gap-6 md:grid-cols-2">
              <InfoCard title="Sales Information">
                <FloatingCheckbox label="Sellable" defaultChecked />
                <FloatingField label="Selling Price" placeholder="0.00" prefix="INR" />
                <FloatingSelect label="Sales Account" placeholder="Select account" />
                <FloatingTextArea label="Description" placeholder="Optional description" />
              </InfoCard>
              <InfoCard title="Purchase Information">
                <FloatingCheckbox label="Purchasable" defaultChecked />
                <FloatingField label="Cost Price" placeholder="0.00" prefix="INR" />
                <FloatingSelect label="Cost Account" placeholder="Cost of Goods Sold" />
                <FloatingSelect label="Preferred Vendor" placeholder="Select vendor" />
                <FloatingTextArea label="Description" placeholder="Optional description" />
              </InfoCard>
            </section>

            <InfoCard title="Inventory & Tracking" fullWidth>
              <div className="grid gap-4 md:grid-cols-2">
                <FloatingSelect label="Default Tax Rate (Intra-state)" placeholder="CGST 9% + SGST 9%" />
                <FloatingSelect label="Default Tax Rate (Inter-state)" placeholder="IGST 18%" />
              </div>
              <div className="mt-4 space-y-4 rounded-2xl border border-[#e3e8f9] bg-[#f7f9ff] p-6">
                <FloatingCheckbox label="Track inventory for this item" defaultChecked />
                <FloatingCheckbox label="Track bin location for this item" />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#1f2937]">Advanced Inventory Tracking</p>
                  <div className="flex flex-wrap gap-4">
                    <FloatingRadio name="tracking" label="None" defaultChecked />
                    <FloatingRadio name="tracking" label="Track Serial Number" />
                    <FloatingRadio name="tracking" label="Track Batches" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FloatingSelect label="Inventory Account" placeholder="Select an account" />
                    <FloatingSelect label="Inventory Valuation Method" placeholder="Select valuation method" />
                  </div>
                  <FloatingField label="Reorder Point" placeholder="Enter quantity" />
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-[#d7dcf5] bg-[#f5f7ff] px-4 py-3 text-sm text-[#475569]">
                <strong className="font-semibold text-[#1f2937]">Note:</strong> You can add opening stock on the item details page by clicking the gear icon under Warehouses.
              </div>
            </InfoCard>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">
                + Configure Accounts
              </button>
              <div className="flex items-center gap-3">
                <Link
                  to="/shoe-sales/items"
                  className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
                >
                  Cancel
                </Link>
                <button className="rounded-md bg-[#3762f9] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9]">
                  Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoeSalesItemCreate;

const FloatingField = ({ label, placeholder, required = false, inputType = "input", hint, prefix }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
      {label}
      {required && <span className="text-[#ef4444]"> *</span>}
    </span>
    {inputType === "textarea" ? (
      <textarea
        placeholder={placeholder}
        rows={3}
        className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:border-[#4285f4] focus:outline-none"
      />
    ) : inputType === "select" ? (
      <select className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none">
        <option>{placeholder}</option>
      </select>
    ) : (
      <div className="flex items-center rounded-lg border border-[#d7dcf5] focus-within:border-[#4285f4]">
        {prefix && <span className="pl-3 text-xs font-semibold uppercase text-[#64748b]">{prefix}</span>}
        <input
          type="text"
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:outline-none"
        />
        {hint && <span className="pr-3 text-xs text-[#94a3b8]">{hint}</span>}
      </div>
    )}
  </label>
);

const FloatingSelect = ({ label, placeholder }) => (
  <FloatingField label={label} placeholder={placeholder} inputType="select" />
);

const FloatingTextArea = ({ label, placeholder }) => (
  <FloatingField label={label} placeholder={placeholder} inputType="textarea" />
);

const FloatingCheckbox = ({ label, defaultChecked = false }) => (
  <label className="inline-flex items-center gap-3 rounded-lg border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4]"
    />
    {label}
  </label>
);

const FloatingRadio = ({ name, label, defaultChecked = false }) => (
  <label className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="radio"
      name={name}
      defaultChecked={defaultChecked}
      className="text-[#4285f4] focus:ring-[#4285f4]"
    />
    {label}
  </label>
);

const InfoCard = ({ title, children, fullWidth }) => (
  <div
    className={`rounded-2xl border border-[#dbe4ff] bg-[#f7f9ff] p-6 shadow-sm ${
      fullWidth ? "space-y-4" : "space-y-4"
    }`}
  >
    <h3 className="text-sm font-semibold text-[#1f2937]">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

