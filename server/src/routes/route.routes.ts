import { Router } from "express";
import RouteModel from "../models/Route.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Create
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, description, kind, locationQuery, imageUrl, aboutHtml, days } = req.body;
    const route = await RouteModel.create({
      owner: req.userId,
      title,
      description,
      kind,
      locationQuery,
      imageUrl,
      aboutHtml, // NEW
      days: (days || []).map((d: any) => ({ ...d, polyline: d.polyline })),
    });
    res.status(201).json(route);
  } catch (e) {
    next(e);
  }
});

// List for current user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const routes = await RouteModel.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json(routes);
  } catch (e) {
    next(e);
  }
});

// Get one
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const route = await RouteModel.findOne({ _id: req.params.id, owner: req.userId });
    if (!route) return res.status(404).json({ error: "Not found" });
    res.json(route);
  } catch (e) {
    next(e);
  }
});

// Update name/description (extendable if you later want to edit aboutHtml too)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { title, description, aboutHtml } = req.body;
    const $set: any = {};
    if (title !== undefined) $set.title = title;
    if (description !== undefined) $set.description = description;
    if (aboutHtml !== undefined) $set.aboutHtml = aboutHtml;

    const route = await RouteModel.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set },
      { new: true }
    );
    if (!route) return res.status(404).json({ error: "Not found" });
    res.json(route);
  } catch (e) {
    next(e);
  }
});

// Delete
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const deleted = await RouteModel.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
