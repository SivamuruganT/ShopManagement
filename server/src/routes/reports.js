const express = require("express");
const { Shop, Bill, Expense } = require("../db");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(requireAdmin);

const MAX_RANGE_DAYS = 2 * 365;

/**
 * Enforced here too, not just in the web app's date picker - the picker
 * stops a person from choosing a wider range, but a server-side check is
 * what actually guarantees it, since the API could be called directly.
 * Also matches the retention job: there's rarely anything to query past
 * 2 years back anyway once that job has run.
 */
function resolveRange(query) {
  const now = new Date();
  const earliestAllowed = new Date(now);
  earliestAllowed.setDate(earliestAllowed.getDate() - MAX_RANGE_DAYS);

  // The browser sends its UTC offset in minutes (IST = 330) so "a day" means
  // the admin's local day, not a UTC day. Without this, bills made between
  // midnight and 5:30 AM IST land on the previous day's report.
  const tz = Number.isFinite(parseInt(query.tz)) ? parseInt(query.tz) : 0;
  const offsetMs = tz * 60 * 1000;

  let start = query.start ? new Date(Date.parse(query.start + "T00:00:00.000Z") - offsetMs) : earliestAllowed;
  let end = query.end ? new Date(Date.parse(query.end + "T23:59:59.999Z") - offsetMs) : now;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD.");
  }
  if (start < earliestAllowed) start = earliestAllowed;
  if (end > now) end = now;
  if (start > end) throw new Error("Start date must be before end date.");

  return { start, end };
}

async function shopNameMap() {
  const shops = await Shop.find({}, "shopId name").lean();
  return Object.fromEntries(shops.map((s) => [s.shopId, s.name]));
}

router.get("/shops", async (req, res) => {
  const shops = await Shop.find({}, "shopId name createdAt").sort({ name: 1 }).lean();
  res.json(shops);
});

router.get("/overview", async (req, res) => {
  try {
    const { start, end } = resolveRange(req.query);
    const match = { createdAt: { $gte: start, $lte: end } };
    if (req.query.shopId) match.shopId = req.query.shopId;

    const [billAgg, cogsAgg, expenseAgg, byShopAgg, names] = await Promise.all([
      Bill.aggregate([{ $match: match }, { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalBills: { $sum: 1 } } }]),
      // Same COGS calculation the /pnl route uses, so the two pages can never
      // report different net profit for the same period.
      Bill.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: null, cogs: { $sum: { $multiply: ["$items.costPrice", "$items.qty"] } } } }
      ]),
      Expense.aggregate([{ $match: match }, { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }]),
      Bill.aggregate([
        { $match: match },
        { $group: { _id: "$shopId", revenue: { $sum: "$totalAmount" }, bills: { $sum: 1 } } },
        { $sort: { revenue: -1 } }
      ]),
      shopNameMap()
    ]);

    const totalRevenue = billAgg[0]?.totalRevenue || 0;
    const totalBills = billAgg[0]?.totalBills || 0;
    const totalExpenses = expenseAgg[0]?.totalExpenses || 0;
    const cogs = cogsAgg[0]?.cogs || 0;

    res.json({
      range: { start, end },
      totalRevenue,
      totalBills,
      cogs,
      totalExpenses,
      netProfit: totalRevenue - cogs - totalExpenses,
      byShop: byShopAgg.map((s) => ({ shopId: s._id, shopName: names[s._id] || s._id, revenue: s.revenue, bills: s.bills }))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const { start, end } = resolveRange(req.query);
    const match = { createdAt: { $gte: start, $lte: end } };
    if (req.query.shopId) match.shopId = req.query.shopId;
    if (req.query.paymentMode && req.query.paymentMode !== "All") match.paymentMode = req.query.paymentMode;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    const [rows, total, names] = await Promise.all([
      Bill.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Bill.countDocuments(match),
      shopNameMap()
    ]);

    res.json({
      rows: rows.map((b) => ({ ...b, shopName: names[b.shopId] || b.shopId })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/pnl", async (req, res) => {
  try {
    const { start, end } = resolveRange(req.query);
    const match = { createdAt: { $gte: start, $lte: end } };
    if (req.query.shopId) match.shopId = req.query.shopId;

    const [billAgg, cogsAgg, expenseByCategory] = await Promise.all([
      Bill.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }]),
      Bill.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: null, cogs: { $sum: { $multiply: ["$items.costPrice", "$items.qty"] } } } }
      ]),
      Expense.aggregate([{ $match: match }, { $group: { _id: "$category", amount: { $sum: "$amount" } } }, { $sort: { amount: -1 } }])
    ]);

    const revenue = billAgg[0]?.revenue || 0;
    const cogs = cogsAgg[0]?.cogs || 0;
    const totalExpenses = expenseByCategory.reduce((s, e) => s + e.amount, 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      range: { start, end },
      revenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      expenseBreakdown: expenseByCategory.map((e) => ({ category: e._id, amount: e.amount }))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
