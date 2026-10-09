import React, { useState } from "react";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "🏠" },
  { key: "sales", label: "Sales Records", icon: "🧾" },
  { key: "pnl", label: "Profit & Loss", icon: "📊" },
  { key: "inventory", label: "Inventory", icon: "📦" },
  { key: "shops", label: "Shops", icon: "🏬" },
  { key: "admins", label: "Admins", icon: "👤" }
];

export default function Layout({ activePage, onNavigate, onLogout, children }) {
  const [open, setOpen] = useState(false);

  const go = (key) => {
    onNavigate(key);
    setOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <button className="hamburger" aria-label="Open menu" onClick={() => setOpen(true)}>
          ☰
        </button>
        <span className="mobile-brand">
          <span style={{ color: "var(--color-primary)" }}>EC</span>
          <span style={{ color: "var(--color-navy)" }}>Bill</span>
        </span>
      </header>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={"sidebar" + (open ? " open" : "")}>
        <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🛒</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>
                <span style={{ color: "var(--color-primary)" }}>EC</span>
                <span style={{ color: "var(--color-navy)" }}>Bill</span>
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--color-text-muted)", marginTop: 2 }}>ADMIN DASHBOARD</div>
          </div>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {NAV_ITEMS.map((item) => {
            const active = item.key === activePage;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  marginBottom: 2,
                  border: "none",
                  borderRadius: 8,
                  background: active ? "var(--color-primary-light)" : "transparent",
                  color: active ? "var(--color-primary-dark)" : "var(--color-text)",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  textAlign: "left"
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16 }}>
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}
