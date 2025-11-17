import { useMemo, useState } from "react";
import Head from "../components/Head";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

const sampleVendors = [
  {
    id: "v1",
    name: "Meenakshi Apparels",
    companyName: "Meenakshi Apparels",
    email: "meenakshiapparels6816@gmail.com",
    phone: "9745841185",
    gstTreatment: "Registered\nBusiness - Regular",
    payables: 146448.5,
    credits: 0,
  },
  {
    id: "v2",
    name: "Rewa footwear co.",
    companyName: "Rewa footwear co.",
    email: "rewafootwear@gmail.com",
    phone: "9897081604",
    gstTreatment: "Registered\nBusiness - Regular",
    payables: 1787041.96,
    credits: 0,
  },
];

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

const PurchaseVendors = () => {
  const [vendors] = useState(sampleVendors);
  const [selected, setSelected] = useState(() => new Set());

  const allSelected = useMemo(() => selected.size > 0 && selected.size === vendors.length, [selected, vendors.length]);

  const toggleAll = (checked) => {
    if (checked) {
      setSelected(new Set(vendors.map((v) => v.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <Head
        title="All Vendors"
        description=""
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center rounded-md border border-[#facc15]/30 bg-[#fff7ed] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#b45309] shadow-sm hover:bg-[#ffedd5]">
              Update MSME Details
            </button>
            <Link
              to="/purchase/vendors/new"
              className="rounded-md bg-[#3762f9] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
            >
              New
            </Link>
          </div>
        }
      />

      <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
        {/* Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-[#e7ebf8] px-4 py-3">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#dbe4ff] bg-[#f8f9ff] text-[#475569] hover:bg-[#eef2ff]">
            <SlidersHorizontal size={16} />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search vendors"
              className="h-9 w-60 rounded-md border border-[#d7dcf5] px-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e6eafb]">
            <thead className="bg-[#f5f6ff]">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#cbd5f5] text-[#2563eb] focus:ring-[#2563eb]"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Company Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Work Phone</th>
                <th className="px-5 py-3">GST Treatment</th>
                <th className="px-5 py-3 text-right">Payables (BCY)</th>
                <th className="px-5 py-3 text-right">Unused Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2ff] text-sm">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[#fafbff]">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#cbd5f5] text-[#2563eb] focus:ring-[#2563eb]"
                      checked={selected.has(v.id)}
                      onChange={(e) => toggleOne(v.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link to="#" className="font-medium text-[#1f2937] hover:text-[#2563eb]">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[#334155]">{v.companyName}</td>
                  <td className="px-5 py-4 text-[#334155]">{v.email}</td>
                  <td className="px-5 py-4 text-[#334155]">{v.phone}</td>
                  <td className="px-5 py-4 whitespace-pre-line text-[#334155]">{v.gstTreatment}</td>
                  <td className="px-5 py-4 text-right font-semibold text-[#0f172a]">{currency(v.payables)}</td>
                  <td className="px-5 py-4 text-right text-[#334155]">{currency(v.credits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseVendors;


