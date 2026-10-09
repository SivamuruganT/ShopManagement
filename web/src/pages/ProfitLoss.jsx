import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import FilterBar, { defaultRange } from "../components/FilterBar.jsx";

function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProfitLoss() {
  const initial = defaultRange();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/reports/shops").then(setShops).catch(() => {});
    load();
  }, []);

  async function load() {
    setError("");
    try {
      const params = new URLSearchParams({ start: startDate, end: endDate });
      if (shopId) params.set("shopId", shopId);
      const res = await apiRequest(`/api/reports/pnl?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Profit & Loss</h1>
      <p className="page-subtitle">
        {shopId ? "For the selected shop" : "Across all shops"}, for the selected period. Cost of goods sold is based on
        each item's cost price at the time it was sold.
      </p>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <FilterBar
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          shops={shops}
          shopId={shopId}
          onShopChange={setShopId}
          onApply={load}
        />
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>{error}</div>
      )}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            {[
              ["Revenue", data.revenue, "var(--color-success)"],
              ["Cost of Goods Sold", data.cogs, "#2563eb"],
              ["Total Expenses", data.totalExpenses, "#d97706"],
              ["Net Profit", data.netProfit, "var(--color-primary-dark)"]
            ].map(([label, value, color]) => (
              <div key={label} className="card">
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{money(value)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Expense Breakdown</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenseBreakdown.map((e) => (
                    <tr key={e.category}>
                      <td>{e.category}</td>
                      <td>{money(e.amount)}</td>
                    </tr>
                  ))}
                  {data.expenseBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ color: "var(--color-text-muted)" }}>
                        No expenses in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Summary</h3>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td>Revenue</td>
                    <td>{money(data.revenue)}</td>
                  </tr>
                  <tr>
                    <td>Cost of Goods Sold</td>
                    <td>{money(data.cogs)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700 }}>
                    <td>Gross Profit</td>
                    <td>{money(data.grossProfit)}</td>
                  </tr>
                  <tr>
                    <td>Total Expenses</td>
                    <td>{money(data.totalExpenses)}</td>
                  </tr>
                  <tr style={{ fontWeight: 800, color: "var(--color-primary-dark)" }}>
                    <td>Net Profit</td>
                    <td>{money(data.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
