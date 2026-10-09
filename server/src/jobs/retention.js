const cron = require("node-cron");
const { Bill, Expense } = require("../db");

const RETENTION_DAYS = 2 * 365;

function cutoffDate() {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d;
}

/**
 * Explicit scheduled deletion rather than a Mongo TTL index - a TTL index
 * deletes silently in the background with no count returned and no way to
 * trigger it on demand, which makes it hard to verify or explain to the
 * person what actually happened. This runs daily and also exposes a
 * callable function for the admin web app's "Run Retention Cleanup Now"
 * button, so the 2-year policy is both automatic and inspectable.
 */
async function runRetentionSweep() {
  const cutoff = cutoffDate();
  const [billResult, expenseResult] = await Promise.all([
    Bill.deleteMany({ createdAt: { $lt: cutoff } }),
    Expense.deleteMany({ createdAt: { $lt: cutoff } })
  ]);
  const summary = {
    cutoffDate: cutoff,
    billsDeleted: billResult.deletedCount,
    expensesDeleted: expenseResult.deletedCount,
    ranAt: new Date()
  };
  console.log(`[retention] Deleted ${summary.billsDeleted} bills and ${summary.expensesDeleted} expenses older than ${cutoff.toISOString()}`);
  return summary;
}

function scheduleRetentionJob() {
  // Runs once a day at 03:15 server time - low-traffic hour, arbitrary but
  // deliberately not midnight (avoids clashing with other midnight cron jobs
  // someone might add later).
  cron.schedule("15 3 * * *", () => {
    runRetentionSweep().catch((err) => console.error("[retention] sweep failed:", err));
  });
}

module.exports = { runRetentionSweep, scheduleRetentionJob, RETENTION_DAYS };
