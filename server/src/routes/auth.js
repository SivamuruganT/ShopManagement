const express = require("express");
const { AdminUser } = require("../db");
const { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyToken } = require("../auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Only works when zero admin users exist yet - this is how you create the
// very first login on a fresh deployment, without needing direct DB access.
// Once one admin exists, this route always 403s.
router.post("/bootstrap-admin", async (req, res) => {
  const existingCount = await AdminUser.countDocuments();
  if (existingCount > 0) {
    return res.status(403).json({ error: "An admin account already exists. Use /login, or ask an existing admin to create your account." });
  }
  const { username, password } = req.body;
  if (!username || !password || password.length < 8) {
    return res.status(400).json({ error: "Username and a password of at least 8 characters are required." });
  }
  const user = await AdminUser.create({ username, passwordHash: hashPassword(password) });
  res.json({ ok: true, username: user.username });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await AdminUser.findOne({ username });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  user.lastLogin = new Date();
  await user.save();
  res.json({
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    username: user.username
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token." });
  try {
    const payload = verifyToken(refreshToken);
    if (payload.type !== "refresh") throw new Error("Wrong token type.");
    const user = await AdminUser.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: "Session has been revoked. Please log in again." });
    }
    res.json({ accessToken: signAccessToken(user) });
  } catch (err) {
    return res.status(401).json({ error: "Refresh token expired or invalid. Please log in again." });
  }
});

// Invalidates every outstanding refresh token for this admin (bumps
// tokenVersion so old ones no longer match on /refresh).
router.post("/logout-everywhere", requireAdmin, async (req, res) => {
  await AdminUser.findByIdAndUpdate(req.adminId, { $inc: { tokenVersion: 1 } });
  res.json({ ok: true });
});

// ---- Admin management (any logged-in admin can manage admins) ----
router.get("/admins", requireAdmin, async (req, res) => {
  const admins = await AdminUser.find({}, "username createdAt lastLogin").sort({ createdAt: 1 }).lean();
  res.json(admins.map((a) => ({ ...a, isYou: String(a._id) === String(req.adminId) })));
});

router.post("/admins", requireAdmin, async (req, res) => {
  const username = (req.body.username || "").trim();
  const { password } = req.body;
  if (!username || !password || password.length < 8) {
    return res.status(400).json({ error: "Username and a password of at least 8 characters are required." });
  }
  if (await AdminUser.findOne({ username })) {
    return res.status(409).json({ error: "That username is already taken." });
  }
  const user = await AdminUser.create({ username, passwordHash: hashPassword(password) });
  res.json({ ok: true, id: user._id, username: user.username });
});

router.post("/admins/:id/reset-password", requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  // Bumping tokenVersion logs that admin out everywhere.
  const user = await AdminUser.findByIdAndUpdate(req.params.id, { passwordHash: hashPassword(password), $inc: { tokenVersion: 1 } });
  if (!user) return res.status(404).json({ error: "Admin not found." });
  res.json({ ok: true });
});

router.delete("/admins/:id", requireAdmin, async (req, res) => {
  if (String(req.params.id) === String(req.adminId)) {
    return res.status(400).json({ error: "You can't delete your own account while logged in." });
  }
  const user = await AdminUser.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "Admin not found." });
  res.json({ ok: true });
});

module.exports = router;
