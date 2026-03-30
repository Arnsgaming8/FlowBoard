const express = require("express");
const { pool } = require("./db");
const { authMiddleware } = require("./middleware");

const router = express.Router();

router.use(authMiddleware);

// Get user data
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT data FROM user_data WHERE user_id = $1", [req.userId]);
    if (result.rows.length === 0) {
      return res.json({ data: null });
    }
    res.json({ data: result.rows[0].data });
  } catch (err) {
    console.error("Get data error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Save user data
router.put("/", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Data object required" });
    }

    await pool.query(
      `INSERT INTO user_data (user_id, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET data = $2, updated_at = NOW()`,
      [req.userId, JSON.stringify(data)]
    );

    res.json({ message: "Saved" });
  } catch (err) {
    console.error("Save data error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
