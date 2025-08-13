import polyline from "@mapbox/polyline";
import { geocode } from "./geocode.js";
import { ENV } from "../config/env.js";

type Coord = { lat: number; lng: number };

const BIKE_MAX_KM_PER_DAY = 60;
const TREK_MIN_KM = 5;
const TREK_MAX_KM = 15;

function destOffset(coord: Coord, km: number, bearingDeg: number): Coord {
  const R = 6371;
  const br = (bearingDeg * Math.PI) / 180;
  const d = km / R;
  const lat1 = (coord.lat * Math.PI) / 180;
  const lon1 = (coord.lng * Math.PI) / 180;
  const lat2 =
    Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(br));
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(br) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI };
}

async function orsRoute(
  profile: "cycling-regular" | "foot-hiking",
  coords: Coord[]
) {
  if (!ENV.ORS_API_KEY) return null;
  const url = `https://api.openrouteservice.org/v2/directions/${profile}`;
  const body = { coordinates: coords.map((c) => [c.lng, c.lat]), instructions: false };
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: ENV.ORS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const feat = data?.features?.[0];
  const geom = feat?.geometry?.coordinates || [];
  const summary = feat?.properties?.summary || {};
  const latlng = geom.map((p: number[]) => [p[1], p[0]]);
  const encoded = polyline.encode(latlng as any);
  const distanceKm = (summary.distance || 0) / 1000;
  const durationMin = (summary.duration || 0) / 60;
  return { polyline: encoded, distanceKm, durationMin };
}

