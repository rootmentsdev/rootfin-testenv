import Head from "../components/Head";

const InventoryAdjustments = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Inventory Adjustments"
        description="Track adjustments between system stock and physical counts."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Inventory Adjustments</h1>
        <p className="text-[#4b5563]">
          Use this workspace to capture cycle counts, corrections, and other stock adjustments. Integrate data
          tables or forms here to align with your inventory workflows.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – surface adjustment history and approval steps here.
        </div>
      </div>
    </div>
  );
};

export default InventoryAdjustments;

