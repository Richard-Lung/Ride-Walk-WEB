import { config } from "dotenv";
config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  ORS_API_KEY: process.env.ORS_API_KEY || "",
  OSRM_URL: process.env.OSRM_URL || "https://router.project-osrm.org",
  USER_AGENT_EMAIL: process.env.USER_AGENT_EMAIL || "dev@example.com",

  // Groq
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  LLM_TEMPERATURE: Number(process.env.LLM_TEMPERATURE ?? 0.9),
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
};
