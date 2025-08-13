import { ENV } from "../config/env.js";

export async function geocode(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": `ride-walk-planner/1.0 (${ENV.USER_AGENT_EMAIL})`,
      "Accept": "application/json",
      "Referer": "https://example.com"
    }
  });
  if (!resp.ok) return null;
  const data: any[] = await resp.json();
  if (!data?.length) return null;
  const item = data[0];
  return { lat: Number(item.lat), lng: Number(item.lon), name: item.display_name };
}
