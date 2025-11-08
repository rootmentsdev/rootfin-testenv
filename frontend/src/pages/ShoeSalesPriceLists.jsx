import Head from "../components/Head";

const ShoeSalesPriceLists = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head title="Shoe Sales - Price Lists" description="Maintain pricing strategies for shoe inventory." />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Shoe Sales Price Lists</h1>
        <p className="text-[#4b5563]">
          Build and maintain dynamic price lists for your shoe catalog. Extend this page with pricing tables,
          bulk update tools, and discount configurations as needed.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – plug in your pricing workflows or integrations here.
        </div>
      </div>
    </div>
  );
};

export default ShoeSalesPriceLists;
