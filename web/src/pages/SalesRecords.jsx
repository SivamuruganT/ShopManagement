import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import FilterBar, { defaultRange } from "../components/FilterBar.jsx";

function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SalesRecords() {
  const initial = defaultRange();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    apiRequest("/api/reports/shops").then(setShops).catch(() => {});
    load(1);
  }, []);

  async function load(targetPage) {
    setError("");
    try {
      const p = targetPage ?? page;
      const params = new URLSearchParams({ start: startDate, end: endDate, page: p, limit: 25 });
      if (shopId) params.set("shopId", shopId);
      const res = await apiRequest(`/api/reports/sales?${params.toString()}`);
      setResult(res);
      setPage(p);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Sales Records</h1>
      <p className="page-subtitle">Detailed sales across all shops, or drill into one.</p>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <FilterBar
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          shops={shops}
          shopId={shopId}
          onShopChange={setShopId}
          onApply={() => load(1)}
        />
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>{error}</div>
      )}

      {result && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: "var(--color-navy)" }}>{result.total} bills</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Shop</th>
                <th>Date & Time</th>
                <th>Payment</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((b) => (
                <tr key={b.recordKey}>
                  <td>#{b.billNo}</td>
                  <td>{b.shopName}</td>
                  <td>{new Date(b.createdAt).toLocaleString()}</td>
                  <td>{b.paymentMode}</td>
                  <td>{money(b.totalAmount)}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => setSelectedBill(b)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--color-text-muted)" }}>
                    No records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {result.totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)}>
                Previous
              </button>
              <span style={{ alignSelf: "center", fontSize: 13, color: "var(--color-text-muted)" }}>
                Page {page} of {result.totalPages}
              </span>
              <button className="btn btn-secondary" disabled={page >= result.totalPages} onClick={() => load(page + 1)}>
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {selectedBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,35,63,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "var(--color-navy)" }}>Bill #{selectedBill.billNo}</h3>
              <button onClick={() => setSelectedBill(null)} style={{ border: "none", background: "transparent", fontSize: 18 }}>
                ✕
              </button>
            </div>
            <p style={{ color: "var(--color-text-muted)", marginTop: 0 }}>
              {selectedBill.shopName} · {new Date(selectedBill.createdAt).toLocaleString()} · Cashier: {selectedBill.cashierName}
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(selectedBill.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.name}</td>
                    <td>{it.qty}</td>
                    <td>{money(it.unitPrice)}</td>
                    <td>{money(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, textAlign: "right", fontWeight: 800, color: "var(--color-navy)" }}>
              Total: {money(selectedBill.totalAmount)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