async function osrmRoute(
  profile: "driving" | "cycling" | "walking",
  coords: Coord[]
) {
  const base = ENV.OSRM_URL || "https://router.project-osrm.org";
  const path = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${base}/route/v1/${profile}/${path}?overview=full&geometries=polyline`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  const r = data?.routes?.[0];
  if (!r) return null;
  const encoded = r.geometry;
  const distanceKm = (r.distance || 0) / 1000;
  const durationMin = (r.duration || 0) / 60;
  return { polyline: encoded, distanceKm, durationMin };
}

function saneDuration(kind: "bike" | "trek", distanceKm: number, durationMin: number) {
  const speedKmh = distanceKm / Math.max(0.0001, durationMin / 60);
  const limits =
    kind === "trek"
      ? { min: 2.5, max: 6.5, def: 4.5 }
      : { min: 10, max: 28, def: 16 };
  if (!isFinite(speedKmh) || speedKmh < limits.min || speedKmh > limits.max) {
    return Math.round((distanceKm / limits.def) * 60);
  }
  return Math.round(durationMin);
}

// Bike kept as-is (varies via LLM hints and adaptive capping)
async function routeBikeLeg(start: Coord, kmTarget: number, bearing: number, limitKm = BIKE_MAX_KM_PER_DAY) {
  let km = Math.max(10, kmTarget);
  let br = bearing;
  for (let attempt = 0; attempt < 8; attempt++) {
    const dest = destOffset(start, km, br);
    const r =
      (await orsRoute("cycling-regular", [start, dest])) ||
      (await osrmRoute("cycling", [start, dest])) ||
      (await osrmRoute("cycling", [start, dest]));
    if (r) {
      if (r.distanceKm <= limitKm + 0.3) return { route: r, dest };
      const factor = Math.max(0.4, (limitKm / r.distanceKm) * 0.92);
      km = Math.max(10, km * factor);
    } else {
      km = Math.max(10, km * 0.9);
      br += attempt % 2 === 0 ? 10 : -10;
    }
  }
  throw new Error("Routing failed to meet distance cap");
}

// TREK: variable loop using LLM bearings + skew, with adaptive distance control
async function routeTrekLoop(start: Coord, targetKm: number, hints?: any) {
  const desired = Math.max(TREK_MIN_KM, Math.min(TREK_MAX_KM, targetKm || 10));
  // Initial bearings: from LLM or randomized base
  const base = Math.random() * 360;
  let bearings: [number, number] = Array.isArray(hints?.loopBearingsDeg) && hints.loopBearingsDeg.length === 2
    ? [Number(hints.loopBearingsDeg[0]), Number(hints.loopBearingsDeg[1])]
    : [base, base + 200 + (Math.random() * 40 - 20)]; // spread 180–240 apart

  // Spoke lengths: second is skewed for shape variety
  let skew = Math.max(0.7, Math.min(1.4, Number(hints?.loopSkew ?? 1.0)));
  let spoke1 = Math.max(0.8, Math.min(8.0, (desired / 3) * (0.9 + Math.random() * 0.2)));
  let spoke2 = Math.max(0.8, Math.min(8.0, spoke1 * skew));

  let best: { polyline: string; distanceKm: number; durationMin: number } | null = null;

  for (let attempt = 0; attempt < 14; attempt++) {
    const w1 = destOffset(start, spoke1, bearings[0]);
    const w2 = destOffset(start, spoke2, bearings[1]);
    const chain = [start, w1, w2, start];

    const r =
      (await orsRoute("foot-hiking", chain)) ||
      (await osrmRoute("walking", chain)) ||
      (await osrmRoute("walking", chain));
    if (r) {
      best = r;
      if (r.distanceKm >= TREK_MIN_KM - 0.2 && r.distanceKm <= TREK_MAX_KM + 0.2) {
        return r; // within bounds
      }
      // Adapt spokes based on ratio
      const factorRaw = desired / Math.max(0.001, r.distanceKm);
      const factor = Math.max(0.6, Math.min(1.5, factorRaw));
      spoke1 = Math.max(0.6, Math.min(10, spoke1 * factor));
      spoke2 = Math.max(0.6, Math.min(10, spoke2 * factor));

      // Nudge bearings to escape local optima; add small random jitter for variety
      const jitter = 6 + Math.random() * 6;
      if (attempt % 2 === 0) {
        bearings = [bearings[0] + jitter, bearings[1] - jitter];
      } else {
        bearings = [bearings[0] - jitter, bearings[1] + jitter];
      }
    } else {
      // No route: shrink and rotate more aggressively
      spoke1 = Math.max(0.6, spoke1 * 0.9);
      spoke2 = Math.max(0.6, spoke2 * 0.9);
      const spin = 15 + Math.random() * 15;
      bearings = [bearings[0] + spin, bearings[1] - spin];
    }
  }

  if (best) return best;
  throw new Error("Routing failed");
}

export async function buildRoutedDays(seed: any, kind: "bike" | "trek") {
  const g = await geocode(seed.locationQuery);
  if (!g) throw new Error("Could not geocode locationQuery");
  const startCoord: Coord = { lat: g.lat, lng: g.lng };
  const days: any[] = [];

  if (kind === "bike") {
    const hints = seed?.hints || {};
    const bearings: number[] =
      Array.isArray(hints.bearingsDeg) && hints.bearingsDeg.length === 2 ? hints.bearingsDeg : [80, 30];
    const dists: number[] =
      Array.isArray(hints.dayDistancesKm) && hints.dayDistancesKm.length === 2 ? hints.dayDistancesKm : [45, 45];

    const leg1 = await routeBikeLeg(startCoord, dists[0], bearings[0], BIKE_MAX_KM_PER_DAY);
    const leg2 = await routeBikeLeg(leg1.dest, dists[1], bearings[1], BIKE_MAX_KM_PER_DAY);

    days.push({
      dateOffsetDays: 0,
      distanceKm: Number(leg1.route.distanceKm.toFixed(2)),
      durationMin: saneDuration("bike", leg1.route.distanceKm, leg1.route.durationMin),
      polyline: leg1.route.polyline,
      summary: "Day 1 ride",
      start: { ...startCoord, name: seed.anchors?.[0]?.name || "Start" },
      end: { ...leg1.dest, name: "Day 1 Destination" },
    });
    days.push({
      dateOffsetDays: 1,
      distanceKm: Number(leg2.route.distanceKm.toFixed(2)),
      durationMin: saneDuration("bike", leg2.route.distanceKm, leg2.route.durationMin),
      polyline: leg2.route.polyline,
      summary: "Day 2 ride",
      start: { ...leg1.dest, name: "Day 1 Destination" },
      end: { ...leg2.dest, name: "Day 2 Destination" },
    });
  } else {
    const loopKm = Math.max(TREK_MIN_KM, Math.min(TREK_MAX_KM, Number(seed?.hints?.loopKm ?? 10)));
    const r = await routeTrekLoop(startCoord, loopKm, seed?.hints);

    const km = Number(r.distanceKm.toFixed(2));
    const summaryNote = km < TREK_MIN_KM || km > TREK_MAX_KM ? " (adjusted near 5–15 km)" : "";

    days.push({
      dateOffsetDays: 0,
      distanceKm: km,
      durationMin: saneDuration("trek", km, r.durationMin),
      polyline: r.polyline,
      summary: "Trek loop" + summaryNote,
      start: { ...startCoord, name: seed.anchors?.[0]?.name || "Trailhead" },
      end: { ...startCoord, name: seed.anchors?.[0]?.name || "Trailhead" },
    });
  }

  return { days, startCoord };
}
