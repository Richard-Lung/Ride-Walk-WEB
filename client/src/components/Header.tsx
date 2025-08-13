import { useLocation, useNavigate, Link } from "react-router-dom";
import { http } from "../api/http";
import { useEffect, useState } from "react";
import { Sun, Moon, MountainSnow, Home } from "lucide-react";
import { useAuth } from "../state/AuthContext";

export default function Header() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");
  const [busy, setBusy] = useState(false);
  const { authed, setAuthed, refreshAuth } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Ensure auth status known on first mount (in case of reload)
  useEffect(() => {
    if (authed === null) {
      refreshAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gotoProtected = (path: string) => {
    if (authed) nav(path);
    else nav("/login");
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await http.post("/auth/logout", {});
      setAuthed(false);  // instant UI flip
      nav("/login");
    } finally {
      setBusy(false);
    }
  };

  const active = (p: string) =>
    pathname === p || pathname.startsWith(p)
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground";

  return (
    <div className="sticky top-0 z-40">
      <div className="container mt-4">
        <div className="glass rounded-lg border p-2.5 shadow-sm">
          <div className="flex items-center gap-2 px-1">
            <MountainSnow className="w-6 h-6 text-[hsl(var(--primary))]" />
            <Link to="/" className="font-semibold text-lg tracking-tight">Ride & Walk Planner</Link>

            <div className="ml-6 flex items-center gap-4 text-sm">
              <Link className={active("/")} to="/"><Home className="w-4 h-4 inline mr-1" />Home</Link>
              <button className={`${active("/plan")} underline-offset-4`} onClick={() => gotoProtected("/plan")}>
                Planner
              </button>
              <button className={`${active("/saved")} underline-offset-4`} onClick={() => gotoProtected("/saved")}>
                Saved
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                className="btn-outline h-9 px-3"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {authed ? (
                <button
                  className="h-9 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  onClick={signOut}
                  disabled={busy}
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link to="/register" className="btn-outline h-9 px-4">Create account</Link>
                  <Link
                    to="/login"
                    className="h-7 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
