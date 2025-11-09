import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Head from "../components/Head";

const createBlankItem = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: "",
  sourceStock: "0.00 Units",
  destinationStock: "0.00 Units",
  quantity: "0.00",
});

const TransferOrderCreate = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destinationWarehouse, setDestinationWarehouse] = useState("");
  const [items, setItems] = useState([createBlankItem()]);

  const isFormReady = useMemo(() => {
    return orderNumber && date && sourceWarehouse && destinationWarehouse;
  }, [orderNumber, date, sourceWarehouse, destinationWarehouse]);

  const handleItemChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: value,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: value,
            }
          : item
      )
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [...prev, createBlankItem()]);
  };

  const handleRemoveRow = (id) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const handleCancel = () => {
    navigate("/inventory/transfer-orders");
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Head
        title="New Transfer Order"
        description="Register a stock transfer between warehouses."
        actions={
          <Link
            to="/inventory/transfer-orders"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            Back to Transfer Orders
          </Link>
        }
      />

      <div className="ml-64 px-10 pb-16 pt-8">
        <div className="rounded-3xl border border-[#e6ebfa] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ff] px-10 py-6">
            <div className="space-y-1">
              <h1 className="text-[20px] font-semibold text-[#101828]">New Transfer Order</h1>
              <p className="text-sm text-[#6c728a]">
                Populate the required fields to initiate a warehouse transfer.
              </p>
            </div>
            <button className="rounded-full border border-transparent p-2 text-[#98a2b3] transition hover:border-[#e4e7f5] hover:bg-[#f8f9ff]">
              <span className="sr-only">Close</span>✕
            </button>
          </div>

          <div className="space-y-12 px-10 py-12">
            <section className="grid gap-8 lg:grid-cols-2">
              <Field label="Transfer Order#" required>
                <div className="flex items-center gap-3 rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-2.5">
                  <input
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder="Enter order reference"
                    className="w-full border-0 bg-transparent text-sm text-[#101828] placeholder:text-[#b0b8d9] focus:ring-0"
                  />
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f46e5]"
                    onClick={() => setOrderNumber(`TO-${Math.floor(Math.random() * 9000 + 1000)}`)}
                  >
                    Auto
                  </button>
                </div>
              </Field>
              <Field label="Date" required>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-2.5 text-sm text-[#101828] focus:border-[#94a3b8] focus:outline-none"
                />
              </Field>
              <Field label="Reason">
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Describe the transfer reason"
                  className="w-full rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-3 text-sm text-[#101828] focus:border-[#94a3b8] focus:outline-none"
                />
              </Field>
            </section>

            <section className="grid gap-8 lg:grid-cols-[1fr_auto_1fr]">
              <Field label="Source Warehouse" required>
                <select
                  value={sourceWarehouse}
                  onChange={(event) => setSourceWarehouse(event.target.value)}
                  className="w-full rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-2.5 text-sm text-[#101828] focus:border-[#94a3b8] focus:outline-none"
                >
                  <option value="">Select warehouse</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Kannur Branch">Kannur Branch</option>
                  <option value="Edappally Branch">Edappally Branch</option>
                </select>
              </Field>
              <div className="flex items-end justify-center pb-1">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d5dcf4] text-[#4b5563] hover:bg-[#eef2ff]"
                  onClick={() => {
                    setSourceWarehouse(destinationWarehouse);
                    setDestinationWarehouse(sourceWarehouse);
                  }}
                >
                  ⇄
                </button>
              </div>
              <Field label="Destination Warehouse" required>
                <select
                  value={destinationWarehouse}
                  onChange={(event) => setDestinationWarehouse(event.target.value)}
                  className="w-full rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-2.5 text-sm text-[#101828] focus:border-[#94a3b8] focus:outline-none"
                >
                  <option value="">Select warehouse</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Kannur Branch">Kannur Branch</option>
                  <option value="Edappally Branch">Edappally Branch</option>
                </select>
              </Field>
            </section>

            <section className="rounded-2xl border border-[#edf1ff] bg-[#fcfdff]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ff] px-8 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a94b0]">Item Table</span>
                <button className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4662ff] hover:text-[#3147d8]">
                  <span className="text-base">📷</span>
                  Scan Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse text-sm text-[#111827]">
                  <thead className="bg-white text-[11px] uppercase tracking-[0.28em] text-[#9aa2bd]">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left font-semibold">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d0d6ee] text-[#4f46e5] focus:ring-[#4338ca]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Item Details</th>
                      <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Current Availability</th>
                      <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Transfer Quantity</th>
                      <th className="w-12 px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-[#f0f3ff]">
                        <td className="px-6 py-4 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#d0d6ee] text-[#4f46e5] focus:ring-[#4338ca]"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 rounded-xl border border-[#d4dbf4] bg-white px-5 py-3 shadow-sm transition focus-within:border-[#7293ff] focus-within:ring-2 focus-within:ring-[#dbe6ff]">
                              <span className="text-lg text-[#5f7cff]">🔍</span>
                              <input
                                value={item.name}
                                onChange={(event) => handleItemChange(item.id, event.target.value)}
                                placeholder="Type or click to select an item"
                                className="w-full border-0 bg-transparent text-base text-[#0f172a] placeholder:text-[#9aa4c2] focus:ring-0"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid gap-3 text-xs text-[#6b7280] sm:grid-cols-2">
                            <div className="rounded-lg border border-[#edf1ff] bg-[#f9faff] px-4 py-3">
                              <span className="block text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">
                                Source Stock
                              </span>
                              <span className="mt-1 block text-sm font-semibold text-[#101828]">{item.sourceStock}</span>
                            </div>
                            <div className="rounded-lg border border-[#edf1ff] bg-[#f9faff] px-4 py-3">
                              <span className="block text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">
                                Destination Stock
                              </span>
                              <span className="mt-1 block text-sm font-semibold text-[#101828]">
                                {item.destinationStock}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 rounded-lg border border-[#d9def1] bg-white px-4 py-2.5">
                            <input
                              value={item.quantity}
                              onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                              className="w-full border-0 text-right text-sm text-[#101828] focus:ring-0"
                            />
                            <span className="text-xs text-[#98a2b3]">Units</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="text-[#ef4444] transition hover:text-[#dc2626]"
                            onClick={() => handleRemoveRow(item.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-[#edf1ff] px-8 py-4 text-sm">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#cbd5f5] px-4 py-2 text-[#4662ff] hover:bg-[#eef2ff]"
                >
                  + Add Row
                </button>
                <button className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4662ff] hover:text-[#3147d8]">
                  + Add Items in Bulk
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-dashed border-[#d7def5] bg-[#f5f7ff] px-8 py-6 text-sm text-[#4b5563]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94b0]">Attach file(s) to transfer order</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-[#dbe2f8] bg-white px-6 py-5">
                <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff] text-[#4662ff]">
                    ⬆
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Upload File</p>
                    <p className="text-xs text-[#9ca3af]">You can upload a maximum of 5 files, 10MB each.</p>
                  </div>
                </div>
                <button className="ml-auto rounded-lg border border-[#d4dcf4] px-4 py-2 text-sm font-medium text-[#4662ff] hover:bg-[#eef2ff]">
                  Choose File
                </button>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#edf1ff] bg-[#fbfcff] px-10 py-6">
            <button className="rounded-lg border border-[#d4dcf4] px-4 py-2 text-sm font-medium text-[#6b7280] transition hover:bg-white">
              Save as Draft
            </button>
            <button
              className="rounded-lg bg-[#2f6bff] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2757d6] disabled:cursor-not-allowed disabled:bg-[#b8ccff]"
              disabled={!isFormReady}
            >
              Initiate Transfer
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-[#d4dcf4] px-4 py-2 text-sm font-medium text-[#6b7280] transition hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="flex flex-col gap-2 text-sm text-[#475569]">
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a94b0]">
      {label}
      {required && <span className="ml-1 font-normal text-[#ef4444]">*</span>}
    </span>
    {children}
  </label>
);

export default TransferOrderCreate;


