import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState(null); // { shopId, name, apiKey } - shown once
  const [retentionResult, setRetentionResult] = useState(null);
  const [retentionLoading, setRetentionLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await apiRequest("/api/reports/shops");
    setShops(res);
  }

  async function createShop() {
    setError("");
    if (!shopId.trim() || !name.trim()) {
      setError("Shop ID and Name are required.");
      return;
    }
    try {
      const res = await apiRequest("/api/shops", { method: "POST", body: { shopId: shopId.trim(), name: name.trim(), address } });
      setNewKey(res);
      setShopId("");
      setName("");
      setAddress("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function regenerateKey(sid) {
    if (!confirm(`Regenerate the API key for ${sid}? Every terminal on this shop will need the new key re-entered into Settings before they can sync again.`)) return;
    const res = await apiRequest(`/api/shops/${sid}/regenerate-key`, { method: "POST" });
    setNewKey(res);
  }

  async function runRetentionSweep() {
    setRetentionLoading(true);
    setRetentionResult(null);
    try {
      const res = await apiRequest("/api/maintenance/run-retention-sweep", { method: "POST" });
      setRetentionResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetentionLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Shops</h1>
      <p className="page-subtitle">
        Register a shop here to get an API key, then enter the Shop ID and key into that shop's terminal under Settings
        → Sync. Use the exact Shop ID the terminal already generated during its own setup wizard, so its local identity
        lines up with this record.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Registered Shops</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop ID</th>
                <th>Name</th>
                <th>Key</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.shopId}>
                  <td>{s.shopId}</td>
                  <td>{s.name}</td>
                  <td>•••• {s.apiKeyPreview}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => regenerateKey(s.shopId)}>
                      Regenerate Key
                    </button>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--color-text-muted)" }}>
                    No shops registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Register a Shop</h3>
            <label className="label">Shop ID</label>
            <input
              className="input"
              style={{ marginBottom: 10 }}
              placeholder="e.g. SHP-A1B2C3D4 (from the terminal's Settings page)"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
            />
            <label className="label">Name</label>
            <input className="input" style={{ marginBottom: 10 }} value={name} onChange={(e) => setName(e.target.value)} />
            <label className="label">Address (optional)</label>
            <input className="input" style={{ marginBottom: 14 }} value={address} onChange={(e) => setAddress(e.target.value)} />
            {error && (
              <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={createShop}>
              Create Shop & Generate Key
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Data Retention</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 0 }}>
              Runs automatically every night. Sales and expense records older than 2 years are permanently deleted.
            </p>
            <button className="btn btn-secondary" style={{ width: "100%" }} disabled={retentionLoading} onClick={runRetentionSweep}>
              {retentionLoading ? "Running..." : "Run Cleanup Now"}
            </button>
            {retentionResult && (
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-muted)" }}>
                Deleted {retentionResult.billsDeleted} bills and {retentionResult.expensesDeleted} expenses older than{" "}
                {new Date(retentionResult.cutoffDate).toLocaleDateString()}.
              </div>
            )}
          </div>
        </div>
      </div>

      {newKey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,35,63,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 460 }}>
            <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>API Key for {newKey.name || newKey.shopId}</h3>
            <p style={{ color: "var(--color-danger)", fontSize: 13 }}>
              This is shown only once. Copy it now and paste it into the terminal's Settings → Sync setup.
            </p>
            <div
              style={{
                background: "#f4f8f9",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: 12,
                fontFamily: "monospace",
                fontSize: 13,
                wordBreak: "break-all",
                marginBottom: 14
              }}
            >
              {newKey.apiKey}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => {
                navigator.clipboard?.writeText(newKey.apiKey);
                setNewKey(null);
              }}
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
