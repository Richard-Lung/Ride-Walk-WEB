import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "@/api/http";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    try {
      await http.post("/auth/register", { name, email, password });
      await http.post("/auth/login", { email, password });
      nav("/plan");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="container max-w-md mt-16">
      <div className="card animate-fade-in">
        <h2 className="text-xl font-semibold mb-2">Create account</h2>
        <p className="text-sm text-muted-foreground mb-4">Join and start generating routes in seconds.</p>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input className="input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary h-10 px-4">Sign up</button>
            <Link className="btn-outline h-10 px-4" to="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
