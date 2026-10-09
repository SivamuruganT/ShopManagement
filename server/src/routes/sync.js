const express = require("express");
const { Bill, Expense, Product } = require("../db");
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
  const { terminalId, bills, expenses, products } = req.body;
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

  // Stock snapshot: make this shop's product list match the terminal's.
  let productsAccepted = false;
  if (Array.isArray(products)) {
    const shopId = req.shop.shopId;
    const now = new Date();
    const clean = products.filter((p) => p && p.sku);
    const ops = clean.map((p) => ({
      updateOne: {
        filter: { shopId, sku: String(p.sku) },
        update: {
          $set: {
            name: p.name,
            category: p.category,
            unit: p.unit,
            price: p.price,
            costPrice: p.costPrice,
            stockQty: p.stockQty,
            lowStockThreshold: p.lowStockThreshold,
            terminalId,
            syncedAt: now
          }
        },
        upsert: true
      }
    }));
    ops.push({ deleteMany: { filter: { shopId, sku: { $nin: clean.map((p) => String(p.sku)) } } } });
    await Product.bulkWrite(ops, { ordered: true });
    productsAccepted = true;
  }

  res.json({ acceptedBillKeys, acceptedExpenseKeys, productsAccepted });
});

module.exports = router;
