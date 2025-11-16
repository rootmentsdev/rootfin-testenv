import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import baseUrl from "../api/api";

const API_ROOT = (baseUrl?.baseUrl || "").replace(/\/$/, "");

const InactiveItems = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [moveTargets, setMoveTargets] = useState({}); // itemId -> targetGroupId
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [groupsRes, itemsRes] = await Promise.all([
        fetch(`${API_ROOT}/api/shoe-sales/item-groups`),
        fetch(`${API_ROOT}/api/shoe-sales/items`),
      ]);
      if (!groupsRes.ok) throw new Error("Failed to load item groups");
      if (!itemsRes.ok) throw new Error("Failed to load items");
      const groupsData = await groupsRes.json();
      const itemsData = await itemsRes.json();
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const inactiveGroups = useMemo(
    () => groups.filter((g) => (g?.isActive === false) || (String(g?.isActive).toLowerCase() === "false")),
    [groups]
  );
  const inactiveItems = useMemo(
    () => items.filter((i) => (i?.isActive === false) || (String(i?.isActive).toLowerCase() === "false")),
    [items]
  );
  const activeGroups = useMemo(
    () => groups.filter((g) => !(g?.isActive === false || String(g?.isActive).toLowerCase() === "false")),
    [groups]
  );

  const activateGroup = async (groupId) => {
    try {
      setSaving(true);
      const group = groups.find((g) => (g._id || g.id) === groupId);
      if (!group) return;
      const payload = {
        name: group.name,
        sku: group.sku || "",
        itemType: group.itemType || "goods",
        unit: group.unit || "",
        manufacturer: group.manufacturer || "",
        brand: group.brand || "",
        taxPreference: group.taxPreference || "taxable",
        intraStateTaxRate: group.intraStateTaxRate || "",
        interStateTaxRate: group.interStateTaxRate || "",
        inventoryValuationMethod: group.inventoryValuationMethod || "",
        createAttributes: group.createAttributes !== undefined ? group.createAttributes : true,
        attributeRows: group.attributeRows || [],
        sellable: group.sellable !== undefined ? group.sellable : true,
        purchasable: group.purchasable !== undefined ? group.purchasable : true,
        trackInventory: group.trackInventory !== undefined ? group.trackInventory : false,
        items: group.items || [],
        stock: group.stock || 0,
        reorder: group.reorder || "",
        isActive: true,
      };
      const res = await fetch(`${API_ROOT}/api/shoe-sales/item-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to activate group");
      await fetchData();
    } catch (e) {
      alert(e.message || "Failed to activate group");
    } finally {
      setSaving(false);
    }
  };

  const activateItem = async (itemId) => {
    try {
      setSaving(true);
      const item = items.find((i) => (i._id || i.id) === itemId);
      if (!item) return;
      const res = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isActive: true }),
      });
      if (!res.ok) throw new Error("Failed to activate item");
      await fetchData();
    } catch (e) {
      alert(e.message || "Failed to activate item");
    } finally {
      setSaving(false);
    }
  };

  const moveItemToGroup = async (itemId) => {
    const targetGroupId = moveTargets[itemId];
    if (!targetGroupId) {
      alert("Please select a target group.");
      return;
    }
    try {
      setSaving(true);
      // Fetch the target group
      const targetRes = await fetch(`${API_ROOT}/api/shoe-sales/item-groups/${targetGroupId}`);
      if (!targetRes.ok) throw new Error("Failed to fetch target group");
      const target = await targetRes.json();

      const item = items.find((i) => (i._id || i.id) === itemId);
      if (!item) throw new Error("Item not found");

      // Prepare group item object
      const groupItem = {
        name: item.itemName,
        sku: item.sku || "",
        costPrice: item.costPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        upc: item.upc || "",
        hsnCode: item.hsnCode || "",
        isbn: item.isbn || "",
        reorderPoint: item.reorderPoint || "",
        stock: 0,
        warehouseStocks: item.warehouseStocks || [],
        attributeCombination: [],
      };

      const updatedItems = [...(target.items || []), groupItem];

      const payload = {
        name: target.name,
        sku: target.sku || "",
        itemType: target.itemType || "goods",
        unit: target.unit || "",
        manufacturer: target.manufacturer || "",
        brand: target.brand || "",
        taxPreference: target.taxPreference || "taxable",
        intraStateTaxRate: target.intraStateTaxRate || "",
        interStateTaxRate: target.interStateTaxRate || "",
        inventoryValuationMethod: target.inventoryValuationMethod || "",
        createAttributes: target.createAttributes !== undefined ? target.createAttributes : true,
        attributeRows: target.attributeRows || [],
        sellable: target.sellable !== undefined ? target.sellable : true,
        purchasable: target.purchasable !== undefined ? target.purchasable : true,
        trackInventory: target.trackInventory !== undefined ? target.trackInventory : false,
        items: updatedItems,
        stock: target.stock || 0,
        reorder: target.reorder || "",
        isActive: target.isActive !== false,
      };

      // Update group
      const updRes = await fetch(`${API_ROOT}/api/shoe-sales/item-groups/${targetGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!updRes.ok) throw new Error("Failed to add item to group");

      // Delete or mark standalone item as moved/inactive
      await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});

      await fetchData();
      alert("Item moved to group successfully.");
    } catch (e) {
      alert(e.message || "Failed to move item");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-64 flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#cbd5f5] border-t-[#3762f9]" />
          <p className="text-sm font-medium text-[#475569]">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6 space-y-8">
      <div className="rounded-3xl border border-[#e1e5f5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1f2937]">Inactive Item Groups</h2>
          <Link to="/shoe-sales/item-groups" className="text-sm text-[#3762f9] hover:underline">Go to Groups</Link>
        </div>
        {inactiveGroups.length === 0 ? (
          <p className="text-sm text-[#64748b]">No inactive groups.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#eef2ff]">
            <table className="min-w-full">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">Items</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2ff] bg-white">
                {inactiveGroups.map((g) => {
                  const id = g._id || g.id;
                  return (
                    <tr key={id}>
                      <td className="px-4 py-2 text-sm text-[#1f2937]">{g.name}</td>
                      <td className="px-4 py-2 text-sm text-[#1f2937]">{Array.isArray(g.items) ? g.items.length : 0}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => activateGroup(id)}
                          disabled={saving}
                          className="no-blue-button inline-flex items-center rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                        >
                          Activate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-[#e1e5f5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1f2937]">Inactive Standalone Items</h2>
          <Link to="/shoe-sales/items" className="text-sm text-[#3762f9] hover:underline">Go to Items</Link>
        </div>
        {inactiveItems.length === 0 ? (
          <p className="text-sm text-[#64748b]">No inactive items.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#eef2ff]">
            <table className="min-w-full">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">Move To Group</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2ff] bg-white">
                {inactiveItems.map((it) => {
                  const id = it._id || it.id;
                  return (
                    <tr key={id}>
                      <td className="px-4 py-2 text-sm text-[#1f2937]">{it.itemName || "Untitled"}</td>
                      <td className="px-4 py-2 text-sm text-[#1f2937]">{it.sku || "—"}</td>
                      <td className="px-4 py-2">
                        <select
                          className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm text-[#1f2937]"
                          value={moveTargets[id] || ""}
                          onChange={(e) => setMoveTargets({ ...moveTargets, [id]: e.target.value })}
                        >
                          <option value="">Select group…</option>
                          {activeGroups.map((g) => (
                            <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          onClick={() => activateItem(id)}
                          disabled={saving}
                          className="no-blue-button inline-flex items-center rounded-md bg-[#16a34a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#15803d] disabled:opacity-50"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => moveItemToGroup(id)}
                          disabled={saving || !moveTargets[id]}
                          className="no-blue-button inline-flex items-center rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                        >
                          Move to Group
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InactiveItems;


