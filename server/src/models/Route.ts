import mongoose from "mongoose";

const PointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    name: String,
  },
  { _id: false }
);

const DaySchema = new mongoose.Schema(
  {
    start: PointSchema,
    end: PointSchema,
    polyline: String,
    distanceKm: Number,
    durationMin: Number,
    summary: String,
  },
  { _id: false }
);

const RouteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: String,
    description: String,
    kind: { type: String, enum: ["bike", "trek"] },
    locationQuery: String,
    aboutHtml: String,            // NEW: saved “About …” HTML (from Groq)
    imageUrl: String,
    days: [DaySchema],
  },
  { timestamps: true }
);

export default mongoose.model("Route", RouteSchema);
