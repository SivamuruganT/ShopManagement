import React, { useState } from "react";
import { login, bootstrapAdmin } from "../api.js";

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // 'login' | 'bootstrap'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin() {
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitBootstrap() {
    setError("");
    setInfo("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await bootstrapAdmin(username.trim(), password);
      setInfo("Admin account created. You can log in now.");
      setMode("login");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
      <div className="card" style={{ width: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <span style={{ fontSize: 19, fontWeight: 800 }}>
            <span style={{ color: "var(--color-primary)" }}>EC</span>
            <span style={{ color: "var(--color-navy)" }}>Bill</span>
          </span>
        </div>
        <h2 style={{ margin: "8px 0 4px", color: "var(--color-navy)" }}>{mode === "login" ? "Admin Login" : "First-Time Setup"}</h2>
        <p style={{ color: "var(--color-text-muted)", marginTop: 0, fontSize: 13 }}>
          {mode === "login" ? "Sign in to view sales reports across your shops." : "No admin account exists yet on this deployment. Create the first one."}
        </p>

        <label className="label">Username</label>
        <input className="input" style={{ marginBottom: 12 }} value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="label">Password</label>
        <input className="input" style={{ marginBottom: 12 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {mode === "bootstrap" && (
          <>
            <label className="label">Confirm Password</label>
            <input className="input" style={{ marginBottom: 12 }} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </>
        )}

        {error && (
          <div style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: "var(--color-success-bg)", color: "var(--color-success)", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
            {info}
          </div>
        )}

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading} onClick={mode === "login" ? submitLogin : submitBootstrap}>
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Admin Account"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "bootstrap" : "login");
            setError("");
            setInfo("");
          }}
          style={{ width: "100%", marginTop: 10, border: "none", background: "transparent", color: "var(--color-text-muted)", fontSize: 12.5, textDecoration: "underline" }}
        >
          {mode === "login" ? "First time deploying this? Set up the first admin account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
