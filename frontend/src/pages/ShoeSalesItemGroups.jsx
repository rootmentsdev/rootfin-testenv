import Head from "../components/Head";

const ShoeSalesItemGroups = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head title="Shoe Sales - Item Groups" description="Organize shoe inventory into logical groups." />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Shoe Sales Item Groups</h1>
        <p className="text-[#4b5563]">
          Configure and manage groupings for shoe items — such as collections, brands, or categories —
          to streamline reporting and pricing.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – add your group management components, tables, or forms here.
        </div>
      </div>
    </div>
  );
};

export default ShoeSalesItemGroups;
