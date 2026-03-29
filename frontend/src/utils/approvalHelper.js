import baseUrl from "../api/api";

const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

/**
 * Submit an approval request to the super admin.
 * Returns { success: true } if submitted, throws on error.
 */
export const submitApprovalRequest = async ({ type, entityId, entityRef, payload, summary }) => {
  const userStr = localStorage.getItem("rootfinuser");
  const user = userStr ? JSON.parse(userStr) : {};

  const res = await fetch(`${API_URL}/api/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      entityId: entityId || null,
      entityRef: entityRef || null,
      payload: payload || {},
      summary,
      requestedBy: user.email || "",
      requestedByName: user.username || user.email || "",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to submit approval request");
  }

  return await res.json();
};

/**
 * Check if current user is super admin.
 */
export const isSuperAdmin = () => {
  const userStr = localStorage.getItem("rootfinuser");
  const user = userStr ? JSON.parse(userStr) : {};
  return (user.power || "").toLowerCase() === "superadmin";
};
