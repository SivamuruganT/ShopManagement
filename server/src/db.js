const mongoose = require("mongoose");

async function connectDb(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");
}

// ---------- Shop ----------
// One document per shop. apiKey is stored hashed (bcrypt) - only a preview
// (last 4 chars) is kept in the clear so the admin can recognize which key
// is which without the full secret ever being retrievable again. If it's
// lost, the admin regenerates it (POST /api/shops/:id/regenerate-key) and
// re-enters it into every terminal for that shop.
const shopSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: String,
  apiKeyHash: { type: String, required: true },
  apiKeyPreview: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ---------- AdminUser ----------
// tokenVersion lets us invalidate every outstanding refresh token at once
// (on password change or "log out everywhere") without maintaining a
// token blacklist - a refresh token embeds the tokenVersion at issue time,
// and we reject it if it no longer matches the current value on the user.
const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  tokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

// ---------- Bill ----------
// recordKey is the idempotency key from the terminal's local identity scheme
// (shopId:terminalId:bills:localSeq) - unique index means re-sending the same
// batch after a crash or retry never creates a duplicate. `createdAt` is the
// ORIGINAL sale time from the terminal (used for all date-range reporting),
// not the time it happened to sync - a terminal that was offline for three
// days and then syncs still reports correctly against the days the sales
// actually happened on.
const billItemSchema = new mongoose.Schema(
  {
    sku: String,
    name: String,
    qty: Number,
    unitPrice: Number,
    costPrice: { type: Number, default: 0 },
    lineTotal: Number
  },
  { _id: false }
);

const billSchema = new mongoose.Schema({
  recordKey: { type: String, required: true, unique: true },
  shopId: { type: String, required: true, index: true },
  terminalId: { type: String, required: true },
  localSeq: Number,
  billNo: String,
  subtotal: Number,
  discount: Number,
  discountType: String,
  totalAmount: Number,
  paymentMode: String,
  cashierName: String,
  items: [billItemSchema],
  createdAt: { type: Date, required: true, index: true },
  syncedAt: { type: Date, default: Date.now }
});
billSchema.index({ shopId: 1, createdAt: 1 });

// ---------- Expense ----------
const expenseSchema = new mongoose.Schema({
  recordKey: { type: String, required: true, unique: true },
  shopId: { type: String, required: true, index: true },
  terminalId: { type: String, required: true },
  localSeq: Number,
  category: String,
  amount: Number,
  note: String,
  createdAt: { type: Date, required: true, index: true },
  syncedAt: { type: Date, default: Date.now }
});
expenseSchema.index({ shopId: 1, createdAt: 1 });

// ---------- Product (read-only stock snapshot) ----------
// A mirror of a terminal's catalog, replaced wholesale each time a terminal
// sends a snapshot - "latest terminal wins" per shop. Not subject to the
// 2-year retention sweep; it's current state, not history.
const productSchema = new mongoose.Schema({
  shopId: { type: String, required: true },
  sku: { type: String, required: true },
  name: String,
  category: String,
  unit: String,
  price: Number,
  costPrice: Number,
  stockQty: Number,
  lowStockThreshold: Number,
  terminalId: String,
  syncedAt: { type: Date, default: Date.now }
});
productSchema.index({ shopId: 1, sku: 1 }, { unique: true });

const Shop = mongoose.model("Shop", shopSchema);
const AdminUser = mongoose.model("AdminUser", adminUserSchema);
const Bill = mongoose.model("Bill", billSchema);
const Expense = mongoose.model("Expense", expenseSchema);
const Product = mongoose.model("Product", productSchema);

module.exports = { connectDb, Shop, AdminUser, Bill, Expense, Product };
