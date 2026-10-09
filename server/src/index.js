require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDb } = require("./db");
const { scheduleRetentionJob } = require("./jobs/retention");

const authRoutes = require("./routes/auth");
const syncRoutes = require("./routes/sync");
const reportRoutes = require("./routes/reports");
const shopRoutes = require("./routes/shops");
const maintenanceRoutes = require("./routes/maintenance");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // sync batches can carry a fair number of bills

app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/maintenance", maintenanceRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the built admin web SPA (web/dist) from this same service, so one
// Render web service covers both the API and the dashboard - no second
// service, no CORS setup needed between them.
const webDist = path.join(__dirname, "..", "..", "web", "dist");
app.use(express.static(webDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(webDist, "index.html"));
});

const PORT = process.env.PORT || 4000;

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  await connectDb(process.env.MONGODB_URI);
  scheduleRetentionJob();
  app.listen(PORT, () => console.log(`ECBill cloud server listening on port ${PORT}`));
}

start();
