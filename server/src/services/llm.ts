import { ENV } from "../config/env.js";

type SuggestOutput = {
  locationQuery: string;
  days: number;
  anchors: { name: string }[];
  hints?: {
    // bike
    bearingsDeg?: number[];     // [day1, day2]
    dayDistancesKm?: number[];  // [km1, km2] each 30–60
    // trek
    loopKm?: number;            // 5–15
    loopBearingsDeg?: number[]; // [b1, b2] degrees for the two loop rays
    loopSkew?: number;          // multiplier for second spoke length (0.7–1.4)
  };
};

function coerceNumber(n: any, def: number) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function extractJsonObject(text: string): any {
  try { return JSON.parse(text); } catch { }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    try { return JSON.parse(slice); } catch { }
  }
  return null;
}

async function callGroqJSON(system: string, user: string) {
  if (!ENV.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ENV.GROQ_MODEL,
      temperature: ENV.LLM_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Groq error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  const json = extractJsonObject(content);
  if (!json) throw new Error("Groq returned non-JSON");
  return json;
}

export async function suggestPlan(locationQuery: string, kind: "bike" | "trek"): Promise<SuggestOutput> {
  const system = [
    "You are a trip route planner that outputs ONLY JSON with no prose.",
    "Constraints:",
    "- kind=\"bike\": plan exactly 2 days, each 30–60 km, city-to-city progression.",
    "- kind=\"trek\": plan 1 loop day total distance 5–15 km returning to start.",
    "Include bearings and distances so each call can produce a different path.",
    "Schema:",
    "{",
    "  \"locationQuery\": string,",
    "  \"days\": number,",
    "  \"anchors\": [{ \"name\": string }...],",
    "  \"hints\": {",
    "    \"bearingsDeg\"?: number[],",
    "    \"dayDistancesKm\"?: number[],",
    "    \"loopKm\"?: number,",
    "    \"loopBearingsDeg\"?: number[],",
    "    \"loopSkew\"?: number",
    "  }",
    "}",
    "No comments. No trailing commas."
  ].join("\n");

  const user = JSON.stringify({
    locationQuery,
    kind,
    seed: Math.floor(Math.random() * 1e9)
  });

  // Fallbacks (with randomness for trek so it varies every call)
  if (kind === "bike") {
    const fallback: SuggestOutput = {
      locationQuery, days: 2, anchors: [{ name: locationQuery }],
      hints: { bearingsDeg: [80, 30], dayDistancesKm: [45, 45] }
    };
    try {
      const out = await callGroqJSON(system, user);
      const dists = (out?.hints?.dayDistancesKm || []).map((n: any) => clamp(coerceNumber(n, 45), 30, 60));
      const bearings = (out?.hints?.bearingsDeg || []).map((n: any) => coerceNumber(n, 80));
      return {
        locationQuery,
        days: 2,
        anchors: out?.anchors?.length ? out.anchors : fallback.anchors,
        hints: {
          dayDistancesKm: dists.length === 2 ? dists : fallback.hints?.dayDistancesKm,
          bearingsDeg: bearings.length === 2 ? bearings : fallback.hints?.bearingsDeg
        }
      };
    } catch { return fallback; }
  } else {
    // TREK fallback with randomness
    const base = Math.random() * 360;
    const delta = 180 + 40 + (Math.random() * 50 - 25); // spread 195–245
    const skew = 0.7 + Math.random() * 0.7; // 0.7–1.4
    const fallback: SuggestOutput = {
      locationQuery, days: 1, anchors: [{ name: locationQuery }],
      hints: {
        loopKm: clamp(8 + Math.random() * 4, 5, 15), // 8–12
        loopBearingsDeg: [base, base + delta],
        loopSkew: skew
      }
    };
    try {
      const out = await callGroqJSON(system, user);
      const lk = clamp(coerceNumber(out?.hints?.loopKm, fallback.hints!.loopKm!), 5, 15);
      const lb = Array.isArray(out?.hints?.loopBearingsDeg) && out.hints.loopBearingsDeg.length === 2
        ? out.hints.loopBearingsDeg.map((n: any) => coerceNumber(n, base))
        : fallback.hints!.loopBearingsDeg!;
      const ls = clamp(coerceNumber(out?.hints?.loopSkew, fallback.hints!.loopSkew!), 0.7, 1.4);
      return {
        locationQuery,
        days: 1,
        anchors: out?.anchors?.length ? out.anchors : fallback.anchors,
        hints: { loopKm: lk, loopBearingsDeg: lb, loopSkew: ls }
      };
    } catch { return fallback; }
  }
}
