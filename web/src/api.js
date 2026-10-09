const REFRESH_KEY = "ecbill_refresh_token";

let accessToken = null; // kept in memory only, never persisted - re-derived from the refresh token on reload

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn() {
  return !!getRefreshToken();
}

export function logout() {
  accessToken = null;
  setRefreshToken(null);
}

export async function login(username, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed.");
  accessToken = data.accessToken;
  setRefreshToken(data.refreshToken);
  return data;
}

export async function bootstrapAdmin(username, password) {
  const res = await fetch("/api/auth/bootstrap-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Setup failed.");
  return data;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("Not logged in.");
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  const data = await res.json();
  if (!res.ok) {
    setRefreshToken(null);
    throw new Error(data.error || "Session expired. Please log in again.");
  }
  accessToken = data.accessToken;
  return accessToken;
}

/**
 * Every call: attach the in-memory access token (refreshing it first if we
 * don't have one yet, e.g. right after a page reload). On a 401 (expired
 * mid-session), refresh once and retry - this is what makes the 15-minute
 * access token expiry invisible during normal use instead of kicking the
 * admin back to login every 15 minutes.
 */
export async function apiRequest(path, options = {}) {
  if (path.startsWith("/api/reports/")) {
    const tz = -new Date().getTimezoneOffset(); // minutes ahead of UTC (IST = 330)
    path += (path.includes("?") ? "&" : "?") + "tz=" + tz;
  }
  if (!accessToken) {
    await refreshAccessToken();
  }

  async function doFetch() {
    return fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }

  let res = await doFetch();
  if (res.status === 401) {
    await refreshAccessToken();
    res = await doFetch();
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
