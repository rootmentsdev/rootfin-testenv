import { Link } from "react-router-dom";
import Head from "../components/Head";

const SalesReturns = () => {
  return (
    <div className="min-h-screen bg-[#f8faff]">
      <Head title="Sales Returns" />

      <div className="ml-64 flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center gap-5 px-10 text-center">
        <h1 className="text-3xl font-semibold text-[#0f172a]">Sales Returns</h1>
        <p className="max-w-2xl text-base text-[#6b7280]">
          Process your product returns in few simple steps and get your inventory automatically sorted out.
          Start creating sales returns from sales orders.
        </p>
        <Link
          to="/sales/orders"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#3366ff] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244fd6]"
        >
          Go to Sales Orders
        </Link>
      </div>
    </div>
  );
};

export default SalesReturns;

