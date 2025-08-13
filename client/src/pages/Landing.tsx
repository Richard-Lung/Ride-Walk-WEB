import { useNavigate } from "react-router-dom";
import { MountainSnow, Compass, Bike, Footprints } from "lucide-react";
import { useCallback } from "react";
import { useAuth } from "../state/AuthContext";

export default function Landing() {
    const nav = useNavigate();
    const { authed } = useAuth();

    const ensureAuthThen = useCallback((path: string) => {
        nav(authed ? path : "/login");
    }, [authed, nav]);

    return (
        <div className="relative">
            <section className="container mt-12">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div className="animate-fade-in">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 dark:bg-white/10 px-3 py-1 text-xs">
                            <MountainSnow className="w-4 h-4 text-[hsl(var(--primary))]" />
                            Smart trip planning with real routes
                        </div>
                        <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
                            Plan beautiful bike and trek adventures
                        </h1>
                        <p className="mt-3 text-muted-foreground">
                            Generate realistic paths on actual roads and trails, cap daily distances automatically,
                            and save your favorites. Weather and a location image are included for context.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button onClick={() => ensureAuthThen("/plan")} className="btn-primary h-11 px-6">Start planning</button>
                            <button onClick={() => ensureAuthThen("/saved")} className="btn-outline h-11 px-6">Saved routes</button>
                        </div>
                        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                            <div className="card">
                                <div className="flex items-center gap-2 font-semibold"><Bike className="w-4 h-4" /> Bike</div>
                                <div className="text-muted-foreground mt-1">Two-day routes, up to 60 km per day.</div>
                            </div>
                            <div className="card">
                                <div className="flex items-center gap-2 font-semibold"><Footprints className="w-4 h-4" /> Trek</div>
                                <div className="text-muted-foreground mt-1">Loop hikes between 5–15 km.</div>
                            </div>
                            <div className="card">
                                <div className="flex items-center gap-2 font-semibold"><Compass className="w-4 h-4" /> Live map</div>
                                <div className="text-muted-foreground mt-1">Leaflet map with decoded polylines.</div>
                            </div>
                        </div>
                    </div>
                    <div className="h-[70vh] rounded-lg border overflow-hidden animate-slide-up flex items-center justify-center bg-white dark:bg-gray-900">
                        <img
                            src="https://media.istockphoto.com/id/656138678/photo/travel-planning-concept-on-map.jpg?s=612x612&w=0&k=20&c=knSQvSoQxdnrCBdvbWqDzA_zUeBetUmnXBUqe8iPDAA="
                            alt="Travel planning concept on map"
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            </section>

            <section className="container mt-12 mb-16">
                <div className="card">
                    <h2 className="text-xl font-semibold">How it works</h2>
                    <ol className="mt-3 grid gap-2 text-sm list-decimal list-inside text-muted-foreground">
                        <li>Enter a city or country and choose Bike or Trek.</li>
                        <li>We geocode, route on real networks, and compute distance and time.</li>
                        <li>See a 3-day weather forecast and a contextual image.</li>
                        <li>Save routes and revisit or edit anytime.</li>
                    </ol>
                </div>
            </section>
        </div>
    );
}
