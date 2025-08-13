import {
  Sun, Cloud, CloudSun, CloudDrizzle, CloudRain, CloudSnow,
  CloudLightning, CloudFog
} from "lucide-react";

// Map WMO weather codes to an icon and a short label
function iconFor(code: number) {
  if (code === 0) return { Icon: Sun, label: "Clear" };
  if ([1, 2].includes(code)) return { Icon: CloudSun, label: "Partly cloudy" };
  if (code === 3) return { Icon: Cloud, label: "Overcast" };
  if ([45, 48].includes(code)) return { Icon: CloudFog, label: "Fog" };
  if ([51, 53, 55].includes(code)) return { Icon: CloudDrizzle, label: "Drizzle" };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { Icon: CloudRain, label: "Rain" };
  if ([66, 67].includes(code)) return { Icon: CloudRain, label: "Freezing rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, label: "Snow" };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, label: "Thunderstorm" };
  return { Icon: Cloud, label: "Cloudy" };
}

const df = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });

export default function WeatherWidget({ data }: { data: any }) {
  const daily = data?.daily || data?.forecast?.daily || null;

  const times: string[] = daily?.time || [];
  const tmax: number[] = daily?.temperature_2m_max || [];
  const tmin: number[] = daily?.temperature_2m_min || [];
  const rain: number[] = daily?.precipitation_probability_max || [];
  const codes: number[] = daily?.weathercode || [];

  const n = Math.min(times.length, tmax.length, tmin.length, rain.length);
  if (!daily || n === 0) return null;

  const rows = Array.from({ length: Math.min(3, n) }, (_, i) => ({
    date: times[i],
    hi: tmax[i],
    lo: tmin[i],
    p: Number.isFinite(rain[i]) ? rain[i] : 0,
    code: codes?.[i] ?? 3
  }));

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">3-day weather</h3>
        <span className="text-xs text-muted-foreground">Trip starts tomorrow</span>
      </div>

      <div className="grid gap-2">
        {rows.map((d) => {
          const { Icon, label } = iconFor(d.code);
          const pct = Math.max(0, Math.min(100, d.p));
          return (
            <div key={d.date} className="rounded-md p-2 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full glass grid place-items-center">
                  <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {df.format(new Date(d.date))} · <span className="text-muted-foreground">{label}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[hsl(var(--primary))]"
                      style={{ width: `${pct}%` }}
                      aria-label={`Rain ${pct}%`}
                    />
                  </div>
                </div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  {Math.round(d.lo)}–<span className="text-foreground font-semibold">{Math.round(d.hi)}</span> °C
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
