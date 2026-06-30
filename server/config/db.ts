import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export let isMongoDB = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("ℹ️ MONGODB_URI env variable not found. Using robust Local JSON DB fallback.");
    isMongoDB = false;
    return false;
  }

  try {
    // Attempt connecting with a 5-second timeout to prevent stalling during builds/runs
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB Atlas connected successfully!");
    isMongoDB = true;
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    console.log("ℹ️ Falling back to robust Local JSON DB.");
    isMongoDB = false;
    return false;
  }
}
