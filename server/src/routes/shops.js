const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Shop } = require("../db");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(requireAdmin);

function generateApiKey() {
  return crypto.randomBytes(24).toString("base64url");
}

router.get("/", async (req, res) => {
  const shops = await Shop.find({}, "shopId name address apiKeyPreview createdAt").sort({ createdAt: -1 }).lean();
  res.json(shops);
});

/**
 * shopId here should match the shop_id the terminal already generated
 * locally during its own Setup wizard - the admin creates the cloud-side
 * record using that same ID so the terminal's existing identity lines up,
 * rather than the cloud minting a second, different ID for the same shop.
 */
router.post("/", async (req, res) => {
  const { shopId, name, address } = req.body;
  if (!shopId || !name) {
    return res.status(400).json({ error: "shopId and name are required." });
  }
  const existing = await Shop.findOne({ shopId });
  if (existing) {
    return res.status(409).json({ error: "A shop with that Shop ID is already registered." });
  }
  const apiKey = generateApiKey();
  const shop = await Shop.create({
    shopId,
    name,
    address,
    apiKeyHash: bcrypt.hashSync(apiKey, 10),
    apiKeyPreview: apiKey.slice(-4)
  });
  // The plaintext key is only ever returned here, at creation time - it is
  // never retrievable again after this response. Copy it into the
  // terminal's Settings > Sync setup immediately.
  res.json({ shopId: shop.shopId, name: shop.name, apiKey });
});

router.post("/:shopId/regenerate-key", async (req, res) => {
  const shop = await Shop.findOne({ shopId: req.params.shopId });
  if (!shop) return res.status(404).json({ error: "Shop not found." });
  const apiKey = generateApiKey();
  shop.apiKeyHash = bcrypt.hashSync(apiKey, 10);
  shop.apiKeyPreview = apiKey.slice(-4);
  await shop.save();
  res.json({ shopId: shop.shopId, apiKey });
});

module.exports = router;
