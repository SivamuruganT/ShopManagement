import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import { localDate } from "../components/FilterBar.jsx";

function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setError("");
    try {
      const today = localDate();
      const res = await apiRequest(`/api/reports/overview?start=${today}&end=${today}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Overview</h1>
      <p className="page-subtitle">
        Today's sales across all shops &middot;{" "}
        {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.
        For other dates, use Sales Records or Profit &amp; Loss.
      </p>

      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={load}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>{error}</div>
      )}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            {[
              ["Today's Revenue", data.totalRevenue, "var(--color-success)"],
              ["Today's Bills", data.totalBills, "var(--color-navy)"],
              ["Today's Expenses", data.totalExpenses, "#d97706"],
              ["Today's Net Profit", data.netProfit, "var(--color-primary-dark)"]
            ].map(([label, value, color]) => (
              <div key={label} className="card">
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{label === "Today's Bills" ? value : money(value)}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Revenue by Shop</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Bills</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byShop.map((s) => (
                  <tr key={s.shopId}>
                    <td>{s.shopName}</td>
                    <td>{s.bills}</td>
                    <td>{money(s.revenue)}</td>
                  </tr>
                ))}
                {data.byShop.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: "var(--color-text-muted)" }}>
                      No synced sales today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
