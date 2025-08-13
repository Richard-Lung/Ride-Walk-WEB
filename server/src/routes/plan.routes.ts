import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { suggestPlan } from "../services/llm.js";
import { buildRoutedDays } from "../services/routing.js";
import { get3DayForecast } from "../services/weather.js";
import { getLocationMedia } from "../services/media.js";

const router = Router();

// Generate a plan (returns days, weather, image, media)
router.post("/plan", requireAuth, async (req, res, next) => {
  try {
    const { kind, locationQuery } = req.body as { kind: "bike" | "trek"; locationQuery: string };
    if (!kind || !locationQuery) return res.status(400).json({ error: "kind and locationQuery are required" });

    const seed = await suggestPlan(locationQuery, kind);
    const { days, startCoord } = await buildRoutedDays(seed, kind);
    const weather = await get3DayForecast(startCoord);
    const media = await getLocationMedia(locationQuery);
    res.json({ days, weather, media });
  } catch (e) {
    next(e);
  }
});

// 3-day forecast for any lat/lng (used by Saved Routes)
router.get("/weather", requireAuth, async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "lat and lng query params are required" });
    }
    const weather = await get3DayForecast({ lat, lng });
    res.json(weather);
  } catch (e) {
    next(e);
  }
});

// New: media endpoint to fetch description + images on demand (Saved Routes)
router.get("/media", requireAuth, async (req, res, next) => {
  try {
    const location = String(req.query.location || "");
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    if (!location && (lat === undefined || lng === undefined)) {
      return res.status(400).json({ error: "Provide location or lat/lng" });
    }
    const media = await getLocationMedia(location);
    res.json(media);
  } catch (e) {
    next(e);
  }
});

export default router;
