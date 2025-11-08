import Head from "../components/Head";

const InventoryPackages = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Inventory Packages"
        description="Manage package builds, contents, and fulfillment readiness."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Packages</h1>
        <p className="text-[#4b5563]">
          Configure and track package definitions, pick lists, and staging progress. Populate this canvas with
          the components your operations team needs.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – plug in package status dashboards or scan workflows here.
        </div>
      </div>
    </div>
  );
};

export default InventoryPackages;

