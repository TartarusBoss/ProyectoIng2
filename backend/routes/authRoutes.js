import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const db = req.db;
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "missing" });

  const user = await db.get("SELECT * FROM users WHERE username = ?", username);
  if (!user) return res.status(401).json({ error: "invalid" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "invalid" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

export default router;
