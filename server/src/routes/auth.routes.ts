import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../config/env.js";

const router = Router();
const TOKEN_TTL_SEC = 60 * 60 * 24 * 2; // 2 days

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();
    return res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ sub: user.id }, ENV.JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: ENV.NODE_ENV === "production",
      maxAge: TOKEN_TTL_SEC * 1000
    });
    res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;
