import { useEffect, useState } from "react";
import { http } from "../api/http";
import MapPlanner from "../components/MapPlanner";
import WeatherWidget from "../components/WeatherWidget";
import TravelMedia from "../components/TravelMedia";

export default function SavedRoutes() {
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [weather, setWeather] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await http.get("/routes");
      setList(data);
    })();
  }, []);

  useEffect(() => {
    if (selected) {
      setTitle(selected.title || "");
      setDesc(selected.description || "");
      setMsg("");
      const start = selected?.days?.[0]?.start;
      if (start?.lat && start?.lng) {
        http
          .get("/plan/weather", { params: { lat: start.lat, lng: start.lng } })
          .then(({ data }) => setWeather(data))
          .catch(() => setWeather(null));
      } else {
        setWeather(null);
      }
    } else {
      setWeather(null);
    }
  }, [selected?._id]);

  const saveEdits = async () => {
    if (!selected) return;
    setBusy(true);
    setMsg("");
    try {
      const { data } = await http.put(`/routes/${selected._id}`, { title, description: desc });
      setSelected(data);
      setList((lst) => lst.map((r) => (r._id === data._id ? data : r)));
      setMsg("Saved changes");
      setTimeout(() => setMsg(""), 1800);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!confirm("Delete this route permanently?")) return;
    setBusy(true);
    try {
      await http.delete(`/routes/${selected._id}`);
      setList((lst) => lst.filter((r) => r._id !== selected._id));
      setSelected(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mt-8">
      {/* items-start ensures columns do NOT stretch to equal height */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Left: single card that auto-grows exactly with the list */}
        <div className="grid gap-3">
          <div className="card self-start">
            <h1 className="text-xl font-semibold mb-1">Saved routes</h1>
            <p className="text-sm text-muted-foreground">
              Click an item to view, edit, or delete it.
            </p>

            <div className="mt-3 grid gap-2">
              {list.map((r) => {
                const isActive = selected?._id === r._id;
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`w-full text-left rounded-md border p-3 transition-colors hover:bg-muted ${isActive ? "ring-2 ring-[hsl(var(--ring))]" : ""
                      }`}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.kind} · {r.locationQuery}
                        </div>
                      </div>
                      <div className="badge">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                );
              })}

              {list.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No saved routes yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: details for the selected route */}
        <div className="grid gap-4">
          {selected ? (
            <>
              <TravelMedia
                data={{
                  descriptionHtml: selected.aboutHtml || "",
                  images: selected.imageUrl ? [selected.imageUrl] : [],
                }}
                title={`About ${selected.locationQuery}`}
              />
              {weather && <WeatherWidget data={weather} />}
              <MapPlanner days={selected.days} />
              <div className="card">
                <h3 className="font-semibold mb-2">Daily stats</h3>
                {selected.days.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>Day {i + 1}</div>
                    <div className="text-muted-foreground">
                      {d.distanceKm.toFixed(1)} km · {d.durationMin} min
                    </div>
                    <div className="badge">{d.summary}</div>
                  </div>
                ))}
              </div>
              <div className="card grid gap-3">
                <h3 className="font-semibold">Edit details</h3>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Route title"
                />
                <textarea
                  className="textarea"
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Short description"
                />
                <div className="flex gap-2">
                  <button className="btn-primary h-10 px-4 bg-green-600 hover:bg-green-700" onClick={saveEdits} disabled={busy}>
                    Save changes
                  </button>
                  <button className="btn-outline h-10 px-4 bg-red-600 hover:bg-red-700" onClick={remove} disabled={busy}>
                    Delete
                  </button>
                </div>
                {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
              </div>
            </>
          ) : (
            <div className="card">
              <div className="h-[70vh] grid place-items-center text-center text-muted-foreground">
                Select a saved route to view and edit it.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
