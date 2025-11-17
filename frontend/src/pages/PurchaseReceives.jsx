import { Link } from "react-router-dom";
import { ChevronDown, MoreHorizontal } from "lucide-react";

const PurchaseReceives = () => {
  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-[#1f2937] leading-tight">
            All Purchase Receives
          </h1>
          <button className="text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/purchase/receives/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3762f9] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
          >
            <span>+</span>
            <span>New</span>
          </Link>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-semibold text-[#0f172a]">
            Record Received Purchases Accurately
          </h2>
          <p className="mt-3 text-sm text-[#64748b]">
            Log items received from your vendors.
          </p>
          <Link
            to="/purchase/receives/new"
            className="mt-6 inline-block rounded-md bg-[#3b82f6] px-6 py-3 text-sm font-semibold uppercase text-white shadow hover:bg-[#2563eb] transition-colors"
          >
            RECEIVE ITEMS
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceives;

