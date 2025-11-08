import Head from "../components/Head";

const CreditNotes = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Credit Notes"
        description="Issue and track credit notes linked to returns or adjustments."
      />
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#1f2937]">Credit Notes</h1>
        <p className="text-[#4b5563]">
          Introduce approval flows, numbering schemes, and automation to keep credit issuance compliant.
        </p>
        <div className="border border-dashed border-[#cbd5f5] rounded-lg p-4 text-[#6366f1] bg-[#eef2ff]">
          Placeholder area – sync with accounting exports or audit trails here.
        </div>
      </div>
    </div>
  );
};

export default CreditNotes;

