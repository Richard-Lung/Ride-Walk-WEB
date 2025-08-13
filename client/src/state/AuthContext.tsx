import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { http } from "../api/http";

type AuthCtx = {
    authed: boolean | null;
    setAuthed: (v: boolean) => void;
    refreshAuth: () => Promise<boolean>;
};

const AUTH_EVENT = "auth:changed";
const Ctx = createContext<AuthCtx | null>(null);

function readAuthedFromStorage(): boolean | null {
    const v = localStorage.getItem("authed");
    return v === "1" ? true : v === "0" ? false : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authed, _setAuthed] = useState<boolean | null>(() => readAuthedFromStorage());

    const broadcast = (next: boolean) => {
        try {
            localStorage.setItem("authed", next ? "1" : "0");
            window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: next }));
        } catch { }
    };

    const setAuthed = (next: boolean) => {
        _setAuthed(next);
        broadcast(next);
    };

    const refreshAuth = async () => {
        try {
            await http.get("/routes"); // ping protected endpoint
            _setAuthed(true);
            broadcast(true);
            return true;
        } catch {
            _setAuthed(false);
            broadcast(false);
            return false;
        }
    };

    useEffect(() => {
        // On first mount, if we don't know, probe the server once
        if (authed === null) {
            refreshAuth();
        }
        // Also listen for cross-component auth changes
        const onChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (typeof detail === "boolean") _setAuthed(detail);
        };
        window.addEventListener(AUTH_EVENT, onChange as EventListener);
        return () => window.removeEventListener(AUTH_EVENT, onChange as EventListener);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Ctx.Provider value={{ authed, setAuthed, refreshAuth }}>{children}</Ctx.Provider>;
}

export function useAuth() {
    const v = useContext(Ctx);
    if (!v) throw new Error("useAuth must be used within <AuthProvider>");
    return v;
}
