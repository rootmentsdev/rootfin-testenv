import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UploadCloud, ArrowLeft, ChevronDown, Search } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";

const API_ROOT = (baseUrl?.baseUrl || "").replace(/\/$/, "");

const inventoryAccountGroups = [
  {
    group: "Stock",
    options: [
      { label: "Finished Goods", value: "Finished Goods" },
      { label: "Inventory Asset", value: "Inventory Asset" },
      { label: "Work In Progress", value: "Work In Progress" },
    ],
  },
  {
    group: "Expenses",
    options: [
      { label: "Cost of Goods Sold", value: "Cost of Goods Sold" },
      { label: "Inventory Adjustments", value: "Inventory Adjustments" },
    ],
  },
];

const inventoryValuationGroups = [
  {
    group: "Standard Methods",
    options: [
      { label: "FIFO (First In First Out)", value: "FIFO (First In First Out)" },
      { label: "WAC (Weighted Average Costing)", value: "WAC (Weighted Average Costing)" },
      { label: "LIFO (Last In First Out)", value: "LIFO (Last In First Out)" },
    ],
  },
];

const taxPreferenceGroups = [
  {
    group: "Standard",
    options: [
      { label: "Taxable", value: "taxable" },
      { label: "Non-Taxable", value: "non-taxable" },
    ],
  },
  {
    group: "Special",
    options: [
      { label: "Out of Scope", value: "out-of-scope" },
      { label: "Non-GST Supply", value: "non-gst-supply" },
      { label: "Exempt", value: "exempt" },
    ],
  },
];

const initialFormData = {
  type: "goods",
  itemName: "",
  sku: "",
  unit: "",
  hsnCode: "",
  manufacturer: "",
  brand: "",
  returnable: true,
  sellable: true,
  purchasable: true,
  taxPreference: "taxable",
  dimensions: "",
  weight: "",
  upc: "",
  mpn: "",
  ean: "",
  isbn: "",
  size: "",
  inventoryValuationMethod: "",
  sellingPrice: "",
  salesAccount: "",
  salesDescription: "",
  costPrice: "",
  costAccount: "",
  preferredVendor: "",
  purchaseDescription: "",
  taxRateIntra: "",
  taxRateInter: "",
  inventoryAccount: "",
  reorderPoint: "",
};

const ShoeSalesItemCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState({ loading: false, error: null });
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [trackInventory, setTrackInventory] = useState(true);
  const [trackBin, setTrackBin] = useState(false);
  const [trackingMethod, setTrackingMethod] = useState("none");

  useEffect(() => {
    if (!trackInventory) {
      setTrackBin(false);
      setTrackingMethod("none");
      setFormData((prev) => ({
        ...prev,
        inventoryAccount: "",
        inventoryValuationMethod: "",
      }));
    }
  }, [trackInventory]);

  const generateSkuPreview = useCallback((name = "") => {
    const words = name
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .split(/[\s-_,]+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "";
    }

    const alphaWords = words.filter((word) => /[A-Za-z]/.test(word));
    const numericWords = words.filter((word) => /^\d+$/.test(word));

    let letters = alphaWords.map((word) => word[0].toUpperCase()).join("");

    if (!letters && alphaWords.length > 0) {
      letters = alphaWords[0].slice(0, 3).toUpperCase();
    }

    if (!letters) {
      letters = words[0].slice(0, 3).toUpperCase();
    }

    let base = letters || "ITEM";
    const digits = numericWords.join("");
    if (digits) {
      base += `-${digits}`;
    }

    return base;
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "itemName" && !skuManuallyEdited) {
        next.sku = generateSkuPreview(value);
      }
      return next;
    });
  };

  const handleSkuChange = (event) => {
    const value = event.target.value;
    setSkuManuallyEdited(true);
    setFormData((prev) => ({ ...prev, sku: value.toUpperCase() }));
  };

