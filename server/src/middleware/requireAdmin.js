const { verifyToken } = require("../auth");

/**
 * Enforces the "admin login must be authenticated with JWT session expiry"
 * requirement: the access token signed in auth.js expires in 15 minutes
 * (see ACCESS_TOKEN_TTL). jwt.verify below throws TokenExpiredError once
 * that window passes, so an expired session is rejected here rather than
 * trusted indefinitely - the web app's api.js handles the resulting 401 by
 * silently using the refresh token to get a new one, or forcing re-login
 * if the refresh token has also expired (7 days).
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing access token." });
  }
  try {
    const payload = verifyToken(token);
    if (payload.type !== "access") throw new Error("Wrong token type.");
    req.adminId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}

module.exports = requireAdmin;
