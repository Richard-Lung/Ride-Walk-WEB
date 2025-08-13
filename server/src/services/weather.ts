// 3-day forecast starting **tomorrow** (not today) using Open-Meteo.
// We request 4 days and drop the first entry to reliably start at tomorrow.
export async function get3DayForecast(coord: { lat: number; lng: number }) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${coord.lat}&longitude=${coord.lng}` +
    `&timezone=auto&forecast_days=4` + // request 4 days
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(String(resp.status));
    const raw = await resp.json();
    const d = raw?.daily || {};

    // Helper to slice from "tomorrow" and keep exactly 3 days when possible
    const slice3 = (arr: any[]) =>
      Array.isArray(arr) ? arr.slice(1, 4) : [];

    return {
      daily: {
        time: slice3(d.time || []),
        temperature_2m_max: slice3(d.temperature_2m_max || []),
        temperature_2m_min: slice3(d.temperature_2m_min || []),
        precipitation_probability_max: slice3(d.precipitation_probability_max || []),
        weathercode: slice3(d.weathercode || [])
      }
    };
  } catch {
    // Consistent empty shape on failure
    return {
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_probability_max: [],
        weathercode: []
      }
    };
  }
}
