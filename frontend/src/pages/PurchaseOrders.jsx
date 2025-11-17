import { Link } from "react-router-dom";
import Head from "../components/Head";

const Pill = ({ children }) => (
  <div className="inline-flex items-center gap-2 rounded-xl border border-[#93c5fd] bg-white px-4 py-2 text-xs font-semibold text-[#1e3a8a] shadow-sm">
    {children}
  </div>
);

const PurchaseOrders = () => {
  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <Head
        title="All Purchase Orders"
        description=""
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#2563eb] hover:bg-[#eef2ff]">
              In Transit Receives
            </button>
            <Link
              to="/purchase/orders/new"
              className="rounded-md bg-[#3762f9] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
            >
              New
            </Link>
          </div>
        }
      />

      <div className="mx-auto mt-16 max-w-3xl text-center">
        <h2 className="text-2xl font-semibold text-[#0f172a]">
          Start Managing Your Purchase Activities!
        </h2>
        <p className="mt-3 text-[#64748b]">
          Create, customize, and send professional Purchase Orders to your vendors.
        </p>
        <Link
          to="/purchase/orders/new"
          className="mt-6 inline-block rounded-md bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[#2563eb]"
        >
          CREATE NEW PURCHASE ORDER
        </Link>
      </div>

      <div className="mx-auto mt-16 max-w-5xl text-center">
        <h3 className="text-lg font-semibold text-[#0f172a]">
          Life cycle of a Purchase Order
        </h3>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <Pill>
            <span>RAISE PURCHASE ORDER</span>
          </Pill>
          <span className="text-[#94a3b8] text-xs">CONVERT TO OPEN</span>
          <Pill>
            <span>RECEIVE GOODS</span>
          </Pill>
          <Pill>
            <span>CONVERT TO BILL</span>
          </Pill>
          <Pill>
            <span>RECORD PAYMENT</span>
          </Pill>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;


