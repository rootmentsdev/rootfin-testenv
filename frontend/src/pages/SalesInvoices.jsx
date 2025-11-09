import { Link } from "react-router-dom";
import Head from "../components/Head";

const mockInvoices = [
  {
    date: "09/11/2025",
    invoice: "INV-009192",
    order: "SO-10112",
    customer: "Harshadh",
    status: "Paid",
    dueDate: "09/11/2025",
    amount: "₹900.00",
  },
  {
    date: "09/11/2025",
    invoice: "INV-009191",
    order: "SO-10111",
    customer: "Athul",
    status: "Paid",
    dueDate: "09/11/2025",
    amount: "₹900.00",
  },
  {
    date: "09/11/2025",
    invoice: "INV-009190",
    order: "SO-10110",
    customer: "Erikon",
    status: "Paid",
    dueDate: "09/11/2025",
    amount: "₹2,000.00",
  },
  {
    date: "09/11/2025",
    invoice: "INV-009189",
    order: "SO-10109",
    customer: "Arun",
    status: "Paid",
    dueDate: "09/11/2025",
    amount: "₹800.00",
  },
  {
    date: "08/11/2025",
    invoice: "INV-009188",
    order: "SO-10108",
    customer: "Shibin",
    status: "Paid",
    dueDate: "08/11/2025",
    amount: "₹800.00",
  },
  {
    date: "08/11/2025",
    invoice: "INV-009187",
    order: "SO-10107",
    customer: "Amal",
    status: "Paid",
    dueDate: "08/11/2025",
    amount: "₹900.00",
  },
  {
    date: "08/11/2025",
    invoice: "INV-009186",
    order: "SO-10106",
    customer: "Sanju",
    status: "Paid",
    dueDate: "08/11/2025",
    amount: "₹1,700.00",
  },
];

const SalesInvoices = () => {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <Head
        title="Sales Invoices"
        description="Generate and manage invoice documents for completed orders."
      />

      <div className="ml-64 px-10 pb-16 pt-8">
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-[#111827]">All Invoices</h1>
              <p className="text-sm text-[#6b7280]">Review your invoicing activity and keep tabs on payments.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/sales/invoices/new"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-transparent bg-[#3366ff] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244fd6] focus:outline-none focus:ring-2 focus:ring-[#244fd6]/40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
                New
              </Link>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d7def4] bg-white text-[#4b5563] shadow-sm transition hover:bg-[#f1f3fd]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 5.25h10.5m-10.5 13.5h10.5M5.25 7.5h13.5v9H5.25v-9z"
                  />
                </svg>
              </button>
            </div>
          </header>

          <section className="rounded-3xl border border-[#dfe5f5] bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-4 border-b border-[#e7ecf8] px-8 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-xl bg-[#f0f4ff] px-4 py-3 text-sm font-medium text-[#415079]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#415079] shadow-sm">
                    📊
                  </span>
                  Insights on Invoicing
                </div>
                <button className="text-sm font-medium text-[#4f46e5] hover:text-[#4338ca]">
                  Show Details
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#eef1fb] bg-[#f9fbff] text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94b0]">
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                      />
                    </th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Invoice#</th>
                    <th className="px-6 py-4 text-left">Order Number</th>
                    <th className="px-6 py-4 text-left">Customer Name</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Due Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1fb] text-sm text-[#1f2937]">
                  {mockInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.invoice}
                      className={`${index === 5 ? "bg-[#f7f9ff]" : "bg-white"} hover:bg-[#f2f5ff]`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#4b5563]">{invoice.date}</td>
                      <td className="px-6 py-4">
                        <Link
                          to="#"
                          className="font-semibold text-[#3b82f6] hover:text-[#2563eb]"
                        >
                          {invoice.invoice}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#4b5563]">{invoice.order}</td>
                      <td className="px-6 py-4 capitalize text-[#1f2937]">{invoice.customer}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#10b981]">
                          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#4b5563]">{invoice.dueDate}</td>
                      <td className="px-6 py-4 text-right font-semibold text-[#1f2937]">
                        {invoice.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoices;

