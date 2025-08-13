import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import planRoutes from "./routes/plan.routes.js";
import routeRoutes from "./routes/route.routes.js";
import { ENV } from "./config/env.js";

const app = express();

app.use(cors({
  origin: ENV.CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/routes", routeRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

export default app;
