import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";
import { LatLngExpression } from "leaflet";

export default function MapPlanner({ days }: { days: any[] }) {
  const center: LatLngExpression = days?.[0]?.start ? [days[0].start.lat, days[0].start.lng] : [45, 7];
  return (
    <div className="card p-0 overflow-hidden">
      <MapContainer center={center} zoom={11} style={{ height: "70vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {days?.map((d, idx) => {
          const coords = polyline.decode(d.polyline).map(([lat, lng]) => ({ lat, lng }));
          return (
            <div key={idx}>
              <Polyline positions={coords as any} />
              <CircleMarker center={[d.start.lat, d.start.lng]} radius={6}>
                <Popup>Start day {idx + 1}: {d.start.name}</Popup>
              </CircleMarker>
              <CircleMarker center={[d.end.lat, d.end.lng]} radius={6}>
                <Popup>End day {idx + 1}: {d.end.name}</Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
