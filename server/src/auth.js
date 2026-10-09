const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), username: user.username, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.tokenVersion, type: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyToken };
