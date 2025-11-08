import Head from "../components/Head";

const PaymentsReceived = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Payments Received"
        description="Reconcile incoming payments against outstanding invoices."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Payments Received</h1>
        <p className="text-[#4b5563]">
          Plug in bank feeds, allocation tools, and settlement dashboards to keep receivables current.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – surface payment batches, matching suggestions, or exception queues here.
        </div>
      </div>
    </div>
  );
};

export default PaymentsReceived;

