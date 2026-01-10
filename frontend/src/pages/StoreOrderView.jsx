import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Head from "../components/Head";
import baseUrl from "../api/api";

const StoreOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  
  const [loading, setLoading] = useState(true);
  const [storeOrder, setStoreOrder] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadStoreOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/inventory/store-orders/${id}`);
        if (!response.ok) throw new Error("Failed to load store order");
        const data = await response.json();
        setStoreOrder(data);
      } catch (err) {
        console.error("Error loading store order:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadStoreOrder();
    }
  }, [id, API_URL]);
  
  if (loading) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen flex items-center justify-center">
        <div className="text-[#64748b]">Loading store order...</div>
      </div>
    );
  }
  
  if (error || !storeOrder) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen flex items-center justify-center">
        <div className="text-[#64748b]">{error || "Store order not found"}</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Head
        title="Store Order Details"
        description="View store order details and approve/reject."
        actions={
          <Link
            to="/inventory/store-orders"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            Back to Store Orders
          </Link>
        }
      />
      
      <div className="ml-64 px-10 pb-16 pt-8">
        <div className="rounded-3xl border border-[#e6ebfa] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ff] px-10 py-6">
            <div className="space-y-1">
              <h1 className="text-[20px] font-semibold text-[#101828]">
                Store Order: {storeOrder.orderNumber || "N/A"}
              </h1>
              <p className="text-sm text-[#6c728a]">
                View and manage store order details
              </p>
            </div>
          </div>
          
          <div className="px-10 py-12">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] mb-2">Order Number</p>
                  <p className="text-sm text-[#101828]">{storeOrder.orderNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] mb-2">Date</p>
                  <p className="text-sm text-[#101828]">{storeOrder.date ? new Date(storeOrder.date).toLocaleDateString() : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] mb-2">Store Warehouse</p>
                  <p className="text-sm text-[#101828]">{storeOrder.storeWarehouse || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] mb-2">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    storeOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    storeOrder.status === 'approved' ? 'bg-green-100 text-green-800' :
                    storeOrder.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {storeOrder.status?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
              
              {storeOrder.reason && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] mb-2">Reason</p>
                  <p className="text-sm text-[#101828]">{storeOrder.reason}</p>
                </div>
              )}
              
              {storeOrder.items && storeOrder.items.length > 0 && (
                <div className="rounded-2xl border border-[#edf1ff] bg-[#fcfdff]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ff] px-8 py-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a94b0]">Items</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed border-collapse text-sm text-[#111827]">
                      <thead className="bg-white text-[11px] uppercase tracking-[0.28em] text-[#9aa2bd]">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Item Name</th>
                          <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">SKU</th>
                          <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Quantity Requested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeOrder.items.map((item, index) => (
                          <tr key={index} className="border-t border-[#f0f3ff]">
                            <td className="px-6 py-4">{item.itemName || "N/A"}</td>
                            <td className="px-6 py-4">{item.itemSku || "N/A"}</td>
                            <td className="px-6 py-4">{item.quantity || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreOrderView;
