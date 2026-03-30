require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDB } = require("./db");
const authRoutes = require("./auth");
const dataRoutes = require("./data");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "FlowBoard API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
