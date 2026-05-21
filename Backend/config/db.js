import mongoose from "mongoose";

const READY_STATE = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function getDbStatus() {
  const readyState = mongoose.connection.readyState;
  return {
    ready: readyState === 1,
    state: READY_STATE[readyState] ?? "unknown",
  };
}

export async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
