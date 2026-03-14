import mongoose from "mongoose";

const uri = process.env.MONGODB_URI as string;
if (!uri) throw new Error("MONGODB_URI missing");

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

let cached = globalThis._mongoose;
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    const options = {
      // MongoDB authentication options
      authSource: 'admin',
      // Add authentication if credentials are provided
      ...(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && {
        user: process.env.MONGODB_USERNAME,
        pass: process.env.MONGODB_PASSWORD
      })
    };
    
    cached.promise = mongoose.connect(uri, options)
      .then(m => {
        console.log("✅ MongoDB connected successfully");
        return m;
      })
      .catch(error => {
        console.error("❌ MongoDB connection error:", error);
        cached.promise = null; // Reset promise on error
        throw error;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on error
    throw error;
  }
}
