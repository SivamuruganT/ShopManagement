const express = require("express");
const { Bill, Expense } = require("../db");
const requireShopKey = require("../middleware/requireShopKey");

const router = express.Router();

/**
 * Single batch endpoint for a terminal's sync worker. Upserts on recordKey
 * (shopId:terminalId:table:localSeq) via $setOnInsert, so re-sending an
 * already-accepted batch after a crash or retry is always a no-op for those
 * rows rather than a duplicate - this is the whole point of the identity
 * scheme baked into the terminal app from day one.
 */
router.post("/batch", requireShopKey, async (req, res) => {
  const { terminalId, bills, expenses } = req.body;
  if (!terminalId) {
    return res.status(400).json({ error: "terminalId is required." });
  }

  const acceptedBillKeys = [];
  const acceptedExpenseKeys = [];

  if (Array.isArray(bills)) {
    for (const b of bills) {
      if (!b.recordKey) continue;
      await Bill.updateOne(
        { recordKey: b.recordKey },
        {
          $setOnInsert: {
            recordKey: b.recordKey,
            shopId: req.shop.shopId,
            terminalId,
            localSeq: b.localSeq,
            billNo: b.billNo,
            subtotal: b.subtotal,
            discount: b.discount,
            discountType: b.discountType,
            totalAmount: b.totalAmount,
            paymentMode: b.paymentMode,
            cashierName: b.cashierName,
            items: b.items || [],
            createdAt: new Date(b.createdAt)
          }
        },
        { upsert: true }
      );
      acceptedBillKeys.push(b.recordKey);
    }
  }

  if (Array.isArray(expenses)) {
    for (const e of expenses) {
      if (!e.recordKey) continue;
      await Expense.updateOne(
        { recordKey: e.recordKey },
        {
          $setOnInsert: {
            recordKey: e.recordKey,
            shopId: req.shop.shopId,
            terminalId,
            localSeq: e.localSeq,
            category: e.category,
            amount: e.amount,
            note: e.note,
            createdAt: new Date(e.createdAt)
          }
        },
        { upsert: true }
      );
      acceptedExpenseKeys.push(e.recordKey);
    }
  }

  res.json({ acceptedBillKeys, acceptedExpenseKeys });
});

module.exports = router;
