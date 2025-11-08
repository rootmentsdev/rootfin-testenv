import Head from "../components/Head";

const SalesInvoices = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Sales Invoices"
        description="Generate and manage invoice documents for completed orders."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Invoices</h1>
        <p className="text-[#4b5563]">
          Surface invoice queues, approval workflows, and export tools in this workspace to streamline billing.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – connect to your ERP, PDF generation, or mailing pipelines here.
        </div>
      </div>
    </div>
  );
};

export default SalesInvoices;

