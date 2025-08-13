import mongoose from "mongoose";
import { ENV } from "./env";

export async function connectDb() {
  if (!ENV.MONGO_URI) throw new Error("Missing MONGO_URI");
  await mongoose.connect(ENV.MONGO_URI);
}
