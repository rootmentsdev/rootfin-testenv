import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Head from "../components/Head";

const blankLineItem = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  item: "",
  size: "",
  quantity: 1,
  rate: 0,
  tax: "",
  amount: 0,
});

const SalesInvoiceCreate = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState("");
  const [branch, setBranch] = useState("Head Office");
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-009193");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [terms, setTerms] = useState("Due on Receipt");
  const [salesperson, setSalesperson] = useState("");
  const [subject, setSubject] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [lineItems, setLineItems] = useState([blankLineItem()]);
  const [tdsEnabled, setTdsEnabled] = useState(true);
  const [tax, setTax] = useState("");
  const [discount, setDiscount] = useState("");
  const [customerNotes, setCustomerNotes] = useState("Thanks for your business.");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const controlBase =
    "w-full rounded-xl border border-[#d4dbf4] bg-white px-4 py-3 text-sm text-[#0f172a] focus:border-[#3a6bff] focus:outline-none focus:ring-0";
  const textareaBase = `${controlBase} resize-none`;
  const subtleControlBase =
    "rounded-xl border border-[#d4dbf4] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#3a6bff] focus:outline-none focus:ring-0";

  const subTotal = useMemo(
    () => lineItems.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [lineItems]
  );

  const total = useMemo(() => Math.max(subTotal - Number(discount || 0), 0), [subTotal, discount]);

  const handleLineItemChange = (id, key, value) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
              amount: key === "rate" || key === "quantity" ? Number(value || 0) * item.quantity : item.amount,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (id, value) => {
    const numeric = Number(value) || 0;
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: numeric,
              amount: numeric * Number(item.rate || 0),
            }
          : item
      )
    );
  };

  const handleRateChange = (id, value) => {
    const numeric = Number(value) || 0;
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rate: numeric,
              amount: numeric * Number(item.quantity || 0),
            }
          : item
      )
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, blankLineItem()]);
  };

  const removeLineItem = (id) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const toggleTds = () => setTdsEnabled((prev) => !prev);

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <Head
        title="New Invoice"
        description="Prepare a customer invoice with itemized billing."
        actions={
          <Link
            to="/sales/invoices"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7def4] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            Back to Invoices
          </Link>
        }
      />

      <div className="ml-64 px-10 pb-16 pt-6">
        <div className="rounded-3xl border border-[#e3e7f6] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9ecf9] px-10 py-6">
            <div className="flex items-center gap-3 text-[#111827]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2ff] text-2xl text-[#3164ff]">
                🧾
              </span>
              <div>
                <h1 className="text-2xl font-semibold">New Invoice</h1>
                <p className="text-sm text-[#6b7280]">Fill in the invoice details below.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-md border border-[#d7def4] p-2 text-[#4b5563] transition hover:bg-[#f5f7ff]">
                <span className="sr-only">Settings</span>⚙
              </button>
              <button
                onClick={() => navigate("/sales/invoices")}
                className="rounded-md border border-[#d7def4] p-2 text-[#4b5563] transition hover:bg-[#f5f7ff]"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>
          </div>

          <div className="space-y-10 px-10 py-10">
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_1fr]">
              <Field label="Customer Name" required>
                <div className="flex items-center gap-3 rounded-xl border border-[#d4dbf4] bg-[#f9faff] px-4 py-3 focus-within:border-[#3a6bff] focus-within:ring-2 focus-within:ring-[#dbe6ff]">
                  <select
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                    className="w-full border-0 bg-transparent text-sm text-[#0f172a] focus:outline-none focus:ring-0"
                  >
                    <option value="">Select or add a customer</option>
                    <option value="Harshadh">Harshadh</option>
                    <option value="Athul">Athul</option>
                    <option value="Amal">Amal</option>
                  </select>
                  <button className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#3366ff] text-white">
                    🔍
                  </button>
                </div>
              </Field>
              <Field label="Branch">
                <div className="rounded-xl border border-[#d4dbf4] bg-[#f9faff] px-4 py-3 text-sm text-[#0f172a]">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={branch}
                      onChange={(event) => setBranch(event.target.value)}
                      className="w-full border-0 bg-transparent text-sm text-[#0f172a] focus:outline-none focus:ring-0"
                    >
                      <option value="Head Office">Head Office</option>
                      <option value="Kannur Branch">Kannur Branch</option>
                      <option value="Edappally Branch">Edappally Branch</option>
                    </select>
                    <span className="text-[#98a2b3]">⌄</span>
                  </div>
                  <p className="mt-2 text-xs text-[#6b7280]">Source of Supply: Kerala</p>
                </div>
              </Field>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Field label="Invoice#">
                  <div className="flex items-center gap-2 rounded-xl border border-[#d4dbf4] bg-white px-4 py-3 text-sm text-[#0f172a] shadow-sm focus-within:border-[#3a6bff] focus-within:ring-2 focus-within:ring-[#dbe6ff]">
                    <input
                      value={invoiceNumber}
                      onChange={(event) => setInvoiceNumber(event.target.value)}
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-0"
                    />
                    <button className="rounded-md border border-transparent bg-[#eef2ff] px-2 py-1 text-xs font-semibold text-[#3366ff]">
                      ⚙
                    </button>
                  </div>
                </Field>
                <Field label="Order Number">
                  <input
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder="Enter order reference"
                    className={controlBase}
                  />
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Invoice Date">
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(event) => setInvoiceDate(event.target.value)}
                    className={controlBase}
                  />
                </Field>
                <div className="space-y-6">
                  <Field label="Terms">
                    <select
                      value={terms}
                      onChange={(event) => setTerms(event.target.value)}
                      className={controlBase}
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 7">Net 7</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                    </select>
                  </Field>
                  <Field label="Due Date">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className={controlBase}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Field label="Salesperson">
                <select
                  value={salesperson}
                  onChange={(event) => setSalesperson(event.target.value)}
                  className={controlBase}
                >
                  <option value="">Select or Add Salesperson</option>
                  <option value="Harshadh">Harshadh</option>
                  <option value="Athul">Athul</option>
                  <option value="Amal">Amal</option>
                </select>
              </Field>
              <Field label="Subject">
                <textarea
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Let your customer know what this invoice is for"
                  className={`${textareaBase} min-h-[60px]`}
                />
              </Field>
            </section>

            <section className="space-y-4 rounded-2xl border border-[#edf1ff] bg-[#fafbff] px-6 py-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#4b5563]">
                <span className="font-medium text-[#1f2937]">Warehouse</span>
                <select
                  value={warehouse}
                  onChange={(event) => setWarehouse(event.target.value)}
                  className={subtleControlBase}
                >
                  <option value="">Select a warehouse</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Kannur Branch">Kannur Branch</option>
                  <option value="Edappally Branch">Edappally Branch</option>
                </select>
                <button className="inline-flex items-center gap-2 text-sm font-medium text-[#4662ff] hover:text-[#3147d8]">
                  Scan Item
                </button>
                <button className="inline-flex items-center gap-2 text-sm font-medium text-[#4662ff] hover:text-[#3147d8]">
                  Bulk Actions
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#edf1ff] bg-white">
                <table className="min-w-full border-collapse text-sm text-[#111827]">
                  <thead className="bg-[#fafbff] text-xs uppercase tracking-[0.18em] text-[#99a3bd]">
                    <tr>
                      <th className="w-10 px-4 py-3 text-left">
                        <span className="block h-5 w-5 rounded border border-[#d4dbf4]" />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#6b7280]">Item Details</th>
                      <th className="w-32 px-4 py-3 text-left font-semibold text-[#6b7280]">Size</th>
                      <th className="w-28 px-4 py-3 text-left font-semibold text-[#6b7280]">Quantity</th>
                      <th className="w-32 px-4 py-3 text-left font-semibold text-[#6b7280]">Rate</th>
                      <th className="w-32 px-4 py-3 text-left font-semibold text-[#6b7280]">Tax</th>
                      <th className="w-32 px-4 py-3 text-right font-semibold text-[#6b7280]">Amount</th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={item.id} className={index === 0 ? "bg-[#fbfcff]" : "bg-white"}>
                        <td className="px-4 py-4 align-top">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#d4dbf4] text-[#d4dbf4]">
                            ⣿
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#cfd7f0] bg-white px-4 py-3 text-sm text-[#9aa4c2]">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f7ff] text-lg text-[#aeb8d8]">
                              🖼
                            </span>
                            <input
                              value={item.item}
                              onChange={(event) => handleLineItemChange(item.id, "item", event.target.value)}
                              placeholder="Type or click to select an item."
                              className="w-full border-0 bg-transparent text-sm text-[#0f172a] placeholder:text-[#9aa4c2] focus:outline-none focus:ring-0"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            value={item.size}
                            onChange={(event) => handleLineItemChange(item.id, "size", event.target.value)}
                            placeholder="Size"
                            className={subtleControlBase}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                            className={subtleControlBase}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min={0}
                            value={item.rate}
                            onChange={(event) => handleRateChange(item.id, event.target.value)}
                            className={subtleControlBase}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={item.tax}
                            onChange={(event) => handleLineItemChange(item.id, "tax", event.target.value)}
                            className={subtleControlBase}
                          >
                            <option value="">Select a Tax</option>
                            <option value="GST 5%">GST 5%</option>
                            <option value="GST 12%">GST 12%</option>
                            <option value="GST 18%">GST 18%</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-[#0f172a]">
                          {item.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="text-[#ef4444] transition hover:text-[#dc2626]"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 text-sm">
                <button
                  onClick={addLineItem}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d4dbf4] bg-[#f5f7ff] px-4 py-2 text-[#4662ff] hover:bg-[#eef2ff]"
                >
                  + Add New Row
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg border border-[#d4dbf4] bg-[#f5f7ff] px-4 py-2 text-[#4662ff] hover:bg-[#eef2ff]">
                  + Add Items in Bulk
                </button>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)]">
              <div className="space-y-6">
                <Field label="Customer Notes">
                  <textarea
                    value={customerNotes}
                    onChange={(event) => setCustomerNotes(event.target.value)}
                    className={`${textareaBase} h-28 bg-[#fbfcff]`}
                  />
                  <p className="text-xs text-[#9aa4c2]">Will be displayed on the invoice</p>
                </Field>
                <Field label="Terms & Conditions">
                  <textarea
                    value={termsAndConditions}
                    onChange={(event) => setTermsAndConditions(event.target.value)}
                    placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                    className={`${textareaBase} h-28 bg-[#fbfcff]`}
                  />
                </Field>
                <Field label="Attach File(s) to Invoice">
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#d4dbf4] bg-white px-4 py-4">
                    <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4dbf4] px-4 text-sm font-semibold text-[#4662ff] hover:bg-[#eef2ff]">
                      ⬆ Upload File
                    </button>
                    <span className="text-xs text-[#9aa4c2]">
                      You can upload a maximum of 10 files, 10MB each
                    </span>
                  </div>
                </Field>
              </div>

              <div className="space-y-6 rounded-2xl border border-[#edf1ff] bg-[#fafbff] p-6 text-sm text-[#4b5563]">
                <div className="flex items-center justify-between text-base font-semibold text-[#111827]">
                  <span>Sub Total (₹)</span>
                  <span>{subTotal.toFixed(2)}</span>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm text-[#4b5563]">
                    <span className="font-medium text-[#111827]">Tax Options</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleTds}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          tdsEnabled ? "border-[#4662ff] bg-white text-[#4662ff]" : "border-[#d4dbf4] text-[#98a2b3]"
                        }`}
                      >
                        TDS
                      </button>
                      <button
                        type="button"
                        onClick={toggleTds}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          !tdsEnabled ? "border-[#4662ff] bg-white text-[#4662ff]" : "border-[#d4dbf4] text-[#98a2b3]"
                        }`}
                      >
                        TCS
                      </button>
                    </div>
                  </label>
                  <select
                    value={tax}
                    onChange={(event) => setTax(event.target.value)}
                    className={controlBase}
                  >
                    <option value="">Select a Tax</option>
                    <option value="GST 5%">GST 5%</option>
                    <option value="GST 12%">GST 12%</option>
                    <option value="GST 18%">GST 18%</option>
                  </select>
                </div>

                <Field label="Discount">
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    className={controlBase}
                  />
                </Field>

                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-base font-semibold text-[#111827]">
                  <span>Total (₹)</span>
                  <span>{total.toFixed(2)}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9ecf9] px-10 py-6 text-sm text-[#4b5563]">
            <div className="text-sm font-medium text-[#111827]">
              Total Amount: ₹ {total.toFixed(2)}
              <span className="ml-4 text-xs text-[#9aa4c2]">Total Quantity: {lineItems.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-[#d4dbf4] px-4 py-2 text-sm font-medium text-[#4b5563] transition hover:bg-white">
                Save as Draft
              </button>
              <div className="flex items-center overflow-hidden rounded-lg border border-transparent shadow-sm">
                <button className="h-10 bg-[#3366ff] px-6 text-sm font-semibold text-white transition hover:bg-[#244fd6]">
                  Save and Send
                </button>
                <button className="h-10 border-l border-[#2d56d6] bg-[#3366ff] px-3 text-white transition hover:bg-[#244fd6]">
                  ⌄
                </button>
              </div>
              <button
                onClick={() => navigate("/sales/invoices")}
                className="rounded-lg border border-[#d4dbf4] px-4 py-2 text-sm font-medium text-[#4b5563] transition hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="flex flex-col gap-2 text-sm text-[#475569]">
    <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94b0]">
      {label}
      {required && <span className="font-normal text-[#ef4444]">*</span>}
    </span>
    {children}
  </label>
);

export default SalesInvoiceCreate;


