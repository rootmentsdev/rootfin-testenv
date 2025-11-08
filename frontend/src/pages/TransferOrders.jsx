import Head from "../components/Head";

const TransferOrders = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Transfer Orders"
        description="Coordinate stock transfers between warehouses or stores."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Transfer Orders</h1>
        <p className="text-[#4b5563]">
          Use this section to monitor in-transit quantities, receiving tasks, and transfer confirmations.
          Extend it with tables, statuses, and forms suited to your logistics process.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – integrate routing details, carrier references, or audit logs here.
        </div>
      </div>
    </div>
  );
};

export default TransferOrders;

