import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setAdmins(await apiRequest("/api/auth/admins"));
  }

  async function addAdmin() {
    setError("");
    setInfo("");
    try {
      await apiRequest("/api/auth/admins", { method: "POST", body: { username, password } });
      setInfo(`Admin "${username}" created. Share the password with them securely.`);
      setUsername("");
      setPassword("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(a) {
    const pw = prompt(`New password for ${a.username} (min 8 characters):`);
    if (!pw) return;
    setError("");
    setInfo("");
    try {
      await apiRequest(`/api/auth/admins/${a._id}/reset-password`, { method: "POST", body: { password: pw } });
      setInfo(`Password for ${a.username} changed. They've been logged out everywhere.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(a) {
    if (!confirm(`Delete admin "${a.username}"? They lose access immediately.`)) return;
    setError("");
    setInfo("");
    try {
      await apiRequest(`/api/auth/admins/${a._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Admins</h1>
      <p className="page-subtitle">People who can log into this dashboard. Every admin has full access.</p>

      {error && (
        <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "8px 12px", borderRadius: 8, margin: "12px 0", fontSize: 13 }}>
          {error}
        </div>
      )}
      {info && (
        <div style={{ background: "var(--color-primary-light)", color: "var(--color-primary-dark)", padding: "8px 12px", borderRadius: 8, margin: "12px 0", fontSize: 13 }}>
          {info}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Add Admin</h3>
        <label className="label">Username</label>
        <input className="input" style={{ marginBottom: 10 }} value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="label">Password (min 8 characters)</label>
        <input className="input" type="password" style={{ marginBottom: 14 }} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary" onClick={addAdmin}>
          Create Admin
        </button>
      </div>

      <div className="card" style={{ marginTop: 16, overflowX: "auto" }}>
        <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Current Admins</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a._id}>
                <td>
                  {a.username} {a.isYou && <em style={{ color: "var(--color-text-muted)" }}>(you)</em>}
                </td>
                <td>{a.lastLogin ? new Date(a.lastLogin).toLocaleString() : "Never"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-secondary" style={{ padding: "4px 10px", marginRight: 6 }} onClick={() => resetPassword(a)}>
                    Reset Password
                  </button>
                  {!a.isYou && (
                    <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => remove(a)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