const handleCheckboxChange = (field) => (event) => {
  const checked = event.target.checked;
  setFormData((prev) => {
    const next = { ...prev, [field]: checked };

    if (field === "sellable" && !checked) {
      next.sellingPrice = "";
      next.salesAccount = "";
      next.salesDescription = "";
    }

    if (field === "purchasable" && !checked) {
      next.costPrice = "";
      next.costAccount = "";
      next.preferredVendor = "";
      next.purchaseDescription = "";
    }

    return next;
  });
};

  const handleSelectChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRadioChange = (field, value) => () => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });

    try {
      const response = await fetch(`${API_ROOT}/api/shoe-sales/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          trackInventory,
          trackBin,
          trackingMethod,
          sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : 0,
          costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to save item.");
      }

      setFormData(initialFormData);
      setSkuManuallyEdited(false);
      setTrackInventory(true);
      setTrackBin(false);
      setTrackingMethod("none");
      navigate("/shoe-sales/items");
    } catch (error) {
      setStatus({ loading: false, error: error.message || "Something went wrong." });
      return;
    }

    setStatus({ loading: false, error: null });
  };

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {status.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.error}
          </div>
        )}

        <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
          <div className="grid gap-8 border-b border-[#e7ebf8] px-8 py-8 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Type</legend>
                <div className="flex flex-wrap gap-4 text-sm font-medium text-[#1f2937]">
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                    <input
                      type="radio"
                      name="type"
                      value="goods"
                      checked={formData.type === "goods"}
                      onChange={handleChange("type")}
                      className="text-[#4285f4]"
                    />
                    Goods
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                    <input
                      type="radio"
                      name="type"
                      value="service"
                      checked={formData.type === "service"}
                      onChange={handleChange("type")}
                      className="text-[#4285f4]"
                    />
                    Service
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-6 sm:grid-cols-2">
                <FloatingField
                  label="Item Name*"
                  placeholder="Enter item name"
                  required
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange("itemName")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="SKU"
                  placeholder="e.g. KSB-36"
                  name="sku"
                  value={formData.sku}
                  onChange={handleSkuChange}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Unit*"
                  placeholder="Select or type to add"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange("unit")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="HSN Code"
                  placeholder="Enter HSN"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange("hsnCode")}
                  disabled={status.loading}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FloatingField
                  label="Manufacturer"
                  placeholder="Select or add manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange("manufacturer")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Brand"
                  placeholder="Select or add brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange("brand")}
                  disabled={status.loading}
                />
                <FloatingCheckbox
                  label="Returnable Item"
                  name="returnable"
                  checked={formData.returnable}
                  onChange={handleCheckboxChange("returnable")}
                  disabled={status.loading}
                />
                <SearchableSelect
                  label="Tax Preference*"
                  placeholder="Select tax preference"
                  value={formData.taxPreference}
                  onChange={handleSelectChange("taxPreference")}
                  groups={taxPreferenceGroups}
                  required
                  disabled={status.loading}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FloatingField
                  label="Dimensions"
                  placeholder="Length × Width × Height"
                  hint="cm"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange("dimensions")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Weight"
                  placeholder="Add weight"
                  hint="kg"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange("weight")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="UPC"
                  placeholder="Enter UPC"
                  name="upc"
                  value={formData.upc}
                  onChange={handleChange("upc")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="MPN"
                  placeholder="Enter MPN"
                  name="mpn"
                  value={formData.mpn}
                  onChange={handleChange("mpn")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="EAN"
                  placeholder="Enter EAN"
                  name="ean"
                  value={formData.ean}
                  onChange={handleChange("ean")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="ISBN"
                  placeholder="Enter ISBN"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange("isbn")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Size"
                  placeholder="Select size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange("size")}
                  disabled={status.loading}
                />
              </div>
            </div>

            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
              <UploadCloud size={36} className="mb-3 text-[#94a3b8]" />
              <p className="text-sm font-medium">Drag image(s) here or browse images</p>
              <p className="mt-2 text-xs leading-5">
                You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
              </p>
              <button
                type="button"
                className="mt-4 rounded-full border border-[#cbd5f5] px-4 py-2 text-sm font-medium text-[#3762f9] hover:bg-[#eef2ff]"
              >
                Upload
              </button>
            </div>
          </div>

          <div className="space-y-8 px-8 py-8">
            <section className="grid gap-6 md:grid-cols-2">
              <InfoCard
                title="Sales Information"
                actions={
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#475569]">
                    <input
                      type="checkbox"
                      name="sellable"
                      checked={formData.sellable}
                      onChange={handleCheckboxChange("sellable")}
                      disabled={status.loading}
                      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
                    />
                    Sellable
                  </label>
                }
              >
                <FloatingField
                  label="Selling Price"
                  placeholder="0.00"
                  prefix="INR"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange("sellingPrice")}
                  disabled={!formData.sellable || status.loading}
                />
                <FloatingField
                  label="Sales Account"
                  placeholder="Select account"
                  name="salesAccount"
                  value={formData.salesAccount}
                  onChange={handleChange("salesAccount")}
                  disabled={!formData.sellable || status.loading}
                />
                <FloatingField
                  label="Description"
                  placeholder="Optional description"
                  inputType="textarea"
                  name="salesDescription"
                  value={formData.salesDescription}
                  onChange={handleChange("salesDescription")}
                  disabled={!formData.sellable || status.loading}
                />
              </InfoCard>
              <InfoCard
                title="Purchase Information"
                actions={
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#475569]">
                    <input
                      type="checkbox"
                      name="purchasable"
                      checked={formData.purchasable}
                      onChange={handleCheckboxChange("purchasable")}
                      disabled={status.loading}
                      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
                    />
                    Purchasable
                  </label>
                }
              >
                <FloatingField
                  label="Cost Price"
                  placeholder="0.00"
                  prefix="INR"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange("costPrice")}
                  disabled={!formData.purchasable || status.loading}
                />
                <FloatingField
                  label="Cost Account"
                  placeholder="Cost of Goods Sold"
                  name="costAccount"
                  value={formData.costAccount}
                  onChange={handleChange("costAccount")}
                  disabled={!formData.purchasable || status.loading}
                />
                <FloatingField
                  label="Preferred Vendor"
                  placeholder="Select vendor"
                  name="preferredVendor"
                  value={formData.preferredVendor}
                  onChange={handleChange("preferredVendor")}
                  disabled={!formData.purchasable || status.loading}
                />
                <FloatingField
                  label="Description"
                  placeholder="Optional description"
                  inputType="textarea"
                  name="purchaseDescription"
                  value={formData.purchaseDescription}
                  onChange={handleChange("purchaseDescription")}
                  disabled={!formData.purchasable || status.loading}
                />
              </InfoCard>
            </section>

            <InfoCard title="Inventory & Tracking" fullWidth>
              <div className="grid gap-4 md:grid-cols-2">
                <FloatingField
                  label="Default Tax Rate (Intra-state)"
                  placeholder="CGST 9% + SGST 9%"
                  name="taxRateIntra"
                  value={formData.taxRateIntra}
                  onChange={handleChange("taxRateIntra")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Default Tax Rate (Inter-state)"
                  placeholder="IGST 18%"
                  name="taxRateInter"
                  value={formData.taxRateInter}
                  onChange={handleChange("taxRateInter")}
                  disabled={status.loading}
                />
              </div>
              <div className="mt-4 space-y-4 rounded-2xl border border-[#e3e8f9] bg-[#f7f9ff] p-6">
                <FloatingCheckbox
                  label="Track inventory for this item"
                  name="trackInventory"
                  checked={trackInventory}
                  onChange={(event) => setTrackInventory(event.target.checked)}
                  disabled={status.loading}
                />
                <FloatingCheckbox
                  label="Track bin location for this item"
                  name="trackBin"
                  checked={trackBin}
                  onChange={(event) => setTrackBin(event.target.checked)}
                  disabled={status.loading || !trackInventory}
                />
                {trackInventory && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1f2937]">Advanced Inventory Tracking</p>
                    <div className="flex flex-wrap gap-4">
                      <FloatingRadio
                        name="trackingMethod"
                        label="None"
                        value="none"
                        checked={trackingMethod === "none"}
                        onChange={() => setTrackingMethod("none")}
                        disabled={status.loading}
                      />
                      <FloatingRadio
                        name="trackingMethod"
                        label="Track Serial Number"
                        value="serial"
                        checked={trackingMethod === "serial"}
                        onChange={() => setTrackingMethod("serial")}
                        disabled={status.loading}
                      />
                      <FloatingRadio
                        name="trackingMethod"
                        label="Track Batches"
                        value="batch"
                        checked={trackingMethod === "batch"}
                        onChange={() => setTrackingMethod("batch")}
                        disabled={status.loading}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SearchableSelect
                        label="Inventory Account*"
                        placeholder="Select an account"
                        value={formData.inventoryAccount}
                        onChange={handleSelectChange("inventoryAccount")}
                        groups={inventoryAccountGroups}
                        required
                        disabled={status.loading}
                      />
                      <SearchableSelect
                        label="Inventory Valuation Method*"
                        placeholder="Select the valuation method"
                        value={formData.inventoryValuationMethod}
                        onChange={handleSelectChange("inventoryValuationMethod")}
                        groups={inventoryValuationGroups}
                        required
                        disabled={status.loading}
                      />
                    </div>
                    </div>
                    <FloatingField
                      label="Reorder Point"
                      placeholder="Enter quantity"
                      name="reorderPoint"
                      value={formData.reorderPoint}
                      onChange={handleChange("reorderPoint")}
                      disabled={status.loading}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-xl border border-[#d7dcf5] bg-[#f5f7ff] px-4 py-3 text-sm text-[#475569]">
                <strong className="font-semibold text-[#1f2937]">Note:</strong> You can add opening stock on the item
                details page by clicking the gear icon under Warehouses.
              </div>
            </InfoCard>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                + Configure Accounts
              </button>
              <div className="flex items-center gap-3">
                <Link
                  to="/shoe-sales/items"
                  className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={status.loading}
                  className="rounded-md bg-[#3762f9] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status.loading ? "Saving..." : "Save Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ShoeSalesItemCreate;

const FloatingField = ({
  label,
  placeholder,
  required = false,
  inputType = "input",
  hint,
  prefix,
  name,
  value,
  onChange,
  disabled = false,
}) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
      {label}
      {required && <span className="text-[#ef4444]"> *</span>}
    </span>
    {inputType === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        disabled={disabled}
        className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:border-[#4285f4] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
      />
    ) : inputType === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
      >
        <option value="">{placeholder}</option>
      </select>
    ) : (
      <div className="flex items-center rounded-lg border border-[#d7dcf5] focus-within:border-[#4285f4]">
        {prefix && <span className="pl-3 text-xs font-semibold uppercase text-[#64748b]">{prefix}</span>}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
        />
        {hint && <span className="pr-3 text-xs text-[#94a3b8]">{hint}</span>}
      </div>
    )}
  </label>
);

const FloatingCheckbox = ({ label, name, checked, onChange, disabled = false }) => (
  <label className="inline-flex items-center gap-3 rounded-lg border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
    />
    {label}
  </label>
);

const FloatingRadio = ({ name, label, value, checked, onChange, disabled = false }) => (
  <label className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
    />
    {label}
  </label>
);

const SearchableSelect = ({ label, placeholder, value, onChange, groups, disabled = false, required = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const normalizedGroups = useMemo(
    () =>
      groups.map((group) => ({
        group: group.group,
        options: group.options.map((option) =>
          typeof option === "string" ? { label: option, value: option } : option
        ),
      })),
    [groups]
  );

  const optionMap = useMemo(() => {
    const map = new Map();
    normalizedGroups.forEach((group) => {
      group.options.forEach((option) => {
        map.set(option.value, option.label);
      });
    });
    return map;
  }, [normalizedGroups]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return groups;
    }
    return normalizedGroups
      .map((group) => ({
        group: group.group,
        options: group.options.filter((option) => option.label.toLowerCase().includes(term)),
      }))
      .filter((group) => group.options.length > 0);
  }, [normalizedGroups, search]);

  const displayValue = value ? optionMap.get(value) || value : "";

  return (
    <div className="relative flex w-full flex-col gap-1 text-sm text-[#475569]" ref={containerRef}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
        {label}
        {required && <span className="text-[#ef4444]"> *</span>}
      </span>
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
          open ? "border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-[#d7dcf5]"
        } ${disabled ? "bg-[#f1f5f9] text-[#9ca3af]" : "bg-white text-[#1f2937]"} ${disabled ? "" : "cursor-pointer"}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className={value ? "text-[#1f2937]" : "text-[#9ca3af]"}>{displayValue || placeholder}</span>
        <ChevronDown
          size={16}
          className={`ml-3 text-[#9ca3af] transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[#d7dcf5] bg-white shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2 border-b border-[#edf1ff] px-3 py-2 text-[#475569]">
            <Search size={14} className="text-[#9ca3af]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-8 w-full border-none text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-2">
            {filteredGroups.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No matching results</p>
            )}
            {filteredGroups.map((group) => (
              <div key={group.group}>
                <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                  {group.group}
                </p>
                {group.options.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`select-option flex w-full items-center rounded-md px-4 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-[#e9f0ff] font-semibold text-[#1f2937]"
                          : "bg-white text-[#475569] hover:bg-[#f6f8ff]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ title, children, fullWidth, actions }) => (
  <div
    className={`rounded-2xl border border-[#dbe4ff] bg-[#f7f9ff] p-6 shadow-sm ${
      fullWidth ? "space-y-4" : "space-y-4"
    }`}
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#1f2937]">{title}</h3>
      {actions}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);