import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { authed, setAuthed, refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (authed) nav("/plan"); // if already logged in, redirect away
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await http.post("/auth/login", { email, password }); // sets cookie server-side
      setAuthed(true);     // immediate UI flip
      await refreshAuth(); // confirm cookie/session
      nav("/plan");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mt-10 max-w-md">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-muted-foreground mb-4">Welcome back.</p>
        <form className="grid gap-3" onSubmit={submit}>
          <input className="input" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn-primary h-10" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          {err && <div className="text-red-600 text-sm">{err}</div>}
        </form>
        <div className="mt-4 text-sm">
          No account? <Link to="/register" className="underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
