import { useState } from "react";
import { http } from "../api/http";
import MapPlanner from "../components/MapPlanner";
import WeatherWidget from "../components/WeatherWidget";
import TravelMedia from "../components/TravelMedia";
import { motion } from "framer-motion";

export default function Planner() {
  const [kind, setKind] = useState<"bike" | "trek">("bike");
  const [locationQuery, setLocationQuery] = useState("");
  const [plan, setPlan] = useState<any>(null);
  const [stableTitle, setStableTitle] = useState<string>("");
  const [meta, setMeta] = useState({ title: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onPlan = async () => {
    setPlan(null);
    setBusy(true);
    setError("");
    try {
      const queryAtSubmit = locationQuery.trim();
      const { data } = await http.post("/plan/plan", { kind, locationQuery: queryAtSubmit });
      setPlan(data);
      setStableTitle(queryAtSubmit);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to generate plan");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!plan) return;
    await http.post("/routes", {
      title: meta.title || `${stableTitle || locationQuery} ${kind}`,
      description: meta.description,
      kind,
      locationQuery: stableTitle || locationQuery,
      imageUrl: plan?.media?.images?.[0] || "",
      imageCredit: plan?.media?.credit || "",
      imageLocation: plan?.media?.imageLocation || undefined,
      aboutHtml: plan?.media?.descriptionHtml || "",
      days: plan?.days
    });
    alert("Saved");
  };

  const mediaKey =
    plan?.days?.[0]?.start
      ? `${stableTitle}|${plan.days[0].start.lat.toFixed(4)},${plan.days[0].start.lng.toFixed(4)}`
      : stableTitle;

  return (
    <div className="container mt-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid lg:grid-cols-[420px_1fr] gap-6"
      >
        <div className="grid gap-4">
          <div className="card h-[300px] lg:h-[300px] overflow-visible">
            <h1 className="text-2xl font-semibold mb-1">Plan a route</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Pick a place and style. We fetch Unsplash imagery, Groq description, weather, and draw realistic paths.
            </p>
            <div className="grid gap-3">
              <input
                className="input"
                placeholder="Country or City"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
              />
              <select className="select" value={kind} onChange={e => setKind(e.target.value as any)}>
                <option value="bike">Bike (2 days, ≤60 km/day)</option>
                <option value="trek">Trek (loop, 5–15 km)</option>
              </select>
              <div className="flex gap-2">
                <button onClick={onPlan} disabled={busy || !locationQuery} className="btn-primary h-10 px-4">
                  {busy ? "Generating..." : "Generate"}
                </button>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
            </div>
          </div>

          <div className="h-[300px] lg:h-[140px]"></div>

          {plan && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card !mb-0 divide-y">
                {/* Daily stats */}
                <section className="py-3">
                  <h3 className="font-semibold mb-2">Daily stats</h3>
                  <div className="grid gap-2 text-sm">
                    {plan.days.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>Day {i + 1}</div>
                        <div className="text-muted-foreground">
                          {d.distanceKm.toFixed(1)} km · {d.durationMin} min
                        </div>
                        <div className="badge">{d.summary}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Details */}
                <section className="py-3 grid gap-3">
                  <h3 className="font-semibold">Details</h3>
                  <input
                    className="input"
                    placeholder="Route title"
                    value={meta.title}
                    onChange={e => setMeta({ ...meta, title: e.target.value })}
                  />
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Short description"
                    value={meta.description}
                    onChange={e => setMeta({ ...meta, description: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button onClick={onSave} className="btn-outline h-10 px-4 bg-green-600 hover:bg-green-700">
                      Save
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </div>



        {/* RIGHT COLUMN */}
        <div className="grid gap-4">
          {!plan ? (
            <div className="card">
              <div className="h-[70vh] grid place-items-center text-center">
                <div>
                  <h2 className="text-xl font-semibold mb-1">No route yet</h2>
                  <p className="text-muted-foreground">Enter a place, choose a mode, and press Generate.</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="kbd">Enter</span>
                    <span>to submit</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <TravelMedia key={mediaKey} data={plan.media} title={stableTitle ? `About ${stableTitle}` : undefined} />
              <WeatherWidget data={plan.weather} />
              <MapPlanner days={plan.days} />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
