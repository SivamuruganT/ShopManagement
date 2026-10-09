const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const { runRetentionSweep, RETENTION_DAYS } = require("../jobs/retention");

const router = express.Router();
router.use(requireAdmin);

router.get("/retention-policy", (req, res) => {
  res.json({ retentionDays: RETENTION_DAYS });
});

router.post("/run-retention-sweep", async (req, res) => {
  const summary = await runRetentionSweep();
  res.json(summary);
});

module.exports = router;
