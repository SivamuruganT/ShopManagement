import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS = {
  ok: { label: "In stock", color: "var(--color-success)" },
  low: { label: "Low", color: "#d97706" },
  out: { label: "Out", color: "var(--color-danger)" }
};

export default function Inventory() {
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/reports/shops").then(setShops).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [shopId, lowOnly]);

  async function load() {
    setError("");
    try {
      const q = new URLSearchParams();
      if (shopId) q.set("shopId", shopId);
      if (search.trim()) q.set("search", search.trim());
      if (lowOnly) q.set("lowOnly", "1");
      setData(await apiRequest(`/api/reports/inventory?${q.toString()}`));
    } catch (err) {
      setError(err.message);
    }
  }

  const s = data?.summary;

  return (
    <div>
      <h1 className="page-title">Inventory</h1>
      <p className="page-subtitle">
        Read-only view of each shop's stock, as of the terminal's last sync
        {s?.lastSyncedAt ? ` (${new Date(s.lastSyncedAt).toLocaleString()})` : ""}. Edit stock in the shop terminal.
      </p>

      <div className="card" style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap", margin: "16px 0" }}>
        <div>
          <label className="label">Shop</label>
          <select className="input" value={shopId} onChange={(e) => setShopId(e.target.value)}>
            <option value="">All shops</option>
            {shops.map((sh) => (
              <option key={sh.shopId} value={sh.shopId}>
                {sh.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Name, SKU or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, paddingBottom: 10 }}>
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low / out of stock only
        </label>
        <button className="btn btn-primary" onClick={load}>
          Search
        </button>
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>{error}</div>
      )}

      {s && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 16 }}>
          {[
            ["Products", s.totalProducts, "var(--color-navy)"],
            ["Low Stock", s.lowStock, "#d97706"],
            ["Out of Stock", s.outOfStock, "var(--color-danger)"],
            ["Stock Value (at cost)", money(s.stockValue), "var(--color-primary-dark)"]
          ].map(([label, value, color]) => (
            <div key={label} className="card">
              <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {!shopId && <th>Shop</th>}
              <th>SKU</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={r.shopId + r.sku}>
                {!shopId && <td>{r.shopName}</td>}
                <td>{r.sku}</td>
                <td>{r.name}</td>
                <td>{r.category || "—"}</td>
                <td>{money(r.price)}</td>
                <td>
                  {r.stockQty} {r.unit || ""}
                </td>
                <td style={{ color: STATUS[r.status].color, fontWeight: 600 }}>{STATUS[r.status].label}</td>
              </tr>
            ))}
            {data && data.rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: "var(--color-text-muted)" }}>
                  No products synced yet. Open the terminal, then Settings → Sync Now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
