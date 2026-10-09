import React from "react";

const MAX_RANGE_DAYS = 2 * 365;

// Local-date formatting (toISOString would give the UTC date, which is
// yesterday for the first 5.5 hours of an Indian day).
export function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function defaultRange() {
  return { start: localDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), end: localDate() };
}

export function earliestAllowedDate() {
  return localDate(new Date(Date.now() - MAX_RANGE_DAYS * 24 * 60 * 60 * 1000));
}

export default function FilterBar({ startDate, endDate, onStartChange, onEndChange, shops, shopId, onShopChange, onApply }) {
  const minDate = earliestAllowedDate();
  return (
    <div className="card" style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
      <div>
        <label className="label">Start Date</label>
        <input className="input" type="date" min={minDate} value={startDate} onChange={(e) => onStartChange(e.target.value)} />
      </div>
      <div>
        <label className="label">End Date</label>
        <input className="input" type="date" min={minDate} max={localDate()} value={endDate} onChange={(e) => onEndChange(e.target.value)} />
      </div>
      {shops && (
        <div>
          <label className="label">Shop</label>
          <select className="input" value={shopId} onChange={(e) => onShopChange(e.target.value)}>
            <option value="">All Shops</option>
            {shops.map((s) => (
              <option key={s.shopId} value={s.shopId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button className="btn btn-primary" onClick={onApply}>
        Apply
      </button>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", alignSelf: "center" }}>
        Max range: 2 years. Data older than that is periodically removed.
      </div>
    </div>
  );
}
