import Head from "../components/Head";

const SalesReturns = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Sales Returns"
        description="Handle customer returns, inspections, and credit eligibility."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Sales Returns</h1>
        <p className="text-[#4b5563]">
          Build RMA workflows, condition assessments, and restocking actions within this workspace.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – connect triage queues, inspection checklists, or refund logic here.
        </div>
      </div>
    </div>
  );
};

export default SalesReturns;

