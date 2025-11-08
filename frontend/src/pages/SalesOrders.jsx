import Head from "../components/Head";

const SalesOrders = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Sales Orders"
        description="Plan and track outbound orders before fulfillment."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Sales Orders</h1>
        <p className="text-[#4b5563]">
          Build out your workbench for creating, editing, and prioritizing sales orders. Add kanban boards,
          allocation widgets, or integration hooks here.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – display order queues, status timelines, or quick actions.
        </div>
      </div>
    </div>
  );
};

export default SalesOrders;

