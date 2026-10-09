const bcrypt = require("bcryptjs");
const { Shop } = require("../db");

/**
 * Terminals authenticate with a per-shop API key (not a user login) - they
 * aren't a person signing in, they're a machine pushing data on a schedule.
 * The key is sent in the request body alongside shopId, since this is the
 * sync endpoint the terminal calls programmatically, not a browser.
 */
async function requireShopKey(req, res, next) {
  const { shopId, apiKey } = req.body;
  if (!shopId || !apiKey) {
    return res.status(401).json({ error: "shopId and apiKey are required." });
  }
  const shop = await Shop.findOne({ shopId });
  if (!shop) {
    return res.status(401).json({ error: "Unknown shop ID." });
  }
  const valid = bcrypt.compareSync(apiKey, shop.apiKeyHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid API key." });
  }
  req.shop = shop;
  next();
}

module.exports = requireShopKey;
